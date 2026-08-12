from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
import schemas
from uuid import UUID

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/", response_model=List[schemas.Note])
def list_notes(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    case_id: Optional[str] = None,
    tag: Optional[str] = None,
):
    user_id = UUID(current_user["sub"])
    query = db.query(models.Note).filter(models.Note.user_id == user_id)
    return query.all()


@router.get("/{note_id}", response_model=schemas.Note)
def get_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    note = db.query(models.Note).filter(
        models.Note.id == UUID(note_id),
        models.Note.user_id == user_id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.post("/", response_model=schemas.Note, status_code=201)
def create_note(
    note_in: schemas.NoteCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    note = models.Note(
        user_id=user_id,
        case_id=UUID(note_in.case_id) if note_in.case_id else None,
        title=note_in.title,
        content=note_in.content,
        tags=note_in.tags,
        linked_act_id=note_in.linked_act_id,
        linked_chapter_id=note_in.linked_chapter_id,
        linked_section_number=note_in.linked_section_number,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/{note_id}", response_model=schemas.Note)
def update_note(
    note_id: str,
    note_in: schemas.NoteUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    note = db.query(models.Note).filter(
        models.Note.id == UUID(note_id),
        models.Note.user_id == user_id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = note_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)
    
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=204)
def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    note = db.query(models.Note).filter(
        models.Note.id == UUID(note_id),
        models.Note.user_id == user_id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
