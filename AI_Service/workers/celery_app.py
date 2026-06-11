from celery import Celery
from core.config import settings

app = Celery(
    "RA ",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_BACKEND_URL,
)

print(app.conf.broker_url)
print(app.conf.result_backend)



print(settings.A_CELERY_BROKER)
print(settings.CELERY_BROKER_URL)
print(type(settings.CELERY_BROKER_URL))