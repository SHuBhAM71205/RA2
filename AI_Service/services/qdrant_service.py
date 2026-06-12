from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
import logging
from core.config import settings

logger = logging.getLogger(__name__)

class QdrantService:
    def __init__(self):
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self.collection_name = settings.QDRANT_RESUME_COLLECTION

    def upsert_resume_embedding(self, resume_id: str, embedding: list, payload: dict) -> None:
        """
        Upserts the resume embedding vector and associated metadata payload into Qdrant.
        """
        try:
            logger.info(f"Upserting embedding for resume '{resume_id}' in collection '{self.collection_name}'")
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=resume_id,
                        vector=embedding,
                        payload=payload
                    )
                ]
            )
            logger.info(f"Successfully upserted embedding for resume '{resume_id}'")
        except Exception as e:
            logger.error(f"Failed to upsert embedding to Qdrant for resume '{resume_id}': {e}")
            raise ValueError(f"Failed to save embedding to Qdrant: {e}")
