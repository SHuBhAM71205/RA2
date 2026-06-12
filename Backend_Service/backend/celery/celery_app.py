from celery import Celery
from backend.core.config import settings

backend_celery_app = Celery(
    "backend_client",
    broker=settings.A_CELERY_BROKER_URL,
    backend=settings.CELERY_BACKEND_URL
)