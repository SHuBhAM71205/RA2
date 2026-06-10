from __future__ import annotations
import uuid
from typing import List

from sqlalchemy import (
    String,
    Integer,
    ForeignKey,
    Index,
    UUID
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from backend.db.models.Base import Base


class Resume(Base):
    __tablename__ = "resumes"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        index=True,
        nullable=False
    )

    minio_object_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="processing",
        nullable=False
    )

    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    owner: Mapped["User"] = relationship(
        back_populates="resumes"
    )

    analyses: Mapped[List["Analysis"]] = relationship(
        back_populates="resume",
        cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_resumes_user_status", "user_id", "status"),
    )