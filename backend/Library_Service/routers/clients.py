from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
import schemas
from uuid import UUID

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("/", response_model=List[schemas.Client])
def list_clients(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    client_type: Optional[str] = None,
    search: Optional[str] = None,
):
    user_id = UUID(current_user["sub"])
    query = db.query(models.Client).filter(models.Client.user_id == user_id)
    
    if status:
        query = query.filter(models.Client.status == status)
    if client_type:
        query = query.filter(models.Client.client_type == client_type)
    if search:
        query = query.filter(
            (models.Client.name.ilike(f"%{search}%")) | 
            (models.Client.email.ilike(f"%{search}%")) | 
            (models.Client.phone.ilike(f"%{search}%"))
        )
    
    return query.all()


@router.get("/{client_id}", response_model=schemas.Client)
def get_client(
    client_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    client = db.query(models.Client).filter(
        models.Client.id == UUID(client_id),
        models.Client.user_id == user_id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/", response_model=schemas.Client, status_code=201)
def create_client(
    client_in: schemas.ClientCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    client = models.Client(
        user_id=user_id,
        name=client_in.name,
        phone=client_in.phone,
        email=client_in.email,
        address=client_in.address,
        client_type=client_in.client_type,
        notes=client_in.notes,
        status=client_in.status,
        created_date=client_in.created_date,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.put("/{client_id}", response_model=schemas.Client)
def update_client(
    client_id: str,
    client_in: schemas.ClientUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    client = db.query(models.Client).filter(
        models.Client.id == UUID(client_id),
        models.Client.user_id == user_id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = client_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
    
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=204)
def delete_client(
    client_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    client = db.query(models.Client).filter(
        models.Client.id == UUID(client_id),
        models.Client.user_id == user_id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(client)
    db.commit()
