from uuid import uuid4,UUID

from fastapi import (
    APIRouter,
    Depends,
    Request,
    status,
    HTTPException,
    UploadFile
)

from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated,List

#middleware
from backend.api.middlewares import (jwt)
from backend.api.middlewares.limiter import resume_rate_limiter

#Services import
from backend.api.services.auth_services import AuthServices

#Controller import
from backend.api.controllers.resume_controller import ResumeController

# AsyncDB
from backend.db.session import db_session
AsyncDB = Annotated[AsyncSession, Depends(db_session)]

#model import
from backend.api.models.resume_model import(
    AnalyzeResponse,
    ResumeMutationResponse,
    ResumeResponse,
    ResumeStatusResponse,
    AnalysisResponse,
)


#controller 
resume_controller = ResumeController()
#services
auth_services = AuthServices()


router = APIRouter(
    prefix="/resume",
    tags=["resume"],
    dependencies=[Depends(jwt.jwt_verify_middleware)]
)



@router.get(
    "/",
    response_model=List[ResumeResponse]
)
async def list_resume(
    request:Request,
    db:AsyncDB
):
    
    out = await resume_controller.list_resumes_controller(
        user_id = request.state.user_id,
        db=db
    )
    if out: 
        return out
    else:
        return [] 


@router.get(
    "/status/{resume_id}",
    response_model=ResumeStatusResponse
)
async def get_resume_status(
    request:Request,
    resume_id: UUID,
    db: AsyncDB,
):
    return await resume_controller.get_resume_status_controller(
        user_id=request.state.user_id,
        resume_id=resume_id,
        db=db
    )

@router.get(
    "/file/{resume_id}",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "PDF file of the resume"
        },
        404: {"description": "Resume not found"}
    }
)
async def get_resume_file(
    request:Request,
    resume_id: UUID,
    db: AsyncDB
):
    return await resume_controller.get_resume_file_controller(
        db=db,
        user_id=request.state.user_id,
        resume_id=resume_id
    )


@router.get(
    "/{user_id}",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "PDF file of the resume"
        },
        404: {"description": "Resume not found"}
    }
)
async def get_resume(
    request:Request,
    user_id: UUID,
    db: AsyncDB
):
    try:
        if not request.state.user_id == user_id :
            raise HTTPException(404)
        
        return await resume_controller.get_resume_file_controller(
            db=db,
            user_id=request.state.user_id
        )
        
    except HTTPException:
            raise
    
    except Exception as e:
        print(f"Internal error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )




@router.post(
    "/upload/{user_id}",
    response_model=ResumeMutationResponse,
    dependencies=[Depends(resume_rate_limiter)],
    responses={
        200: {"description": "Resume uploaded successfully"},
        400: {"description": "Invalid file type"},
        429: {"description": "Rate limit exceeded"}
    }
)
async def resume_upload_user(
    user_id: UUID,
    file: UploadFile,

    db: AsyncDB,
):
    return await resume_controller.resume_upload_controller(
        db=db,
        user_id=user_id,
        file=file,
    )



@router.post(
    "/analyze/{resume_id}",
    response_model=AnalyzeResponse,
    responses={
        200: {"description": "Resume analysis completed"},
        404: {"description": "Resume not found"}
    }
)
async def resume_analyze(
    request: Request,
    resume_id: UUID,

    db: AsyncDB
):
    
    return await resume_controller.analize_resume_controller(
        db=db,
        user_id=request.state.user_id,
        resume_id=resume_id,

    )


@router.put(
    "/update/{resume_id}",
    response_model=ResumeMutationResponse,
    dependencies=[Depends(resume_rate_limiter)],
    responses={
        200: {"description": "Resume updated successfully"},
        400: {"description": "Invalid file type"},
        404: {"description": "Resume not found"}
    }
)
async def resume_update(
    request:Request,
    resume_id: UUID,
    file: UploadFile,

    db: AsyncDB,
):
    
    return await resume_controller.resume_update_controller(
        db=db,
        user_id=request.state.user_id,
        file=file,
        resume_id=resume_id
    )


@router.get(
    "/analysis/{resume_id}",
    response_model=AnalysisResponse
)
async def get_resume_analysis(
    request: Request,
    resume_id: UUID,
    db: AsyncDB
):
    return await resume_controller.get_resume_analysis_controller(
        db=db,
        user_id=request.state.user_id,
        resume_id=resume_id
    )