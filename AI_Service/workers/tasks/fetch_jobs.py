import logging
import requests
import uuid
from celery import shared_task
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

from core.config import settings
from services.huggingface_service import HuggingFaceService

logger = logging.getLogger(__name__)
hf_service = HuggingFaceService()

@shared_task(name="tasks.jobs.fetch")
def fetch_and_store_jobs():
    """
    Fetches developer jobs in India from JSearch API,
    generates embeddings, and stores them in Qdrant.
    """
    api_key = settings.RAPIDAPI_KEY
    api_host = settings.RAPIDAPI_HOST
    
    if not api_key:
        logger.error("RAPIDAPI_KEY is not configured in settings. Skipping daily job fetch.")
        return {"status": "error", "message": "RAPIDAPI_KEY is missing"}
        
    url = "https://jsearch.p.rapidapi.com/search"
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": api_host
    }
    params = {
        "query": "Developer in India",
        "page": "1",
        "num_pages": "1"
    }
    
    logger.info("Calling JSearch API to fetch jobs in India...")
    try:
        response = requests.get(url, headers=headers, params=params, timeout=20)
        response.raise_for_status()
        res_data = response.json()
    except Exception as e:
        logger.error(f"Failed to fetch jobs from JSearch API: {e}")
        return {"status": "error", "message": str(e)}
        
    jobs = res_data.get("data", [])
    logger.info(f"Fetched {len(jobs)} jobs from JSearch.")
    
    if not jobs:
        return {"status": "success", "fetched": 0, "stored": 0}
        
    qdrant_client = QdrantClient(url=settings.QDRANT_URL)
    stored_count = 0
    
    for job in jobs:
        job_id = job.get("job_id")
        if not job_id:
            continue
            
        title = job.get("job_title", "Developer")
        employer = job.get("employer_name", "Unknown Employer")
        description = job.get("job_description", "")
        apply_link = job.get("job_apply_link", "")
        city = job.get("job_city") or "India"
        country = job.get("job_country") or "IN"
        location = f"{city}, {country}"
        
        # Build text to embed
        text_to_embed = f"Job Title: {title}\nEmployer: {employer}\nLocation: {location}\nDescription: {description}"
        
        try:
            # Generate embedding
            embedding = hf_service.get_embedding(text_to_embed)
            if not embedding:
                logger.warning(f"Failed to generate embedding for job {job_id}")
                continue
                
            # Deterministic UUID from job_id to prevent duplicates
            job_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, job_id))
            
            # Upsert into Qdrant
            payload = {
                "job_id": job_id,
                "job_title": title,
                "employer_name": employer,
                "employer_logo": job.get("employer_logo"),
                "job_apply_link": apply_link,
                "job_description": description[:1000],
                "location": location,
                "job_employment_type": job.get("job_employment_type", "FULLTIME")
            }
            
            qdrant_client.upsert(
                collection_name=settings.QDRANT_JOB_COLLECTION,
                points=[
                    PointStruct(
                        id=job_uuid,
                        vector=embedding,
                        payload=payload
                    )
                ]
            )
            stored_count += 1
        except Exception as e:
            logger.error(f"Error processing and storing job {job_id}: {e}")
            
    logger.info(f"Successfully processed and stored {stored_count} jobs in Qdrant.")
    return {"status": "success", "fetched": len(jobs), "stored": stored_count}
