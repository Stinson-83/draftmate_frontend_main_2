from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
import schemas
from uuid import UUID

router = APIRouter(prefix="/hearings", tags=["hearings"])


@router.get("/", response_model=List[schemas.Hearing])
def list_hearings(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    case_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    user_id = UUID(current_user["sub"])
    query = db.query(models.Hearing).filter(models.Hearing.user_id == user_id)
    return query.all()


@router.get("/{hearing_id}", response_model=schemas.Hearing)
def get_hearing(
    hearing_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    hearing = db.query(models.Hearing).filter(
        models.Hearing.id == UUID(hearing_id),
        models.Hearing.user_id == user_id
    ).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    return hearing


@router.post("/", response_model=schemas.Hearing, status_code=201)
def create_hearing(
    hearing_in: schemas.HearingCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    hearing = models.Hearing(
        user_id=user_id,
        case_id=UUID(hearing_in.case_id) if hearing_in.case_id else None,
        client_id=UUID(hearing_in.client_id) if hearing_in.client_id else None,
        case_number=hearing_in.case_number,
        case_title=hearing_in.case_title,
        court=hearing_in.court,
        judge=hearing_in.judge,
        opposite_party=hearing_in.opposite_party,
        hearing_date=hearing_in.hearing_date,
        next_hearing_date=hearing_in.next_hearing_date,
        status=hearing_in.status,
        remarks=hearing_in.remarks,
        timeline=hearing_in.timeline,
    )
    db.add(hearing)
    db.commit()
    db.refresh(hearing)
    return hearing


@router.put("/{hearing_id}", response_model=schemas.Hearing)
def update_hearing(
    hearing_id: str,
    hearing_in: schemas.HearingUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    hearing = db.query(models.Hearing).filter(
        models.Hearing.id == UUID(hearing_id),
        models.Hearing.user_id == user_id
    ).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    
    update_data = hearing_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hearing, field, value)
    
    db.commit()
    db.refresh(hearing)
    return hearing


@router.delete("/{hearing_id}", status_code=204)
def delete_hearing(
    hearing_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    hearing = db.query(models.Hearing).filter(
        models.Hearing.id == UUID(hearing_id),
        models.Hearing.user_id == user_id
    ).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    
    db.delete(hearing)
    db.commit()
