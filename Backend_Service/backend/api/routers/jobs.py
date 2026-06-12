from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, List
from uuid import UUID

from backend.db.session import db_session
from backend.core.config import settings
from backend.qudrant.session import get_qdrant_client
from backend.api.middlewares import jwt
from backend.api.services import resume_services as rs
from backend.celery.celery_app import backend_celery_app

router = APIRouter(
    prefix="/resume",
    tags=["jobs"]
)

AsyncDB = Annotated[AsyncSession, Depends(db_session)]
resume_services = rs.ResumeServices()

@router.get(
    "/{resume_id}/jobs",
    dependencies=[Depends(jwt.jwt_verify_middleware)]
)
async def get_matching_jobs(
    resume_id: UUID,
    db: AsyncDB
):
    """
    Semantic job search matching a user's resume embedding
    with jobs stored in the Qdrant jobs collection.
    """
    # 1. Fetch resume from DB to check existence
    resumes = await resume_services.get_resume(
        db,
        [(rs.ResumeLookupField.RESUME_ID, resume_id)]
    )
    resume = next(iter(resumes), None)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
        
    # 2. Connect to Qdrant and retrieve the resume vector
    q_client = get_qdrant_client()
    try:
        points = q_client.retrieve(
            collection_name=settings.QDRANT_RESUME_COLLECTION,
            ids=[str(resume_id)],
            with_vectors=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query Qdrant: {str(e)}"
        )
        
    if not points or not points[0].vector:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume embedding not found. Please analyze the resume first."
        )
        
    resume_vector = points[0].vector
    
    # 3. Perform semantic vector search on the jobs collection
    try:
        # Check if collection exists first to prevent crashes
        if not q_client.collection_exists(settings.QDRANT_JOB_COLLECTION):
            return []
            
        search_results = q_client.search(
            collection_name=settings.QDRANT_JOB_COLLECTION,
            query_vector=resume_vector,
            limit=5
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search Qdrant jobs: {str(e)}"
        )
        
    matched_jobs = []
    for hit in search_results:
        payload = hit.payload or {}
        # Convert cosine similarity score (often 0-1) to an approximate percentage match
        match_percentage = int(hit.score * 100)
        # Cap match score between 0 and 100
        match_percentage = max(0, min(100, match_percentage))
        
        matched_jobs.append({
            "job_id": payload.get("job_id"),
            "job_title": payload.get("job_title"),
            "employer_name": payload.get("employer_name"),
            "employer_logo": payload.get("employer_logo"),
            "job_apply_link": payload.get("job_apply_link"),
            "job_description": payload.get("job_description"),
            "location": payload.get("location"),
            "job_employment_type": payload.get("job_employment_type"),
            "match_score": match_percentage
        })
        
    return matched_jobs

@router.post(
    "/internal/jobs/fetch",
    status_code=status.HTTP_202_ACCEPTED
)
async def trigger_job_fetch():
    """
    On-demand endpoint to trigger JSearch job retrieval and vector storing Celery task.
    """
    try:
        backend_celery_app.send_task("tasks.jobs.fetch")
        return {"message": "Job fetch task dispatched to Celery worker successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to dispatch Celery task: {str(e)}"
        )
