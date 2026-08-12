from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
import schemas
from uuid import UUID

router = APIRouter(tags=["bookmarks"])


@router.get("/folders", response_model=List[schemas.BookmarkFolder])
def list_folders(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    return db.query(models.BookmarkFolder).filter(models.BookmarkFolder.user_id == user_id).all()


@router.post("/folders", response_model=schemas.BookmarkFolder, status_code=201)
def create_folder(
    folder_in: schemas.BookmarkFolderCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    folder = models.BookmarkFolder(user_id=user_id, name=folder_in.name)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.get("/", response_model=List[schemas.Bookmark])
def list_bookmarks(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    folder_id: Optional[str] = None,
    act_id: Optional[str] = None,
):
    user_id = UUID(current_user["sub"])
    query = db.query(models.Bookmark).filter(models.Bookmark.user_id == user_id)
    return query.all()


@router.get("/check", response_model=dict)
def check_bookmark(
    act_id: str,
    section_number: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    exists = db.query(models.Bookmark).filter(
        models.Bookmark.user_id == user_id,
        models.Bookmark.act_id == act_id,
        models.Bookmark.section_number == section_number
    ).first() is not None
    return {"isBookmarked": exists}


@router.post("/", response_model=schemas.Bookmark, status_code=201)
def create_bookmark(
    bookmark_in: schemas.BookmarkCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    bookmark = models.Bookmark(
        user_id=user_id,
        folder_id=UUID(bookmark_in.folder_id) if bookmark_in.folder_id else None,
        act_id=bookmark_in.act_id,
        act_name=bookmark_in.act_name,
        chapter_id=bookmark_in.chapter_id,
        section_number=bookmark_in.section_number,
        section_title=bookmark_in.section_title,
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


@router.delete("/{bookmark_id}", status_code=204)
def delete_bookmark(
    bookmark_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = UUID(current_user["sub"])
    bookmark = db.query(models.Bookmark).filter(
        models.Bookmark.id == UUID(bookmark_id),
        models.Bookmark.user_id == user_id
    ).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    db.delete(bookmark)
    db.commit()
