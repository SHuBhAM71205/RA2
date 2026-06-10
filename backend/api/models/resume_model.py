from uuid import UUID

from pydantic import BaseModel


class ResumeResponse(BaseModel):
    id: UUID
    user_id: UUID
    minio_object_name: str
    status: str
    file_size: int

    class Config:
        from_attributes = True


class ResumeMutationResponse(BaseModel):
    message: str
    resume_id: UUID
    status: str


class ResumeStatusResponse(BaseModel):
    resume_id: UUID
    status: str


class AnalyzeResponse(BaseModel):
    message: str
