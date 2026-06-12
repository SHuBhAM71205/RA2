from celery import Celery
from celery.schedules import crontab
from core.config import settings

app = Celery(
    "ai_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_BACKEND_URL,
)

app.autodiscover_tasks(["workers"])

# Explicitly import the tasks to ensure they are registered with Celery
app.conf.imports = (
    "workers.tasks.resume_analyse",
    "workers.tasks.fetch_jobs",
)

# Configure Celery Beat Schedule
app.conf.beat_schedule = {
    "fetch-jobs-daily-morning": {
        "task": "tasks.jobs.fetch",
        "schedule": crontab(hour=7, minute=0),  # Daily at 7:00 AM
    }
}