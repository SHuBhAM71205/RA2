from minio import Minio
from backend.core.config import settings
from urllib3 import PoolManager,Retry
import logging

logger = logging.getLogger(__name__)

http_client = PoolManager(
    retries=Retry(
        total=5,
        backoff_factor=0.2,
        status_forcelist=[500, 502, 503, 504],
    ),
    maxsize=10,
)


Minio_client = Minio(
    settings.MINIO_EXTERNAL_URL,
    access_key= settings.MINIO_ROOT_USER,
    secret_key= settings.MINIO_ROOT_PASSWORD,
    secure=False,
    http_client=http_client
)


def ensure_minio_bucket() -> bool:
    bucket_name = settings.MINIO_BUCKET_NAME

    try:
        if Minio_client.bucket_exists(bucket_name):
            return True

        Minio_client.make_bucket(bucket_name)
        logger.info("Created MinIO bucket `%s`", bucket_name)
        return True

    except Exception as e:
        logger.warning("Unable to ensure MinIO bucket `%s`: %s", bucket_name, e)
        return False
    
    
if __name__ == "__main__":
    ensure_minio_bucket()