from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
import schemas
from uuid import UUID

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("/", response_model=List[schemas.Case])
def list_cases(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    client_id: Optional[str] = None,
    search: Optional[str] = None,
):
    user_id = UUID(current_user["sub"])
    query = db.query(models.Case).filter(models.Case.user_id == user_id)
    
    if status:
        query = query.filter(models.Case.status == status)
    if priority:
        query = query.filter(models.Case.priority == priority)
    if client_id:
        query = query.filter(models.Case.client_id == UUID(client_id))
    if search:
        query = query.filter(
            (models.Case.case_number.ilike(f"%{search}%")) | 
            (models.Case.case_title.ilike(f"%{search}%")) |
            (models.Case.court.ilike(f"%{search}%"))
        )
    
    return query.all()


@router.get("/{case_id}", response_model=schemas.Case)
def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    case = db.query(models.Case).filter(
        models.Case.id == UUID(case_id),
        models.Case.user_id == user_id
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("/", response_model=schemas.Case, status_code=201)
def create_case(
    case_in: schemas.CaseCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    case = models.Case(
        user_id=user_id,
        client_id=UUID(case_in.client_id) if case_in.client_id else None,
        case_number=case_in.case_number,
        case_title=case_in.case_title,
        case_type=case_in.case_type,
        court=case_in.court,
        opposite_party=case_in.opposite_party,
        filing_date=case_in.filing_date,
        next_hearing_date=case_in.next_hearing_date,
        status=case_in.status,
        priority=case_in.priority,
        assigned_advocate=case_in.assigned_advocate,
        description=case_in.description,
        folders=case_in.folders if case_in.folders is not None else [],
        documents=case_in.documents if case_in.documents is not None else [],
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.put("/{case_id}", response_model=schemas.Case)
def update_case(
    case_id: str,
    case_in: schemas.CaseUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    case = db.query(models.Case).filter(
        models.Case.id == UUID(case_id),
        models.Case.user_id == user_id
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    update_data = case_in.model_dump(exclude_unset=True)
    if "client_id" in update_data:
        update_data["client_id"] = UUID(update_data["client_id"]) if update_data["client_id"] else None
    for field, value in update_data.items():
        setattr(case, field, value)
    
    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}", status_code=204)
def delete_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    case = db.query(models.Case).filter(
        models.Case.id == UUID(case_id),
        models.Case.user_id == user_id
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    db.delete(case)
    db.commit()
