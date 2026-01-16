import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notification_service")

app = FastAPI(title="Notification Service", version="1.0.0")

# CORS Configuration
origins = [
    "http://localhost:5173",  # Frontend
    "http://127.0.0.1:5173",
    "*" # Allow all for development convenience, tighten in prod
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmailRequest(BaseModel):
    to_email: EmailStr
    subject: str
    body: str

def send_email_task(to_email: str, subject: str, body: str):
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_username or not smtp_password:
        logger.warning(f"SMTP credentials not set. Email to {to_email} skipped. Content: {subject}")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_username, to_email, text)
        server.quit()
        logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")

@app.post("/send-email")
async def send_email(request: EmailRequest, background_tasks: BackgroundTasks):
    """
    Queue an email to be sent in the background.
    """
    background_tasks.add_task(send_email_task, request.to_email, request.subject, request.body)
    return {"message": "Email queued for sending"}

@app.get("/health")
def health_check():
    return {"status": "active", "service": "Notification Service"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8015)
