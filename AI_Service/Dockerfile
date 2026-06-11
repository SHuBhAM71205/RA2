FROM python:3.13-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir uv && \
    uv pip install --system -r pyproject.toml

# ENV PYTHONPATH=/app

CMD ["celery", "-A", "workers" , "celery_app" , "--loglevel=info"]