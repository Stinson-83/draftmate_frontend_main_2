
import os
import uuid
from typing import Optional
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import psycopg2
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import razorpay

# Load environment variables from the root .env file
# We go up two levels from backend/subscriptions to root
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "SANDBOX").strip() if os.getenv("ENVIRONMENT") else "SANDBOX"
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "").strip()
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "").strip()

# Initialize Razorpay
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Database Connection
import sys
from sshtunnel import SSHTunnelForwarder
import paramiko

# Monkey-patch paramiko.DSSKey for compatibility with sshtunnel + paramiko 3.0+
if not hasattr(paramiko, "DSSKey"):
    class MockDSSKey:
        @classmethod
        def from_private_key_file(cls, filename, password=None):
            return None
    paramiko.DSSKey = MockDSSKey

# Configuration
POSTGRES_DSN = os.getenv("POSTGRES_DSN")
BASTION_IP = os.getenv("BASTION_IP")
# Check both generic path and specific path known to exist in container
SSH_KEY_PATH = os.getenv("SSH_KEY_PATH")
if SSH_KEY_PATH == "/app/bastion.key.pem" and not os.path.exists(SSH_KEY_PATH):
    # Fallback to known location
    SSH_KEY_PATH = "/app/backend/query/secrets/bastion.key.pem"

RDS_ENDPOINT = os.getenv("RDS_ENDPOINT")
SSH_USER = os.getenv("SSH_USER", "ec2-user")
LOCAL_BIND_PORT = 5432

# Global tunnel reference to keep it alive
_tunnel = None

def get_db_connection():
    global _tunnel
    try:
        # Check if we need to use SSH tunnel
        if BASTION_IP and SSH_KEY_PATH and RDS_ENDPOINT and os.path.exists(SSH_KEY_PATH):
            # Only start tunnel if not already active
            if _tunnel is None or not _tunnel.is_active:
                print(f"🔒 Starting SSH tunnel via {BASTION_IP}...")
                try:
                    _tunnel = SSHTunnelForwarder(
                        (BASTION_IP, 22),
                        ssh_username=SSH_USER,
                        ssh_pkey=SSH_KEY_PATH,
                        remote_bind_address=(RDS_ENDPOINT, 5432),
                        local_bind_address=('127.0.0.1', 5433) # Use distinct port to avoid conflict if any
                    )
                    _tunnel.start()
                    print(f"✅ Tunnel active on port {_tunnel.local_bind_port}")
                except Exception as e:
                    print(f"❌ Tunnel connection failed: {e}")
                    raise

            # Connect to local forwarded port
            conn = psycopg2.connect(
                host='127.0.0.1',
                port=_tunnel.local_bind_port,
                user=os.getenv("POSTGRES_USER", "lawuser"),
                password=os.getenv("POSTGRES_PASSWORD", "Siddchick2506"),
                dbname=os.getenv("POSTGRES_DB", "postgres")
            )
            return conn
        else:
            # Direct connection or Local Docker
            dsn = os.getenv("POSTGRES_DSN")
            # If DSN targets the Remote DB but we don't have tunnel, it might fail or connect to empty usage.
            # But let's fallback to it.
            if dsn:
                conn = psycopg2.connect(dsn)
            else:
                 conn = psycopg2.connect(
                    host=os.getenv("POSTGRES_HOST", "db"),
                    dbname=os.getenv("POSTGRES_DB", "lex_bot_db"),
                    user=os.getenv("POSTGRES_USER", "postgres"),
                    password=os.getenv("POSTGRES_PASSWORD", "password"),
                    port=os.getenv("POSTGRES_PORT", "5432")
                )
            return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

# Models
class CreateOrderModel(BaseModel):
    session_id: str
    plan_id: str

class VerifyOrderModel(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# Helper: Get User ID from Session
def get_user_from_session(session_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT user_id FROM sessions WHERE session_id = %s", (session_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=401, detail="Invalid session")
        return result[0]  # user_id
    finally:
        cur.close()
        conn.close()

# Endpoints

@app.get("/")
def read_root():
    return {"message": "Subscription Service Running", "env": ENVIRONMENT}

@app.get("/plans")
def get_plans():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, name, price, interval, features FROM subscription_plans")
        rows = cur.fetchall()
        plans = []
        for row in rows:
            plans.append({
                "id": row[0],
                "name": row[1],
                "price": float(row[2]),
                "interval": row[3],
                "features": row[4]
            })
        return plans
    finally:
        cur.close()
        conn.close()

@app.get("/current-status")
def get_current_status(session_id: str):
    user_id = get_user_from_session(session_id)
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Get latest active subscription
        cur.execute("SELECT s.plan_id, p.name, s.status, s.start_date, s.end_date FROM user_subscriptions s JOIN subscription_plans p ON s.plan_id = p.id WHERE s.user_id = %s AND s.status = 'active' AND s.end_date > CURRENT_TIMESTAMP ORDER BY s.end_date DESC LIMIT 1", (user_id,))
        
        row = cur.fetchone()
        if row:
            return {
                "active": True,
                "plan_id": row[0],
                "plan_name": row[1],
                "status": row[2],
                "start_date": row[3],
                "end_date": row[4]
            }
        else:
            return {"active": False}
    finally:
        cur.close()
        conn.close()



@app.get("/history")
def get_billing_history(session_id: str):
    user_id = get_user_from_session(session_id)
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT order_id, amount, currency, status, payment_time, plan_id, reference_id
            FROM payments
            WHERE user_id = %s
            ORDER BY payment_time DESC NULLS LAST, id DESC
        """, (user_id,))
        rows = cur.fetchall()
        history = []
        for row in rows:
            history.append({
                "id": f"INV-{str(row[0])[-8:]}",
                "order_id": row[0],
                "amount": f"₹{row[1]}",
                "currency": row[2] or "INR",
                "status": row[3],
                "date": row[4].strftime("%b %d, %Y") if row[4] else "Recent",
                "plan": (row[5] or "Subscription").replace('_', ' ').title(),
                "reference_id": row[6]
            })
        return history
    finally:
        cur.close()
        conn.close()


@app.post("/create-order")
def create_order(data: CreateOrderModel):
    user_id = get_user_from_session(data.session_id)
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Get User Email/Phone for Cashfree
        cur.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        user_row = cur.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        email = user_row[0]
        
        # Get Plan Details
        cur.execute("SELECT price, name FROM subscription_plans WHERE id = %s", (data.plan_id,))
        plan_row = cur.fetchone()
        if not plan_row:
             raise HTTPException(status_code=400, detail="Invalid Plan ID")
        price, plan_name = plan_row
        
        # Create Order in Razorpay
        try:
            order_amount = int(float(price) * 100) # Razorpay accepts amount in paise
            order_currency = "INR"
            receipt = f"rcpt_{str(user_id)[:8]}_{uuid.uuid4().hex[:5]}"
            
            razorpay_order = razorpay_client.order.create({
                "amount": order_amount,
                "currency": order_currency,
                "receipt": receipt
            })
            
            order_id = razorpay_order['id']
            
        except Exception as e:
            print(f"Razorpay Create Order Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

        # Save to Payments Table (with plan_id column handling)
        try:
            cur.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_id VARCHAR(100);")
            conn.commit()
            
            cur.execute("""
                INSERT INTO payments (order_id, user_id, amount, currency, status, plan_id)
                VALUES (%s, %s, %s, 'INR', 'PENDING', %s)
            """, (order_id, user_id, float(price), data.plan_id))
            conn.commit()
            
            return {
                "order_id": order_id,
                "amount": order_amount,
                "currency": order_currency,
                "key": RAZORPAY_KEY_ID
            }
            
        except Exception as e:
            print(f"Database Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to save order")

    finally:
        cur.close()
        conn.close()

@app.post("/verify")
def verify_payment(data: VerifyOrderModel):
    try:
        # Verify Signature
        params_dict = {
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        }
        
        try:
            razorpay_client.utility.verify_payment_signature(params_dict)
        except Exception as e:
            raise HTTPException(status_code=400, detail="Signature verification failed")
            
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("SELECT user_id, amount, status, plan_id FROM payments WHERE order_id = %s", (data.razorpay_order_id,))
            payment_record = cur.fetchone()
            
            if not payment_record:
                raise HTTPException(status_code=404, detail="Order not found in system")
                
            db_user_id = payment_record[0]
            db_amount = payment_record[1]
            db_status = payment_record[2]
            selected_plan_id = payment_record[3] if (len(payment_record) > 3 and payment_record[3]) else 'PRO_MONTHLY'
            
            if db_status == 'SUCCESS':
                 return {"message": "Already verified", "status": "SUCCESS"}

            # Update Payment Record Status
            cur.execute("UPDATE payments SET status = 'SUCCESS', reference_id = %s, payment_time = CURRENT_TIMESTAMP WHERE order_id = %s", (data.razorpay_payment_id, data.razorpay_order_id))
            
            # Handle Credit Top-Up Packs (e.g. Pack A, B, C)
            if "topup" in selected_plan_id.lower() or "pack" in selected_plan_id.lower():
                credit_map = {"pack_a": 1000, "pack_b": 1500, "pack_c": 2000, "topup_1000": 1000, "topup_1500": 1500, "topup_2000": 2000}
                added_credits = credit_map.get(selected_plan_id.lower(), 1000)
                
                cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INT DEFAULT 500;")
                cur.execute("UPDATE users SET credits = COALESCE(credits, 0) + %s WHERE id = %s", (added_credits, db_user_id))
                conn.commit()
                return {"message": f"Payment verified! Added {added_credits} credits to your account.", "status": "SUCCESS"}

            # Handle Subscription Plans (Monthly vs Annual)
            start_date = datetime.now()
            if "annual" in selected_plan_id.lower() or "year" in selected_plan_id.lower():
                end_date = start_date + relativedelta(years=1)
            else:
                end_date = start_date + relativedelta(months=1)
            
            # Expire previous active subscriptions
            cur.execute("UPDATE user_subscriptions SET status = 'expired' WHERE user_id = %s AND status = 'active'", (db_user_id,))
            
            # Activate new subscription
            cur.execute("""
                INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date)
                VALUES (%s, %s, 'active', %s, %s)
            """, (db_user_id, selected_plan_id, start_date, end_date))
            
            # Update user daily credit limit according to plan
            daily_credits = 2500 if ("pro" in selected_plan_id.lower() or "professional" in selected_plan_id.lower()) else 500
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_credits INT DEFAULT 500;")
            cur.execute("UPDATE users SET daily_credits = %s WHERE id = %s", (daily_credits, db_user_id))

            conn.commit()
            return {"message": "Payment verified and subscription activated successfully!", "status": "SUCCESS"}

        finally:
            cur.close()
            conn.close()

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Verification Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/webhook")
async def razorpay_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("x-razorpay-signature")
        
        # Verify webhook signature using razorpay client
        razorpay_client.utility.verify_webhook_signature(body.decode("utf-8"), signature, RAZORPAY_KEY_SECRET)
        
        data = await request.json()
        print(f"Webhook Received: {data}")
        
        event_type = data.get('event')
        if event_type == "payment.captured":
             pass # Logic to handle payment captured if not relying solely on verify endpoint
                 
        return {"status": "ok"}
    except Exception as e:
        print(f"Webhook Error: {e}")
        return {"status": "error"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8016)
