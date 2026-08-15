from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
import schemas
from uuid import UUID

router = APIRouter(prefix="/video-links", tags=["video-links"])


@router.get("/", response_model=List[schemas.VideoLink])
def list_video_links(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    platform: Optional[str] = None,
    case_id: Optional[str] = None,
):
    user_id = UUID(current_user["sub"])
    query = db.query(models.VideoLink).filter(models.VideoLink.user_id == user_id)
    return query.all()


@router.get("/{video_link_id}", response_model=schemas.VideoLink)
def get_video_link(
    video_link_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    video_link = db.query(models.VideoLink).filter(
        models.VideoLink.id == UUID(video_link_id),
        models.VideoLink.user_id == user_id
    ).first()
    if not video_link:
        raise HTTPException(status_code=404, detail="Video link not found")
    return video_link


@router.post("/", response_model=schemas.VideoLink, status_code=201)
def create_video_link(
    video_link_in: schemas.VideoLinkCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    video_link = models.VideoLink(
        user_id=user_id,
        case_id=UUID(video_link_in.case_id) if video_link_in.case_id else None,
        hearing_id=UUID(video_link_in.hearing_id) if video_link_in.hearing_id else None,
        case_number=video_link_in.case_number,
        case_title=video_link_in.case_title,
        court=video_link_in.court,
        platform=video_link_in.platform,
        meeting_link=video_link_in.meeting_link,
        meeting_id=video_link_in.meeting_id,
        passcode=video_link_in.passcode,
        hearing_date=video_link_in.hearing_date,
        start_time=video_link_in.start_time,
        notes=video_link_in.notes,
    )
    db.add(video_link)
    db.commit()
    db.refresh(video_link)
    return video_link


@router.put("/{video_link_id}", response_model=schemas.VideoLink)
def update_video_link(
    video_link_id: str,
    video_link_in: schemas.VideoLinkUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    video_link = db.query(models.VideoLink).filter(
        models.VideoLink.id == UUID(video_link_id),
        models.VideoLink.user_id == user_id
    ).first()
    if not video_link:
        raise HTTPException(status_code=404, detail="Video link not found")
    
    update_data = video_link_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(video_link, field, value)
    
    db.commit()
    db.refresh(video_link)
    return video_link


@router.delete("/{video_link_id}", status_code=204)
def delete_video_link(
    video_link_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    video_link = db.query(models.VideoLink).filter(
        models.VideoLink.id == UUID(video_link_id),
        models.VideoLink.user_id == user_id
    ).first()
    if not video_link:
        raise HTTPException(status_code=404, detail="Video link not found")
    
    db.delete(video_link)
    db.commit()
