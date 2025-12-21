from __future__ import annotations
from sqlalchemy import (
    Column, Integer, BigInteger, Text, JSON, ForeignKey, text as sqltext,
    TIMESTAMP, Computed
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import TSVECTOR
from pgvector.sqlalchemy import Vector

Base = declarative_base()

class DocRaw(Base):
    __tablename__ = 'docs_raw'
    
    id = Column(BigInteger, primary_key=True)
    filename = Column(Text)
    title = Column(Text)
    year = Column(Integer)
    category = Column(Text)
    data = Column(JSON, nullable=False)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=sqltext('now()'))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=sqltext('now()'))
    
    # Relationships
    passages = relationship('Passage', back_populates='doc', cascade='all, delete')

class Passage(Base):
    __tablename__ = 'passages'
    
    id = Column(BigInteger, primary_key=True)
    doc_id = Column(BigInteger, ForeignKey('docs_raw.id', ondelete='CASCADE'))
    
    # Metadata
    section_no = Column(Text)
    heading = Column(Text)
    
    # Content Columns
    text = Column(Text, nullable=False)   # The "Child" chunk used for matching
    parent_text = Column(Text)            # The "Parent" chunk used for LLM context (New)
    
    # Vector Embedding (Updated to 1024 for BAAI/bge-m3)
    embedding = Column(Vector(1024))
    
    # Denormalized Filters
    year = Column(Integer)
    category = Column(Text)
    
    # Search Vector (Generated Column)
    # We map this so we can use it in queries, but mark it Computed so we don't write to it
    search_vector = Column(TSVECTOR, Computed('search_vector', persisted=True))
    
    # Housekeeping
    token_count = Column(Integer)
    checksum = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=sqltext('now()'))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=sqltext('now()'))

    # Relationships
    doc = relationship('DocRaw', back_populates='passages')