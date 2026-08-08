from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
import schemas
from uuid import UUID

router = APIRouter(prefix="/case-tracking", tags=["case-tracking"])


@router.get("/", response_model=List[schemas.CaseTracking])
def list_tracked_cases(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: Optional[str] = None,
):
    user_id = UUID(current_user["sub"])
    query = db.query(models.CaseTracking).filter(models.CaseTracking.user_id == user_id)
    return query.all()


@router.get("/{tracking_id}", response_model=schemas.CaseTracking)
def get_tracked_case(
    tracking_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    tracked_case = db.query(models.CaseTracking).filter(
        models.CaseTracking.id == UUID(tracking_id),
        models.CaseTracking.user_id == user_id
    ).first()
    if not tracked_case:
        raise HTTPException(status_code=404, detail="Tracked case not found")
    return tracked_case


@router.post("/", response_model=schemas.CaseTracking, status_code=201)
def create_tracked_case(
    tracking_in: schemas.CaseTrackingCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    tracked_case = models.CaseTracking(
        user_id=user_id,
        case_id=UUID(tracking_in.case_id) if tracking_in.case_id else None,
        cnr_number=tracking_in.cnr_number,
        case_number=tracking_in.case_number,
        case_title=tracking_in.case_title,
        court_establishment=tracking_in.court_establishment,
        case_stage=tracking_in.case_stage,
        last_updated=tracking_in.last_updated,
        next_hearing_date=tracking_in.next_hearing_date,
        next_hearing_time=tracking_in.next_hearing_time,
        latest_order=tracking_in.latest_order,
        latest_proceeding=tracking_in.latest_proceeding,
    )
    db.add(tracked_case)
    db.commit()
    db.refresh(tracked_case)
    return tracked_case


@router.put("/{tracking_id}", response_model=schemas.CaseTracking)
def update_tracked_case(
    tracking_id: str,
    tracking_in: schemas.CaseTrackingUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    tracked_case = db.query(models.CaseTracking).filter(
        models.CaseTracking.id == UUID(tracking_id),
        models.CaseTracking.user_id == user_id
    ).first()
    if not tracked_case:
        raise HTTPException(status_code=404, detail="Tracked case not found")
    
    update_data = tracking_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tracked_case, field, value)
    
    db.commit()
    db.refresh(tracked_case)
    return tracked_case


@router.delete("/{tracking_id}", status_code=204)
def delete_tracked_case(
    tracking_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    tracked_case = db.query(models.CaseTracking).filter(
        models.CaseTracking.id == UUID(tracking_id),
        models.CaseTracking.user_id == user_id
    ).first()
    if not tracked_case:
        raise HTTPException(status_code=404, detail="Tracked case not found")
    
    db.delete(tracked_case)
    db.commit()
