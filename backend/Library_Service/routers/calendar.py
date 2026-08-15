from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
import schemas
from uuid import UUID

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/", response_model=List[schemas.CalendarEvent])
def list_events(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    case_id: Optional[str] = None,
):
    user_id = UUID(current_user["sub"])
    query = db.query(models.CalendarEvent).filter(models.CalendarEvent.user_id == user_id)
    return query.all()


@router.get("/{event_id}", response_model=schemas.CalendarEvent)
def get_event(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    event = db.query(models.CalendarEvent).filter(
        models.CalendarEvent.id == UUID(event_id),
        models.CalendarEvent.user_id == user_id
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/", response_model=schemas.CalendarEvent, status_code=201)
def create_event(
    event_in: schemas.CalendarEventCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    event = models.CalendarEvent(
        user_id=user_id,
        case_id=UUID(event_in.case_id) if event_in.case_id else None,
        hearing_id=UUID(event_in.hearing_id) if event_in.hearing_id else None,
        diary_entry_id=event_in.diary_entry_id,
        title=event_in.title,
        type=event_in.type,
        date=event_in.date,
        time=event_in.time,
        notes=event_in.notes,
        is_diary_event=event_in.is_diary_event,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/{event_id}", response_model=schemas.CalendarEvent)
def update_event(
    event_id: str,
    event_in: schemas.CalendarEventUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    event = db.query(models.CalendarEvent).filter(
        models.CalendarEvent.id == UUID(event_id),
        models.CalendarEvent.user_id == user_id
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    event = db.query(models.CalendarEvent).filter(
        models.CalendarEvent.id == UUID(event_id),
        models.CalendarEvent.user_id == user_id
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
