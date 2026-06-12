from __future__ import annotations
import uuid

from sqlalchemy import (
    ForeignKey,
    Integer,
    UUID,
    Index
)
from sqlalchemy.dialects.postgresql import JSONB 
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from backend.db.models.Base import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )

    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id"),
        index=True,
        nullable=False
    )

    match_score: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )

    raw_ai_output: Mapped[dict] = mapped_column(
        JSONB, 
        nullable=False
    )

    prompt_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    completion_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    total_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    # Relationships
    resume: Mapped["Resume"] = relationship(
        back_populates="analyses"
    )
    
    __table_args__ = (
        # PostgreSQL GIN Index for fast nested JSON searches
        Index(
            "ix_analyses_raw_ai_output_gin", 
            "raw_ai_output", 
            postgresql_using="gin"
        ),
        # Speeds up pulling the highest match scores for a specific resume
        Index("ix_analyses_resume_score", "resume_id", "match_score"),
    )