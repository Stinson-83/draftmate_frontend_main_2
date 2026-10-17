from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional, List, Dict, Any, Union
from datetime import date, time as dt_time, datetime
from uuid import UUID


class ClientBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    client_type: str
    notes: Optional[str] = None
    status: str = "Active"
    created_date: Optional[date] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    client_type: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class Client(ClientBase):
    id: Union[UUID, str]
    user_id: Union[UUID, str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaseBase(BaseModel):
    case_number: str
    case_title: str
    case_type: str
    court: str
    opposite_party: Optional[str] = None
    filing_date: Optional[date] = None
    next_hearing_date: Optional[date] = None
    status: str = "Open"
    priority: Optional[str] = "Medium"
    assigned_advocate: Optional[str] = None
    description: Optional[str] = None
    folders: Optional[List[Dict[str, Any]]] = None
    documents: Optional[List[Dict[str, Any]]] = None


class CaseCreate(CaseBase):
    client_id: Optional[str] = None


class CaseUpdate(BaseModel):
    case_number: Optional[Optional[str]] = None
    case_title: Optional[Optional[str]] = None
    case_type: Optional[Optional[str]] = None
    court: Optional[Optional[str]] = None
    client_id: Optional[Optional[str]] = None
    opposite_party: Optional[Optional[str]] = None
    filing_date: Optional[Optional[date]] = None
    next_hearing_date: Optional[Optional[date]] = None
    status: Optional[Optional[str]] = None
    priority: Optional[Optional[str]] = None
    assigned_advocate: Optional[Optional[str]] = None
    description: Optional[Optional[str]] = None
    folders: Optional[List[Dict[str, Any]]] = None
    documents: Optional[List[Dict[str, Any]]] = None


class Case(CaseBase):
    id: Union[UUID, str]
    user_id: Union[UUID, str]
    client_id: Optional[Union[UUID, str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HearingBase(BaseModel):
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    court: Optional[str] = None
    judge: Optional[str] = None
    opposite_party: Optional[str] = None
    hearing_date: date
    next_hearing_date: Optional[date] = None
    status: str = "Scheduled"
    remarks: Optional[str] = None
    timeline: Optional[List[Dict[str, Any]]] = None


class HearingCreate(HearingBase):
    case_id: Optional[str] = None
    client_id: Optional[str] = None


class HearingUpdate(BaseModel):
    case_id: Optional[str] = None
    client_id: Optional[str] = None
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    court: Optional[str] = None
    judge: Optional[str] = None
    opposite_party: Optional[str] = None
    hearing_date: Optional[date] = None
    next_hearing_date: Optional[date] = None
    status: Optional[str] = None
    remarks: Optional[str] = None
    timeline: Optional[List[Dict[str, Any]]] = None


class Hearing(HearingBase):
    id: Union[UUID, str]
    user_id: Union[UUID, str]
    case_id: Optional[Union[UUID, str]] = None
    client_id: Optional[Union[UUID, str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CalendarEventBase(BaseModel):
    title: str
    type: str
    date: Union[date, str]
    time: Optional[Union[dt_time, str]] = None
    notes: Optional[str] = None
    is_diary_event: bool = False


class CalendarEventCreate(CalendarEventBase):
    case_id: Optional[str] = None
    hearing_id: Optional[str] = None
    diary_entry_id: Optional[str] = None


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    date: Optional[Union[date, str]] = None
    time: Optional[Union[dt_time, str]] = None
    notes: Optional[str] = None
    is_diary_event: Optional[bool] = None
    case_id: Optional[str] = None
    hearing_id: Optional[str] = None
    diary_entry_id: Optional[str] = None


class CalendarEvent(CalendarEventBase):
    id: Union[UUID, str]
    user_id: Union[UUID, str]
    case_id: Optional[Union[UUID, str]] = None
    hearing_id: Optional[Union[UUID, str]] = None
    diary_entry_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VideoLinkBase(BaseModel):
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    court: Optional[str] = None
    platform: str
    meeting_link: Optional[str] = None
    meeting_id: Optional[str] = None
    passcode: Optional[str] = None
    hearing_date: Optional[Union[date, str]] = None
    start_time: Optional[Union[dt_time, str]] = None
    notes: Optional[str] = None


class VideoLinkCreate(VideoLinkBase):
    case_id: Optional[str] = None
    hearing_id: Optional[str] = None


class VideoLinkUpdate(BaseModel):
    case_id: Optional[str] = None
    hearing_id: Optional[str] = None
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    court: Optional[str] = None
    platform: Optional[str] = None
    meeting_link: Optional[str] = None
    meeting_id: Optional[str] = None
    passcode: Optional[str] = None
    hearing_date: Optional[Union[date, str]] = None
    start_time: Optional[Union[dt_time, str]] = None
    notes: Optional[str] = None


class VideoLink(VideoLinkBase):
    id: Union[UUID, str]
    user_id: Union[UUID, str]
    case_id: Optional[Union[UUID, str]] = None
    hearing_id: Optional[Union[UUID, str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaseTrackingBase(BaseModel):
    cnr_number: Optional[str] = None
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    court_establishment: Optional[str] = None
    case_stage: Optional[str] = None
    last_updated: Optional[Union[date, str]] = None
    next_hearing_date: Optional[Union[date, str]] = None
    next_hearing_time: Optional[Union[dt_time, str]] = None
    latest_order: Optional[str] = None
    latest_proceeding: Optional[str] = None


class CaseTrackingCreate(CaseTrackingBase):
    case_id: Optional[str] = None


class CaseTrackingUpdate(BaseModel):
    case_id: Optional[str] = None
    cnr_number: Optional[str] = None
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    court_establishment: Optional[str] = None
    case_stage: Optional[str] = None
    last_updated: Optional[Union[date, str]] = None
    next_hearing_date: Optional[Union[date, str]] = None
    next_hearing_time: Optional[Union[dt_time, str]] = None
    latest_order: Optional[str] = None
    latest_proceeding: Optional[str] = None


class CaseTracking(CaseTrackingBase):
    id: Union[UUID, str]
    user_id: Union[UUID, str]
    case_id: Optional[Union[UUID, str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NoteBase(BaseModel):
    title: str
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    linked_act_id: Optional[str] = None
    linked_chapter_id: Optional[str] = None
    linked_section_number: Optional[str] = None


class NoteCreate(NoteBase):
    case_id: Optional[str] = None


class NoteUpdate(BaseModel):
    case_id: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    linked_act_id: Optional[str] = None
    linked_chapter_id: Optional[str] = None
    linked_section_number: Optional[str] = None


class Note(NoteBase):
    id: Union[UUID, str]
    user_id: Union[UUID, str]
    case_id: Optional[Union[UUID, str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BookmarkFolderBase(BaseModel):
    name: str


class BookmarkFolderCreate(BookmarkFolderBase):
    pass


class BookmarkFolderUpdate(BaseModel):
    name: Optional[str] = None


class BookmarkFolder(BookmarkFolderBase):
    id: Union[UUID, str]
    user_id: Union[UUID, str]
    created_at: datetime

    class Config:
        from_attributes = True


class BookmarkBase(BaseModel):
    act_id: Optional[str] = None
    act_name: Optional[str] = None
    chapter_id: Optional[str] = None
    section_number: Optional[str] = None
    section_title: Optional[str] = None


class BookmarkCreate(BookmarkBase):
    folder_id: Optional[str] = None


class BookmarkUpdate(BaseModel):
    folder_id: Optional[str] = None
    act_id: Optional[str] = None
    act_name: Optional[str] = None
    chapter_id: Optional[str] = None
    section_number: Optional[str] = None
    section_title: Optional[str] = None


class Bookmark(BookmarkBase):
    id: Union[UUID, str]
    user_id: Union[UUID, str]
    folder_id: Optional[Union[UUID, str]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# Legal Dictionary Schemas (upstream)
# =========================
class TermSearchResponse(BaseModel):
    id: int
    term: str
    matchType: str


class TermSearchPaginatedResponse(BaseModel):
    items: list[TermSearchResponse]
    total: int
    page: int
    limit: int


class TermDetailResponse(BaseModel):
    id: int
    term: str
    normalized_term: str
    explanation: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
