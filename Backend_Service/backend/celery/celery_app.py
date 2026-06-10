from celery import Celery
from backend.core.config import settings

app = Celery(
    "RA",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_BACKEND_URL,
)