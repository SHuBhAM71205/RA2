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


class AnalysisResponse(BaseModel):
    id: UUID
    resume_id: UUID
    match_score: int
    raw_ai_output: dict
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

    class Config:
        from_attributes = True


class AnalysisCallbackRequest(BaseModel):
    resume_id: UUID
    status: str
    match_score: int = 0
    raw_ai_output: dict = {}
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
