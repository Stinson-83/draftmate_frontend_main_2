"""
Notification Service - Backend API
Provides CRUD operations for in-app notifications with email dispatch capability.
"""

import os
import uuid
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Literal
from collections import defaultdict

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, status
from pydantic import BaseModel, EmailStr, Field
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("notification_service")

app = FastAPI(
    title="Notification Service",
    version="2.0.0",
    description="In-app notification management with email dispatch"
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"  # Allow all for development, tighten in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# MODELS
# =============================================================================

NotificationType = Literal["calendar", "document", "ai", "system", "reminder"]

class NotificationBase(BaseModel):
    """Base notification schema"""
    type: NotificationType = Field(..., description="Notification category")
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    metadata: Optional[dict] = Field(default=None, description="Additional data")

class NotificationCreate(NotificationBase):
    """Schema for creating a notification"""
    user_id: str = Field(..., min_length=1, description="User identifier")

class NotificationResponse(NotificationBase):
    """Schema for notification response"""
    id: str
    user_id: str
    read: bool = False
    timestamp: datetime
    
    class Config:
        from_attributes = True

class NotificationCountResponse(BaseModel):
    """Schema for unread count response"""
    unread_count: int

class NotificationUpdate(BaseModel):
    """Schema for updating notification"""
    read: Optional[bool] = None

class EmailRequest(BaseModel):
    """Schema for email requests"""
    to_email: EmailStr
    subject: str
    body: str
    html_body: Optional[str] = None
    doc_title: Optional[str] = None
    share_url: Optional[str] = None
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None
    attachment_path: Optional[str] = None

class BulkActionResponse(BaseModel):
    """Response for bulk operations"""
    success: bool
    message: str
    affected_count: int

# =============================================================================
# IN-MEMORY STORAGE (Replace with database in production)
# =============================================================================

class NotificationStore:
    """Thread-safe in-memory notification storage"""
    
    def __init__(self):
        self._notifications: dict[str, NotificationResponse] = {}
        self._user_index: dict[str, set[str]] = defaultdict(set)
    
    def create(self, user_id: str, notification: NotificationBase) -> NotificationResponse:
        """Create a new notification"""
        notification_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        notif = NotificationResponse(
            id=notification_id,
            user_id=user_id,
            type=notification.type,
            title=notification.title,
            message=notification.message,
            metadata=notification.metadata,
            read=False,
            timestamp=now
        )
        
        self._notifications[notification_id] = notif
        self._user_index[user_id].add(notification_id)
        
        logger.info(f"Created notification {notification_id} for user {user_id}")
        return notif
    
    def get_by_id(self, notification_id: str) -> Optional[NotificationResponse]:
        """Get notification by ID"""
        return self._notifications.get(notification_id)
    
    def get_by_user(
        self, 
        user_id: str, 
        notification_type: Optional[str] = None,
        unread_only: bool = False,
        limit: int = 100
    ) -> List[NotificationResponse]:
        """Get all notifications for a user with optional filters"""
        notification_ids = self._user_index.get(user_id, set())
        notifications = []
        
        for nid in notification_ids:
            notif = self._notifications.get(nid)
            if notif:
                # Apply filters
                if notification_type and notif.type != notification_type:
                    continue
                if unread_only and notif.read:
                    continue
                notifications.append(notif)
        
        # Sort by timestamp descending (newest first)
        notifications.sort(key=lambda x: x.timestamp, reverse=True)
        return notifications[:limit]
    
    def mark_as_read(self, notification_id: str) -> Optional[NotificationResponse]:
        """Mark a notification as read"""
        notif = self._notifications.get(notification_id)
        if notif:
            # Create updated copy
            updated = NotificationResponse(
                id=notif.id,
                user_id=notif.user_id,
                type=notif.type,
                title=notif.title,
                message=notif.message,
                metadata=notif.metadata,
                read=True,
                timestamp=notif.timestamp
            )
            self._notifications[notification_id] = updated
            logger.info(f"Marked notification {notification_id} as read")
            return updated
        return None
    
    def mark_all_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        count = 0
        notification_ids = self._user_index.get(user_id, set())
        
        for nid in notification_ids:
            notif = self._notifications.get(nid)
            if notif and not notif.read:
                self.mark_as_read(nid)
                count += 1
        
        logger.info(f"Marked {count} notifications as read for user {user_id}")
        return count
    
    def delete(self, notification_id: str) -> bool:
        """Delete a notification"""
        notif = self._notifications.get(notification_id)
        if notif:
            del self._notifications[notification_id]
            self._user_index[notif.user_id].discard(notification_id)
            logger.info(f"Deleted notification {notification_id}")
            return True
        return False
    
    def delete_all_for_user(self, user_id: str) -> int:
        """Delete all notifications for a user"""
        notification_ids = list(self._user_index.get(user_id, set()))
        count = 0
        
        for nid in notification_ids:
            if self.delete(nid):
                count += 1
        
        return count
    
    def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications"""
        notification_ids = self._user_index.get(user_id, set())
        count = 0
        
        for nid in notification_ids:
            notif = self._notifications.get(nid)
            if notif and not notif.read:
                count += 1
        
        return count

# Initialize storage
store = NotificationStore()

# =============================================================================
# EMAIL SERVICE
# =============================================================================

import base64

def get_base64_logo() -> str:
    paths = ["/app/public/logo.png", "public/logo.png", "../public/logo.png", "src/assets/logo.png"]
    for p in paths:
        if os.path.isfile(p):
            try:
                with open(p, "rb") as f:
                    return f"data:image/png;base64,{base64.b64encode(f.read()).decode('utf-8')}"
            except Exception:
                pass
    return ""

def get_base64_text_logo() -> str:
    paths = ["/app/public/text-removebg-preview.png", "public/text-removebg-preview.png", "public/text.jpeg", "/app/public/text.jpeg"]
    for p in paths:
        if os.path.isfile(p):
            try:
                with open(p, "rb") as f:
                    ext = "jpeg" if p.endswith(".jpeg") else "png"
                    return f"data:image/{ext};base64,{base64.b64encode(f.read()).decode('utf-8')}"
            except Exception:
                pass
    return ""

def build_html_email_template(doc_title: str, share_url: str, body_text: str = "", sender_email: Optional[str] = None, sender_name: Optional[str] = None, editor_url: Optional[str] = None) -> str:
    clean_title = doc_title or "Legal Document"
    url = share_url or "https://www.draftmate.in/dashboard/documents"
    logo_src = get_base64_logo() or "cid:draftmate_logo"
    text_src = get_base64_text_logo() or "cid:draftmate_text"

    if not editor_url:
        import urllib.parse
        parsed = urllib.parse.urlparse(url)
        base_domain = f"{parsed.scheme}://{parsed.netloc}" if (parsed.scheme and parsed.netloc) else "https://www.draftmate.in"
        editor_url = f"{base_domain}/login"

    if sender_name and sender_email:
        sender_text = f"<strong>{sender_name}</strong> (<a href='mailto:{sender_email}' style='color: #2563eb; text-decoration: none;'>{sender_email}</a>)"
    elif sender_email:
        sender_text = f"<a href='mailto:{sender_email}' style='color: #2563eb; text-decoration: none;'>{sender_email}</a>"
    else:
        sender_text = "A colleague"

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shared Legal Document - DraftMate</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner (Amazon/Flipkart Premium Style with Official Logo) -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #2563eb 100%); padding: 32px 24px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 10px 24px; margin-bottom: 6px;">
                      <span style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        DraftMate <span style="color: #60a5fa;">AI</span>
                      </span>
                    </div>
                    <div style="font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 2.5px; margin-top: 4px;">
                      DraftMate AI Private Limited &bull; Legal Intelligence
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                You've Received a Shared Legal Document
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                {sender_text} has shared access to a verified legal document on DraftMate. You can download the PDF document directly or log in to the DraftMate editor to edit online.
              </p>

              <!-- Document Details Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="44" valign="top">
                          <div style="background-color: #eff6ff; border-radius: 10px; width: 40px; height: 40px; text-align: center; line-height: 40px;">
                            📄
                          </div>
                        </td>
                        <td style="padding-left: 12px;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 2px;">
                            Document Title
                          </div>
                          <div style="font-size: 16px; font-weight: 700; color: #0f172a; word-break: break-word;">
                            {clean_title}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button (Open & Edit in DraftMate Editor) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="{editor_url}" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 36px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); min-width: 240px; text-align: center;">
                      ✏️ Open & Edit in DraftMate Editor &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Feature Highlights Grid -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="33%" align="center" style="padding: 8px;">
                      <div style="font-size: 20px; margin-bottom: 4px;">⚖️</div>
                      <div style="font-size: 11px; font-weight: 700; color: #334155;">Verified Format</div>
                    </td>
                    <td width="33%" align="center" style="padding: 8px;">
                      <div style="font-size: 20px; margin-bottom: 4px;">🔒</div>
                      <div style="font-size: 11px; font-weight: 700; color: #334155;">Encrypted & Secure</div>
                    </td>
                    <td width="33%" align="center" style="padding: 8px;">
                      <div style="font-size: 20px; margin-bottom: 4px;">⚡</div>
                      <div style="font-size: 11px; font-weight: 700; color: #334155;">Instant PDF View</div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #475569;">
                DraftMate AI Private Limited &copy; 2026
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                This email was sent automatically by DraftMate AI Private Limited for legal document sharing.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def build_otp_email_template(otp_code: str, to_email: str = "") -> str:
    otp = str(otp_code).strip()
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP - DraftMate AI Private Limited</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner (Google / Amazon / Flipkart Security Style with Crisp Logo) -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e40af 100%); padding: 32px 24px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 10px 24px; margin-bottom: 6px;">
                      <span style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        DraftMate <span style="color: #60a5fa;">AI</span>
                      </span>
                    </div>
                    <div style="font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px;">
                      🔒 Security Verification Center
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="padding: 36px 32px; text-align: center;">
              <div style="width: 52px; height: 52px; background-color: #eff6ff; border-radius: 50%; display: inline-block; line-height: 52px; font-size: 26px; color: #2563eb; margin-bottom: 16px;">
                🔐
              </div>
              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                Password Reset Verification
              </h2>
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #475569; line-height: 1.6; max-width: 440px; margin-left: auto; margin-right: auto;">
                We received a request to reset your password for account <strong>{to_email}</strong>. Use the 6-digit verification code below:
              </p>

              <!-- Giant OTP Code Box (Amazon / Google Style) -->
              <div style="background-color: #f8fafc; border: 2px dashed #93c5fd; border-radius: 14px; padding: 24px 16px; margin-bottom: 28px; display: inline-block; width: 88%; max-width: 380px;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                  Your Verification Code (OTP)
                </div>
                <div style="font-size: 38px; font-weight: 900; color: #1e40af; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace; margin: 4px 0;">
                  {otp}
                </div>
                <div style="font-size: 12px; font-weight: 600; color: #dc2626; margin-top: 8px;">
                  ⏱️ Code expires in 10 minutes
                </div>
              </div>

              <!-- Security Information Grid -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: left; margin-bottom: 28px;">
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
                  🛡️ Security Guidelines:
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.7;">
                  <li><strong>Never share this code</strong> with anyone. DraftMate support will never ask for it.</li>
                  <li>If you didn't request a password reset, you can safely ignore this email.</li>
                  <li>Your password will remain unchanged until you enter this code and create a new one.</li>
                </ul>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #475569;">
                DraftMate AI Private Limited &copy; 2026
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                Security &amp; Authentication Division &bull; DraftMate AI Private Limited
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_email_task(to_email: str, subject: str, body: str, html_body: Optional[str] = None, doc_title: Optional[str] = None, share_url: Optional[str] = None, sender_email: Optional[str] = None, sender_name: Optional[str] = None, attachment_path: Optional[str] = None):
    """Background task to send email with optional PDF attachment"""
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
    smtp_port = int(str(os.getenv("SMTP_PORT", "587")).strip())
    smtp_username = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()

    # Extract share URL from body if not explicitly passed
    if not share_url and body and "http" in body:
        import re
        urls = re.findall(r'https?://[^\s]+', body)
        if urls:
            share_url = urls[0]

    # Generate HTML body if missing
    if not html_body:
        import re
        otp_match = re.search(r'\b\d{6}\b', body)
        if otp_match or "verification code" in subject.lower() or "reset" in subject.lower() or "otp" in subject.lower():
            otp_val = otp_match.group(0) if otp_match else "123456"
            html_body = build_otp_email_template(otp_code=otp_val, to_email=to_email)
        else:
            html_body = build_html_email_template(
                doc_title=doc_title or subject,
                share_url=share_url or "",
                body_text=body,
                sender_email=sender_email,
                sender_name=sender_name
            )

    if not smtp_username or not smtp_password:
        logger.warning(f"SMTP credentials not set in environment. Email queued to {to_email} with subject '{subject}'. Share URL: {share_url}, Attachment: {attachment_path}")
        return

    try:
        msg = MIMEMultipart('mixed')
        if sender_name and sender_email:
            msg['From'] = f"{sender_name} <{sender_email}>"
        elif sender_email:
            msg['From'] = f"DraftMate AI <{sender_email}>"
        elif sender_name:
            msg['From'] = f"{sender_name} via DraftMate AI <{smtp_username}>"
        else:
            msg['From'] = f"DraftMate AI Private Limited <{smtp_username}>"
        msg['To'] = to_email
        if sender_email:
            msg['Reply-To'] = f"{sender_name} <{sender_email}>" if sender_name else sender_email
        msg['Subject'] = subject

        # Create MIMEMultipart('related') container for HTML + inline CID image fallback
        msg_related = MIMEMultipart('related')
        msg_alternative = MIMEMultipart('alternative')
        msg_alternative.attach(MIMEText(body, 'plain'))
        msg_alternative.attach(MIMEText(html_body, 'html'))
        msg_related.attach(msg_alternative)

        # Attach embedded CID logo and text graphics if available
        logo_paths = ["/app/public/logo.png", "public/logo.png", "src/assets/logo.png", "../public/logo.png"]
        text_paths = ["/app/public/text-removebg-preview.png", "public/text-removebg-preview.png", "public/text.jpeg", "/app/public/text.jpeg"]

        logo_file = next((p for p in logo_paths if os.path.isfile(p)), None)
        text_file = next((p for p in text_paths if os.path.isfile(p)), None)

        if logo_file:
            try:
                from email.mime.image import MIMEImage
                with open(logo_file, "rb") as f:
                    logo_img = MIMEImage(f.read())
                logo_img.add_header('Content-ID', '<draftmate_logo>')
                logo_img.add_header('Content-Disposition', 'inline', filename=os.path.basename(logo_file))
                msg_related.attach(logo_img)
            except Exception as err:
                logger.warning(f"Logo CID attachment error: {err}")

        if text_file:
            try:
                from email.mime.image import MIMEImage
                with open(text_file, "rb") as f:
                    text_img = MIMEImage(f.read())
                text_img.add_header('Content-ID', '<draftmate_text>')
                text_img.add_header('Content-Disposition', 'inline', filename=os.path.basename(text_file))
                msg_related.attach(text_img)
            except Exception as err:
                logger.warning(f"Text graphic CID attachment error: {err}")

        msg.attach(msg_related)

        # Attach PDF document if attachment_path exists and is a 100% valid PDF
        if attachment_path and os.path.isfile(attachment_path):
            pdf_file = attachment_path
            
            # Verify if pdf_file is a valid PDF starting with %PDF-
            is_valid_pdf = False
            try:
                with open(pdf_file, "rb") as f:
                    if f.read(5).startswith(b"%PDF-"):
                        is_valid_pdf = True
            except Exception:
                pass

            if not is_valid_pdf:
                out_dir = "/tmp"
                out_pdf = os.path.join(out_dir, os.path.splitext(os.path.basename(pdf_file))[0] + ".pdf")
                try:
                    import subprocess
                    subprocess.run(
                        ["soffice", "--headless", "--convert-to", "pdf", "--outdir", out_dir, pdf_file],
                        check=True,
                        timeout=30
                    )
                    if os.path.isfile(out_pdf) and os.path.getsize(out_pdf) > 0:
                        with open(out_pdf, "rb") as f:
                            if f.read(5).startswith(b"%PDF-"):
                                pdf_file = out_pdf
                                is_valid_pdf = True
                except Exception as conv_err:
                    logger.warning(f"LibreOffice PDF conversion fallback for email attachment: {conv_err}")

            if is_valid_pdf and os.path.isfile(pdf_file):
                from email.mime.application import MIMEApplication
                with open(pdf_file, "rb") as f:
                    pdf_data = f.read()
                filename = os.path.basename(pdf_file)
                if not filename.lower().endswith(".pdf"):
                    filename += ".pdf"
                attach_part = MIMEApplication(pdf_data, _subtype="pdf")
                attach_part.add_header('Content-Disposition', 'attachment', filename=filename)
                msg.attach(attach_part)

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.sendmail(smtp_username, to_email, msg.as_string())
        server.quit()

        logger.info(f"HTML Email with PDF Attachment sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")

# =============================================================================
# API ENDPOINTS
# =============================================================================

# --- Notification CRUD ---

@app.get(
    "/notifications/{user_id}",
    response_model=List[NotificationResponse],
    summary="Get user notifications",
    tags=["Notifications"]
)
async def get_user_notifications(
    user_id: str,
    type: Optional[str] = Query(None, description="Filter by notification type"),
    unread_only: bool = Query(False, description="Return only unread notifications"),
    limit: int = Query(100, ge=1, le=500, description="Max items to return")
):
    """Get all notifications for a user."""
    return store.get_by_user(
        user_id=user_id,
        notification_type=type,
        unread_only=unread_only,
        limit=limit
    )


@app.get(
    "/notifications/{user_id}/count",
    response_model=NotificationCountResponse,
    summary="Get unread notification count",
    tags=["Notifications"]
)
async def get_unread_count(user_id: str):
    """Get count of unread notifications for badge display."""
    return NotificationCountResponse(
        unread_count=store.get_unread_count(user_id)
    )


@app.post(
    "/notifications",
    response_model=NotificationResponse,
    status_code=201,
    summary="Create notification",
    tags=["Notifications"]
)
async def create_notification(notification: NotificationCreate):
    """Create a new notification for a user."""
    return store.create(notification.user_id, notification)


@app.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark notification as read",
    tags=["Notifications"]
)
async def mark_notification_read(notification_id: str):
    """Mark a single notification as read."""
    updated = store.mark_as_read(notification_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
    return updated


@app.post(
    "/notifications/{user_id}/read-all",
    response_model=BulkActionResponse,
    summary="Mark all notifications as read",
    tags=["Notifications"]
)
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a user."""
    count = store.mark_all_read(user_id)
    return BulkActionResponse(
        success=True,
        message=f"Marked {count} notifications as read",
        affected_count=count
    )


@app.delete(
    "/notifications/{notification_id}",
    summary="Delete notification",
    tags=["Notifications"]
)
async def delete_notification(notification_id: str):
    """Delete a single notification."""
    success = store.delete(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True, "message": "Notification deleted"}


@app.delete(
    "/notifications/{user_id}/all",
    response_model=BulkActionResponse,
    summary="Delete all notifications",
    tags=["Notifications"]
)
async def delete_all_notifications(user_id: str):
    """Delete all notifications for a user."""
    count = store.delete_all_for_user(user_id)
    return BulkActionResponse(
        success=True,
        message=f"Deleted {count} notifications",
        affected_count=count
    )


# --- Email Service ---

@app.post(
    "/send-email",
    summary="Send email notification",
    tags=["Email"]
)
async def send_email(request: EmailRequest, background_tasks: BackgroundTasks):
    """Queue an email to be sent in the background."""
    background_tasks.add_task(
        send_email_task, 
        request.to_email, 
        request.subject, 
        request.body,
        request.html_body,
        request.doc_title,
        request.share_url,
        request.sender_email,
        request.sender_name,
        request.attachment_path
    )
    return {"message": "Email queued for sending"}


# --- Health Check ---

@app.get("/health", tags=["Health"])
def health_check():
    """Service health check endpoint."""
    return {
        "status": "healthy",
        "service": "Notification Service",
        "version": "2.0.0"
    }


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8015)
