import uuid
from sqlalchemy import Column, String, Text, Date, Time, ForeignKey, Boolean, DateTime, func, text, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from database import Base


class Client(Base):
    __tablename__ = "library_clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50))
    email = Column(String(255))
    address = Column(Text)
    client_type = Column(String(50), nullable=False)
    notes = Column(Text)
    status = Column(String(50), nullable=False, default="Active")
    created_date = Column(Date, nullable=False, server_default=func.current_date())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Case(Base):
    __tablename__ = "library_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("library_clients.id", ondelete="SET NULL"))
    case_number = Column(String(255), nullable=False)
    case_title = Column(String(255), nullable=False)
    case_type = Column(String(50), nullable=False)
    court = Column(String(255), nullable=False)
    opposite_party = Column(String(255))
    filing_date = Column(Date)
    next_hearing_date = Column(Date)
    status = Column(String(50), nullable=False, default="Open")
    priority = Column(String(50), default="Medium")
    assigned_advocate = Column(String(255))
    description = Column(Text)
    folders = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    documents = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Hearing(Base):
    __tablename__ = "library_hearings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    case_id = Column(UUID(as_uuid=True), ForeignKey("library_cases.id", ondelete="SET NULL"))
    client_id = Column(UUID(as_uuid=True), ForeignKey("library_clients.id", ondelete="SET NULL"))
    case_number = Column(String(255))
    case_title = Column(String(255))
    court = Column(String(255))
    judge = Column(String(255))
    opposite_party = Column(String(255))
    hearing_date = Column(Date, nullable=False, index=True)
    next_hearing_date = Column(Date)
    status = Column(String(50), nullable=False, default="Scheduled")
    remarks = Column(Text)
    timeline = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CalendarEvent(Base):
    __tablename__ = "library_calendar_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    case_id = Column(UUID(as_uuid=True), ForeignKey("library_cases.id", ondelete="SET NULL"))
    hearing_id = Column(UUID(as_uuid=True), ForeignKey("library_hearings.id", ondelete="SET NULL"))
    diary_entry_id = Column(String(255))
    title = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    date = Column(Date, nullable=False, index=True)
    time = Column(Time)
    notes = Column(Text)
    is_diary_event = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class VideoLink(Base):
    __tablename__ = "library_video_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    case_id = Column(UUID(as_uuid=True), ForeignKey("library_cases.id", ondelete="SET NULL"))
    hearing_id = Column(UUID(as_uuid=True), ForeignKey("library_hearings.id", ondelete="SET NULL"))
    case_number = Column(String(255))
    case_title = Column(String(255))
    court = Column(String(255))
    platform = Column(String(50), nullable=False)
    meeting_link = Column(Text)
    meeting_id = Column(String(255))
    passcode = Column(String(255))
    hearing_date = Column(Date)
    start_time = Column(Time)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CaseTracking(Base):
    __tablename__ = "library_case_tracking"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    case_id = Column(UUID(as_uuid=True), ForeignKey("library_cases.id", ondelete="SET NULL"))
    cnr_number = Column(String(255), unique=True)
    case_number = Column(String(255))
    case_title = Column(String(255))
    court_establishment = Column(String(255))
    case_stage = Column(String(255))
    last_updated = Column(Date)
    next_hearing_date = Column(Date)
    next_hearing_time = Column(Time)
    latest_order = Column(Text)
    latest_proceeding = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Note(Base):
    __tablename__ = "library_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    case_id = Column(UUID(as_uuid=True), ForeignKey("library_cases.id", ondelete="SET NULL"))
    title = Column(String(255), nullable=False)
    content = Column(Text)
    tags = Column(ARRAY(Text))
    linked_act_id = Column(String(255))
    linked_chapter_id = Column(String(255))
    linked_section_number = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class BookmarkFolder(Base):
    __tablename__ = "library_bookmark_folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # __table_args__ = (
    #     {"postgresql_include": ["user_id", "name"]},
    # )


class Bookmark(Base):
    __tablename__ = "library_bookmarks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("library_bookmark_folders.id", ondelete="SET NULL"))
    act_id = Column(String(255))
    act_name = Column(String(255))
    chapter_id = Column(String(255))
    section_number = Column(String(255))
    section_title = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BareAct(Base):
    __tablename__ = "library_bare_acts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    short_title = Column(String(255))
    act_number = Column(String(255))
    year = Column(String(10), index=True)
    state = Column(String(255), index=True)
    category = Column(String(255), index=True)
    department = Column(String(255))
    description = Column(Text)
    pdf_url = Column(String(1024))
    language = Column(String(50), default="English")
    status = Column(String(50), default="Active")
    effective_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class LegalProvider(Base):
    __tablename__ = "library_legal_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True) # e.g., 'Open India Law', 'Indian Kanoon'
    base_url = Column(String(1024))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LegalJudgment(Base):
    __tablename__ = "library_legal_judgments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("library_legal_providers.id"))
    external_id = Column(String(255), index=True) # e.g., Kanoon doc ID or Vaquill ID
    title = Column(String(1024), nullable=False, index=True)
    court = Column(String(255), index=True)
    citation = Column(String(512), index=True)
    judgment_date = Column(Date, index=True)
    summary = Column(Text)
    content = Column(Text) # Full text if available
    source_url = Column(String(1024))
    publisher = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Text search column if needed later
    # search_vector = Column(TSVECTOR)


class LegalAct(Base):
    __tablename__ = "legal_acts"

    id = Column(String, primary_key=True)
    provider = Column(String)
    external_act_id = Column(String)
    title = Column(String, nullable=False, index=True)
    short_title = Column(String, index=True)
    year = Column(Integer, index=True)
    act_number = Column(String)
    jurisdiction = Column(String, index=True)
    state = Column(String, index=True)
    category = Column(String)
    document_type = Column(String, index=True)
    status = Column(String)
    publisher = Column(String)
    source_url = Column(String)
    enactment_date = Column(String)
    amendment_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class LegalSection(Base):
    __tablename__ = "legal_sections"

    id = Column(String, primary_key=True)
    act_id = Column(String, ForeignKey("legal_acts.id"))
    provider = Column(String)
    external_section_id = Column(String, index=True)
    section_number = Column(String, index=True)
    section_title = Column(String, index=True)
    chapter = Column(String)
    chapter_title = Column(String)
    part = Column(String)
    part_title = Column(String)
    text = Column(Text)
    status = Column(String)
    source_url = Column(String)
    source_publisher = Column(String)
    order_index = Column(Integer)

class LegalAmendment(Base):
    __tablename__ = "legal_amendments"

    id = Column(String, primary_key=True)
    act_id = Column(String, ForeignKey("legal_acts.id"))
    amending_act = Column(String)
    section = Column(String)
    amendment_text = Column(Text)
    effective_date = Column(String)
    footnote = Column(Text)
    source_url = Column(String)

class LegalSource(Base):
    __tablename__ = "library_legal_sources"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LegalCourt(Base):
    __tablename__ = "library_legal_courts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    jurisdiction = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LegalCitation(Base):
    __tablename__ = "library_legal_citations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    judgment_id = Column(UUID(as_uuid=True), ForeignKey("library_legal_judgments.id", ondelete="CASCADE"))
    citation = Column(String(512), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# =========================
# Legal Dictionary (upstream)
# =========================
class LegalTerm(Base):
    __tablename__ = "legal_terms"

    id = Column(Integer, primary_key=True, index=True)
    term = Column(String(255), nullable=False, index=True)
    normalized_term = Column(String(255), nullable=False, unique=True, index=True)
    explanation = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="active", index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
