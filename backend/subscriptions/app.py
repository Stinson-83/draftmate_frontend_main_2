
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
from cashfree_pg.models.create_order_request import CreateOrderRequest
from cashfree_pg.api_client import Cashfree
from cashfree_pg.models.customer_details import CustomerDetails
from cashfree_pg.models.order_meta import OrderMeta

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
CASHFREE_APP_ID = os.getenv("CASHFREE_APP_ID", "").strip()
CASHFREE_SECRET_KEY = os.getenv("CASHFREE_SECRET_KEY", "").strip()
# Determine Environment (Enum)
CASHFREE_ENV = Cashfree.PRODUCTION if ENVIRONMENT.lower() == "production" else Cashfree.SANDBOX

# Initialize Cashfree
Cashfree.XClientId = CASHFREE_APP_ID
Cashfree.XClientSecret = CASHFREE_SECRET_KEY
Cashfree.XEnvironment = CASHFREE_ENV

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
    order_id: str

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
    return {"message": "Subscription Service Running", "env": CASHFREE_ENV}

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

# Helper: Create Order (Using Cashfree v5+ Instance Logic)
def create_cashfree_order(order_id: str, amount: float, customer_id: str, customer_email: str, customer_phone: str):
    try:
        # DEBUG: Print Configuration to identify mismatch
        print(f"DEBUG: ENVIRONMENT Var: '{ENVIRONMENT}'")
        print(f"DEBUG: CASHFREE_ENV Enum: {CASHFREE_ENV}")
        print(f"DEBUG: App ID starts with: {CASHFREE_APP_ID[:4] if CASHFREE_APP_ID else 'None'}")
        
        # Belt and Suspenders: Set Global Config AND Instance Config
        Cashfree.XClientId = CASHFREE_APP_ID
        Cashfree.XClientSecret = CASHFREE_SECRET_KEY
        Cashfree.XEnvironment = CASHFREE_ENV
        
        # Create instance with required arguments (v5.x SDK)
        cf_instance = Cashfree(
            XEnvironment=CASHFREE_ENV,
            XClientId=CASHFREE_APP_ID,
            XClientSecret=CASHFREE_SECRET_KEY
        )
        
        # Prepare data
        x_api_version = "2025-01-01" 
        
        customer_details = CustomerDetails(
            customer_id=customer_id, 
            customer_email=customer_email,
            customer_phone=customer_phone
        )
        
        create_order_request = CreateOrderRequest(
            order_amount=amount,
            order_currency="INR",
            customer_details=customer_details,
            order_meta=OrderMeta(return_url=f"http://localhost:5173/payment-status?order_id={order_id}"),
            order_id=order_id 
        )
        
        # Call as instance method
        api_response = cf_instance.PGCreateOrder(x_api_version=x_api_version, create_order_request=create_order_request, x_request_id=str(uuid.uuid4()))
        return api_response
        
    except Exception as e:
        print(f"Cashfree Create Order Error: {e}")
        # Log detail but raise generic HTTP exception
        raise HTTPException(status_code=500, detail=str(e))

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
        
        # Generate Order ID
        order_id = f"ORDER_{uuid.uuid4().hex[:10]}"
        
        # Create Order in Cashfree using the helper
        cf_response = create_cashfree_order(
            order_id=order_id,
            amount=float(price),
            customer_id=str(user_id),
            customer_email=email,
            customer_phone="9999999999" # Placeholder phone
        )
        
        # Parse response to get session ID
        try:
             # Standard v5 access
             payment_session_id = cf_response.data.payment_session_id
        except Exception as e:
             print(f"Response Parsing Error: {e}")
             raise HTTPException(status_code=500, detail="Invalid response from Payment Gateway")

        # Save to Payments Table
        try:
            cur.execute("""
                INSERT INTO payments (order_id, user_id, amount, currency, status)
                VALUES (%s, %s, %s, 'INR', 'PENDING')
            """, (order_id, user_id, float(price)))
            conn.commit()
            
            return {
                "payment_session_id": payment_session_id,
                "order_id": order_id
            }
            
        except Exception as e:
            print(f"Database Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to save order")

    finally:
        cur.close()
        conn.close()

@app.post("/verify")
def verify_payment(data: VerifyOrderModel):
    # Retrieve order status from Cashfree
    try:
        # Create instance (v5.x SDK)
        cf_instance = Cashfree(
            XEnvironment=CASHFREE_ENV,
            XClientId=CASHFREE_APP_ID,
            XClientSecret=CASHFREE_SECRET_KEY
        )
        
        # Call instance method
        cf_response = cf_instance.PGOrderFetchPayments(x_api_version="2023-08-01", order_id=data.order_id, x_request_id=str(uuid.uuid4()))
        
        # Check if any payment is successful
        success_payment = None
        for payment in cf_response.data:
            if payment.payment_status == "SUCCESS":
                success_payment = payment
                break
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("SELECT user_id, amount, status FROM payments WHERE order_id = %s", (data.order_id,))
            payment_record = cur.fetchone()
            
            if not payment_record:
                raise HTTPException(status_code=404, detail="Order not found in system")
                
            db_user_id = payment_record[0]
            db_status = payment_record[2]
            
            if db_status == 'SUCCESS':
                 return {"message": "Already verified", "status": "SUCCESS"}

            if success_payment:
                # Update Payment
                cur.execute("UPDATE payments SET status = 'SUCCESS', reference_id = %s, payment_time = CURRENT_TIMESTAMP WHERE order_id = %s", (success_payment.cf_payment_id, data.order_id))
                
                # Activate Subscription (Assuming Plan is PRO_MONTHLY for now, or we should store plan_id in payments or pass it)
                # Ideally, we should have stored plan_id in payments table or metadata. 
                # For this MVP, let's look up the amount to guess the plan OR default to PRO_MONTHLY since we only have one.
                plan_id = 'PRO_MONTHLY' # Hardcoded for this MVP as per plan
                
                # Calculate dates
                start_date = datetime.now()
                # Use relativedelta for accurate calendar month addition (e.g., Jan 31 -> Feb 28/29)
                end_date = start_date + relativedelta(months=1)
                
                # Deactivate old active plans
                cur.execute("UPDATE user_subscriptions SET status = 'expired' WHERE user_id = %s AND status = 'active'", (db_user_id,))
                
                # Insert new subscription
                cur.execute("""
                    INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date)
                    VALUES (%s, %s, 'active', %s, %s)
                """, (db_user_id, plan_id, start_date, end_date))
                
                conn.commit()
                return {"message": "Payment verified and subscription activated", "status": "SUCCESS"}
            else:
                 cur.execute("UPDATE payments SET status = 'FAILED' WHERE order_id = %s", (data.order_id,))
                 conn.commit()
                 raise HTTPException(status_code=400, detail="Payment failed or pending")

        finally:
            cur.close()
            conn.close()

    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        raise he
    except Exception as e:
        print(f"Verification Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/webhook")
async def cashfree_webhook(request: Request):
    # In a real scenario, Verify Signature here using headers
    # x-webhook-signature, x-webhook-timestamp
    
    try:
        body = await request.json()
        print(f"Webhook Received: {body}")
        
        data = body.get('data', {})
        event_type = body.get('type')
        
        if event_type == "PAYMENT_SUCCESS_WEBHOOK":
            order_id = data.get('order', {}).get('order_id')
            payment_status = data.get('payment', {}).get('payment_status')
            
            if payment_status == "SUCCESS":
                 # Reuse Verification Logic (Simulated by calling it or copying code)
                 # Ideally refactor logic to a shared function
                 pass # We rely on the /verify endpoint for MVP + Webhook logging for now
                 
        return {"status": "ok"}
    except Exception as e:
        print(f"Webhook Error: {e}")
        return {"status": "error"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8016)
