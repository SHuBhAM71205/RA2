import requests
import logging
from workers.celery_app import app
from core.config import settings
from utils.pdf_extractor import extract_text_from_pdf
from services.minio_service import MinioService
from services.qdrant_service import QdrantService
from services.huggingface_service import HuggingFaceService

logger = logging.getLogger(__name__)

# Initialize services
minio_service = MinioService()
qdrant_service = QdrantService()
hf_service = HuggingFaceService()

@app.task(name="tasks.resume.analyze")
def analize_resume(resume_data: dict):
    """
    Decoupled Celery task to analyze a resume.
    1. Downloads PDF from MinIO.
    2. Extracts text.
    3. Generates embedding vector and upserts to Qdrant.
    4. Analyzes text via online LLM.
    5. Submits results to FastAPI backend callback.
    """
    resume_id = resume_data.get("resume_id")
    user_id = resume_data.get("user_id")
    minio_object_name = resume_data.get("minio_object_name")

    logger.info(f"Starting analysis for resume {resume_id} (User: {user_id})")
    
    try:
        # 1. Download the PDF file from MinIO
        pdf_bytes = minio_service.download_resume(minio_object_name)

        # 2. Extract text from the PDF file
        extracted_text = extract_text_from_pdf(pdf_bytes)
        if not extracted_text:
            raise ValueError("Extracted text from resume PDF is empty.")
        logger.info(f"Extracted {len(extracted_text)} characters from resume PDF.")

        # 3. Get text embedding
        embedding = hf_service.get_embedding(extracted_text)
        
        # 4. Upsert embedding and text metadata to Qdrant
        qdrant_payload = {
            "user_id": user_id,
            "minio_object_name": minio_object_name,
            "text": extracted_text
        }
        qdrant_service.upsert_resume_embedding(
            resume_id=resume_id,
            embedding=embedding,
            payload=qdrant_payload
        )

        # 5. Call Hugging Face online LLM to get analysis results
        analysis_result = hf_service.analyze_resume(extracted_text)
        logger.info(f"Successfully generated analysis for resume {resume_id}.")

        # 6. Post success callback back to backend FastAPI app
        callback_url = f"{settings.BACKEND_INTERNAL_URL}/internal/resume/callback"
        callback_payload = {
            "resume_id": resume_id,
            "status": "analyzed",
            "match_score": int(analysis_result.get("match_score", 0)),
            "raw_ai_output": analysis_result,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
        
        logger.info(f"Sending success callback to backend: {callback_url}")
        resp = requests.post(callback_url, json=callback_payload, timeout=10)
        resp.raise_for_status()
        logger.info(f"Success callback processed by backend for resume {resume_id}.")
        
        return {
            "status": "success",
            "resume_id": resume_id,
            "match_score": callback_payload["match_score"]
        }

    except Exception as e:
        logger.error(f"Error in analyze_resume task for resume {resume_id}: {e}")
        
        # Post failure callback back to backend FastAPI app so DB is updated
        try:
            callback_url = f"{settings.BACKEND_INTERNAL_URL}/internal/resume/callback"
            callback_payload = {
                "resume_id": resume_id,
                "status": "failed",
                "match_score": 0,
                "raw_ai_output": {"error": str(e)},
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            }
            logger.info(f"Sending failure callback to backend: {callback_url}")
            resp = requests.post(callback_url, json=callback_payload, timeout=10)
            resp.raise_for_status()
            logger.info(f"Failure callback processed by backend for resume {resume_id}.")
        except Exception as callback_err:
            logger.critical(f"Failed to report failure to backend callback endpoint: {callback_err}")
            
        return {
            "status": "failed",
            "resume_id": resume_id,
            "error": str(e)
        }