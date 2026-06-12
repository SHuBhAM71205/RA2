from minio import Minio
import logging
from core.config import settings

logger = logging.getLogger(__name__)

class MinioService:
    def __init__(self):
        # Minio client expects host:port, e.g. "localhost:9000" or "minio:9000"
        endpoint = f"{settings.MINIO_HOST}:{settings.MINIO_CLIENT_PORT}"
        self.client = Minio(
            endpoint,
            access_key=settings.MINIO_ROOT_USER,
            secret_key=settings.MINIO_ROOT_PASSWORD,
            secure=False
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME

    def download_resume(self, minio_object_name: str) -> bytes:
        """
        Downloads the resume PDF from MinIO bucket and returns it as bytes.
        """
        try:
            logger.info(f"Downloading object '{minio_object_name}' from bucket '{self.bucket_name}'")
            response = self.client.get_object(self.bucket_name, minio_object_name)
            try:
                pdf_bytes = response.read()
                return pdf_bytes
            finally:
                response.close()
                response.release_conn()
        except Exception as e:
            logger.error(f"Failed to download resume '{minio_object_name}' from MinIO: {e}")
            raise ValueError(f"Failed to download resume from MinIO: {e}")
