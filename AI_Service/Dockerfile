FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN pip install --no-cache-dir pip --upgrade
RUN pip install --no-cache-dir .

COPY . .

ENV PYTHONPATH=/app

CMD ["celery", "-A", "celery_app", "worker", "--loglevel=info"]