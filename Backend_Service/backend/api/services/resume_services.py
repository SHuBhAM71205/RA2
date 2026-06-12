import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Tuple, Union, Sequence, Optional
from uuid import UUID, uuid4
from enum import Enum

from fastapi import UploadFile

from backend.core.config import settings
from backend.minio.session import Minio_client
from backend.celery.celery_app import backend_celery_app
from backend.db.models.Resume import Resume
from backend.db.models.Analysis import Analysis

class ResumeLookupField(str, Enum):
    USER_ID = "user_id" 
    RESUME_ID = "id"


class ResumeServices:
    
    def __init__(self) -> None:
        pass
    
    async def get_resume(
        self,
        db: AsyncSession,
        keyval: List[Tuple[ResumeLookupField, Union[str, int, UUID]]]
    ) -> Sequence[Resume]:
        
        filters = []
        for field, value in keyval:
            filters.append(getattr(Resume, field.value) == value)
        
        stmt = select(Resume)
        if filters:
            stmt = stmt.where(and_(*filters))
            
        result = await db.execute(stmt)
        return result.scalars().all()

    def get_resume_file(
        self,
        minio_obj_name:str
    ):
        
        resume_data = None
        resume_obj = Minio_client.get_object(settings.MINIO_BUCKET_NAME,minio_obj_name)        
        try:
            resume_data = resume_obj.read()
        finally:
            resume_obj.close()
            resume_obj.release_conn()

        return resume_data

    def _validate_file(self, file: UploadFile) -> bytes:
        if file.content_type != "application/pdf":
            raise ValueError("Invalid file type. Only PDF files are allowed.")

        file_bytes = file.file.read()
        if not file_bytes:
            raise ValueError("Uploaded file is empty.")

        if len(file_bytes) > settings.RESUME_MAX_FILE_SIZE_BYTES:
            raise ValueError(
                f"Uploaded file exceeds the maximum allowed size of {settings.RESUME_MAX_FILE_SIZE_MB} MB."
            )

        return file_bytes

    def _upload_to_minio(self, object_name: str, file_bytes: bytes) -> None:
        Minio_client.put_object(
            settings.MINIO_BUCKET_NAME,
            object_name,
            io.BytesIO(file_bytes),
            length=len(file_bytes),
            content_type="application/pdf"
        )

    async def upload_resume(
        self,
        db: AsyncSession,
        user_id: UUID,
        file: UploadFile,
    ) -> Resume:
        file_bytes = self._validate_file(file)
        object_name = f"resumes/{user_id}/{uuid4()}.pdf"

        self._upload_to_minio(object_name, file_bytes)

        resume = Resume(
            user_id=user_id,
            minio_object_name=object_name,
            status="uploaded",
            file_size=len(file_bytes),
        )

        db.add(resume)
        await db.commit()
        await db.refresh(resume)

        return resume

    async def _resume_analize_bt():
        pass
    
    async def analyze_resume(
        self,
        db: AsyncSession,
        resume_id: UUID,
    ) -> Resume:
        resumes = await self.get_resume(
            db,
            [(ResumeLookupField.RESUME_ID, resume_id)]
        )
        resume = next(iter(resumes), None)

        if not resume:
            raise ValueError("Resume not found")
        
        # Set status to processing while the Celery worker runs
        resume.status = "processing"
        db.add(resume)
        await db.commit()
        await db.refresh(resume)

        # Dispatch task to AI service container using task name signature (decoupled)
        backend_celery_app.send_task(
            "tasks.resume.analyze",
            args=[{
                "resume_id": str(resume.id),
                "user_id": str(resume.user_id),
                "minio_object_name": resume.minio_object_name
            }]
        )

        return resume

    async def get_resume_analysis(
        self,
        db: AsyncSession,
        resume_id: UUID,
    ) -> Optional[Analysis]:
        stmt = select(Analysis).where(Analysis.resume_id == resume_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def save_resume_analysis(
        self,
        db: AsyncSession,
        resume_id: UUID,
        status: str,
        match_score: int = 0,
        raw_ai_output: dict = {},
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        total_tokens: int = 0,
    ) -> None:
        resumes = await self.get_resume(
            db,
            [(ResumeLookupField.RESUME_ID, resume_id)]
        )
        resume = next(iter(resumes), None)
        if not resume:
            raise ValueError("Resume not found")

        resume.status = status
        db.add(resume)

        if status == "analyzed":
            stmt = select(Analysis).where(Analysis.resume_id == resume_id)
            result = await db.execute(stmt)
            existing = result.scalars().first()

            if existing:
                existing.match_score = match_score
                existing.raw_ai_output = raw_ai_output
                existing.prompt_tokens = prompt_tokens
                existing.completion_tokens = completion_tokens
                existing.total_tokens = total_tokens
                db.add(existing)
            else:
                analysis = Analysis(
                    resume_id=resume_id,
                    match_score=match_score,
                    raw_ai_output=raw_ai_output,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                )
                db.add(analysis)

        await db.commit()

    async def update_resume(
        self,
        db: AsyncSession,
        user_id: UUID,
        resume_id: UUID,
        file: UploadFile,
    ) -> Resume:
        resumes = await self.get_resume(
            db,
            [(ResumeLookupField.RESUME_ID, resume_id)]
        )
        resume = next(iter(resumes), None)

        if not resume:
            raise ValueError("Resume not found")

        if str(resume.user_id) != str(user_id):
            raise ValueError("You can only update your own resume")

        file_bytes = self._validate_file(file)
        object_name = f"resumes/{user_id}/{uuid4()}.pdf"

        self._upload_to_minio(object_name, file_bytes)

        try:
            Minio_client.remove_object(settings.MINIO_BUCKET_NAME, resume.minio_object_name)
        except Exception:
            # Keep the new object if delete fails; old object cleanup is best-effort.
            pass

        resume.minio_object_name = object_name
        resume.file_size = len(file_bytes)
        resume.status = "updated"

        db.add(resume)
        await db.commit()
        await db.refresh(resume)

        return resume