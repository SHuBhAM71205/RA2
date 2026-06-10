from celery import Celery

celery_app = Celery(
    "code_review",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
)

@celery_app.task
def add(x: int, y: int):
    return x + y