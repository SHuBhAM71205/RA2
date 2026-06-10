from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import logging

from backend.core.config import settings

logger = logging.getLogger(__name__)

def get_qdrant_client():

    return QdrantClient(
        url=settings.QDRANT_URL,
    )


def ensure_qdrant_collections() -> bool:
    client = get_qdrant_client()
    collections = {
        settings.QDRANT_RESUME_COLLECTION: settings.RESUME_EMBEDDING_DIMENSION,
        settings.QDRANT_JOB_COLLECTION: settings.JOB_EMBEDDING_DIMENSION,
    }

    try:
        for collection_name, vector_size in collections.items():
            if client.collection_exists(collection_name):
                continue

            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )
            logger.info("Created Qdrant collection `%s`", collection_name)

        return True
    except Exception as e:
        logger.warning("Unable to ensure Qdrant collections: %s", e)
        return False
