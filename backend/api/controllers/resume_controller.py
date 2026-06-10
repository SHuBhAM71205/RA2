from fastapi import (UploadFile,BackgroundTasks, HTTPException, status)
from fastapi.responses import (StreamingResponse)

from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Sequence, Union
from uuid import UUID

from backend.db.models.Resume import Resume
from backend.api.models.resume_model import (ResumeStatusResponse)

from backend.api.services import resume_services as rs

resume_services = rs.ResumeServices()

class ResumeController:

    def __init__(self) -> None:
        pass

    def _is_owner(self, resume: Resume, user_id: Union[str, int, UUID]) -> bool:
        return str(resume.user_id) == str(user_id)

    async def list_resumes_controller(
        self,
        user_id: Union[str, int, UUID],
        db: AsyncSession
    ) -> Sequence[Resume]:

        try:
            return await resume_services.get_resume(
                db,
                [(rs.ResumeLookupField.USER_ID, user_id)]
            )

        except HTTPException:
            raise
        except Exception as e:

            print(f"Database error: {e}")

            raise HTTPException(

                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

    async def get_resume_status_controller(
        self,
        user_id: Union[str, int, UUID],
        resume_id: UUID,
        db: AsyncSession
    ) -> ResumeStatusResponse:

        try:

            resumes = await resume_services.get_resume(
                db,
                [(rs.ResumeLookupField.RESUME_ID, resume_id)]
            )

            resume = next(iter(resumes), None)

            if not resume:
                raise HTTPException(status_code=404, detail="Resume not found")

            if not self._is_owner(resume, user_id):
                raise HTTPException(
                    status_code=403, detail="You can only access your own resume")

            return ResumeStatusResponse(resume_id=resume.id, status=resume.status)

        except HTTPException:
            raise
        except Exception as e:
            
            print(f"Database error: {e}")
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

    async def get_resume_file_controller(
        self,
        db: AsyncSession,
        user_id: Union[str, int, UUID],
        resume_id: Optional[UUID] = None,
    ):
        
        try:
            if resume_id:
                resumes = await resume_services.get_resume(
                    db,
                    [(rs.ResumeLookupField.RESUME_ID, resume_id)]
                )
                resume = next(iter(resumes), None)
            else:
                resumes = await resume_services.get_resume(
                    db,
                    [(rs.ResumeLookupField.USER_ID, user_id)]
                )
                resume = next(iter(resumes), None)

            if not resume:
                raise HTTPException(status_code=404, detail="Resume not found")

            if not self._is_owner(resume, user_id):
                raise HTTPException(
                    status_code=403, detail="You can only access your own resume")

            resume_file = resume_services.get_resume_file(resume.minio_object_name)
            
            if not resume_file:
                raise HTTPException(
                    status_code=404, detail="Resume not found"
                )
            
            return StreamingResponse(iter([resume_file]), media_type="application/pdf")


        except HTTPException:
            raise
        except Exception as e:
            print(f"Database error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

    async def resume_upload_controller(
        self,
        db: AsyncSession,
        user_id: UUID,
        file: UploadFile,
        background_task: BackgroundTasks
    ):
        try:
            resume = await resume_services.upload_resume(db, user_id, file)
            return {
                "message": "Resume uploaded successfully",
                "resume_id": resume.id,
                "status": resume.status,
            }

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except HTTPException:
            raise
        except Exception as e:
            print(f"Upload error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

    async def analize_resume_controller(
        self,
        db: AsyncSession,
        user_id,
        resume_id,
    ):
        try:
            resume = await resume_services.analyze_resume(db, resume_id)

            if not self._is_owner(resume, user_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only access your own resume"
                )

            return {"message": "Resume analysis completed"}

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        except HTTPException:
            raise
        except Exception as e:
            print(f"Analysis error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

    async def resume_update_controller(
        self,
        db: AsyncSession,
        user_id: UUID,
        file: UploadFile,
        background_task: BackgroundTasks,
        resume_id: UUID
    ):
        try:
            resume = await resume_services.update_resume(db, user_id, resume_id, file)
            if not self._is_owner(resume, user_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only update your own resume"
                )
            return {
                "message": "Resume updated successfully",
                "resume_id": resume.id,
                "status": resume.status,
            }

        except ValueError as e:
            message = str(e)
            if message == "Resume not found":
                status_code = status.HTTP_404_NOT_FOUND
            elif message == "You can only update your own resume":
                status_code = status.HTTP_403_FORBIDDEN
            else:
                status_code = status.HTTP_400_BAD_REQUEST
            raise HTTPException(
                status_code=status_code,
                detail=message
            )
        except HTTPException:
            raise
        except Exception as e:
            print(f"Update error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

