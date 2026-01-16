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

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
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

class NotificationUpdate(BaseModel):
    """Schema for updating notification"""
    read: Optional[bool] = None

class EmailRequest(BaseModel):
    """Schema for email requests"""
    to_email: EmailStr
    subject: str
    body: str

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

def send_email_task(to_email: str, subject: str, body: str):
    """Background task to send email"""
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_username or not smtp_password:
        logger.warning(f"SMTP credentials not set. Email to {to_email} skipped.")
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
        server.sendmail(smtp_username, to_email, msg.as_string())
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
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
async def get_notifications(
    user_id: str,
    type: Optional[str] = Query(None, description="Filter by notification type"),
    unread_only: bool = Query(False, description="Only return unread notifications"),
    limit: int = Query(100, ge=1, le=500, description="Maximum results to return")
):
    """
    Retrieve all notifications for a user with optional filtering.
    Results are sorted by timestamp (newest first).
    """
    notifications = store.get_by_user(
        user_id=user_id,
        notification_type=type,
        unread_only=unread_only,
        limit=limit
    )
    return notifications


@app.get(
    "/notifications/{user_id}/count",
    summary="Get unread notification count",
    tags=["Notifications"]
)
async def get_unread_count(user_id: str):
    """Get the count of unread notifications for a user."""
    count = store.get_unread_count(user_id)
    return {"user_id": user_id, "unread_count": count}


@app.post(
    "/notifications",
    response_model=NotificationResponse,
    status_code=201,
    summary="Create notification",
    tags=["Notifications"]
)
async def create_notification(notification: NotificationCreate):
    """
    Create a new notification for a user.
    """
    created = store.create(notification.user_id, notification)
    return created


@app.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark as read",
    tags=["Notifications"]
)
async def mark_notification_read(notification_id: str):
    """Mark a single notification as read."""
    updated = store.mark_as_read(notification_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
    return updated


@app.patch(
    "/notifications/{user_id}/read-all",
    response_model=BulkActionResponse,
    summary="Mark all as read",
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
        request.body
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
