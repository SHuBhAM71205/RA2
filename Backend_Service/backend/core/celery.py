import os
from celery import Celery

broker_host = os.getenv("A_CELERY_BROKER_HOST", "127.0.0.1")
backend_host = os.getenv("A_CELERY_BACKEND_HOST", "127.0.0.1")

celery_app = Celery(
    "code_review",
    broker=f"redis://{broker_host}:6379/0",
    backend=f"redis://{backend_host}:6379/0",
)

@celery_app.task
def add(x: int, y: int):
    return x + y