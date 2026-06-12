from celery import Celery
from core.config import settings

app = Celery(
    "ai_worker",
    broker=settings.A_CELERY_BROKER_URL,
    backend=settings.CELERY_BACKEND_URL,
)

app.autodiscover_tasks(["workers"])

# Explicitly import the tasks to ensure they are registered with Celery
app.conf.imports = (
    "workers.tasks.resume_analyse",
)