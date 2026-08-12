
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
from services.bareacts_service import bare_acts_service

router = APIRouter(
    prefix="/api/v1/library/bareacts",
    tags=["Bare Acts"],
)


# Define Pydantic models for response
class SuccessResponse(BaseModel):
    success: bool = True
    data: Optional[dict | list] = None


@router.get("", response_model=SuccessResponse)
async def get_bare_acts():
    acts = bare_acts_service.get_acts()
    return SuccessResponse(data=acts)


@router.get("/search", response_model=SuccessResponse)
async def search_bare_acts(query: str = Query(..., min_length=1)):
    acts = bare_acts_service.search_acts(query)
    return SuccessResponse(data=acts)


@router.get("/categories", response_model=SuccessResponse)
async def get_bare_acts_categories():
    categories = bare_acts_service.get_categories()
    return SuccessResponse(data=categories)


@router.get("/{act_id}", response_model=SuccessResponse)
async def get_bare_act(act_id: str):
    act = bare_acts_service.get_act(act_id)
    return SuccessResponse(data=act)


@router.get("/{act_id}/sections", response_model=SuccessResponse)
async def get_bare_act_sections(act_id: str, chapter_id: Optional[str] = None):
    sections = bare_acts_service.get_sections(act_id, chapter_id)
    return SuccessResponse(data=sections)


@router.get("/{act_id}/sections/{section_id}", response_model=SuccessResponse)
async def get_bare_act_section(act_id: str, section_id: str):
    section = bare_acts_service.get_section(act_id, section_id)
    return SuccessResponse(data=section)


@router.get("/search/sections", response_model=SuccessResponse)
async def search_bare_act_sections(query: str = Query(..., min_length=1)):
    sections = bare_acts_service.search_sections(query)
    return SuccessResponse(data=sections)
