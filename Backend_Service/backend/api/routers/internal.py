from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from backend.db.session import db_session
from backend.api.models.resume_model import AnalysisCallbackRequest
from backend.api.services import resume_services as rs

AsyncDB = Annotated[AsyncSession, Depends(db_session)]
resume_services = rs.ResumeServices()

router = APIRouter(
    prefix="/internal/resume",
    tags=["internal"]
)

@router.post(
    "/callback",
    status_code=status.HTTP_200_OK
)
async def resume_analysis_callback(
    payload: AnalysisCallbackRequest,
    db: AsyncDB
):
    try:
        await resume_services.save_resume_analysis(
            db=db,
            resume_id=payload.resume_id,
            status=payload.status,
            match_score=payload.match_score,
            raw_ai_output=payload.raw_ai_output,
            prompt_tokens=payload.prompt_tokens,
            completion_tokens=payload.completion_tokens,
            total_tokens=payload.total_tokens
        )
        return {"message": "Callback processed successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        print(f"Callback error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
