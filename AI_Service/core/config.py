import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings,SettingsConfigDict

from pydantic import AliasChoices, Field, computed_field

# Load root .env file
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path, override=True)

class Settings(BaseSettings):
    # ---------CELERY--------------
    
    A_CELERY_REDIS_LOGICAL_DB:int = 0
    A_CELERY_BROKER:str = "redis"
    A_CELERY_BROKER_HOST:str = Field(default="127.0.0.1", validation_alias=AliasChoices("A_CELERY_BROKER_HOST", "CELERY_BROKER_HOST"))
    A_CELERY_BROKER_PORT:str = Field(default="6379", validation_alias=AliasChoices("A_CELERY_BROKER_PORT", "CELERY_BROKER_PORT"))
    
    @computed_field
    def CELERY_BROKER_URL(self) -> str:
        return f"{self.A_CELERY_BROKER}://{self.A_CELERY_BROKER_HOST}:{self.A_CELERY_BROKER_PORT}/{self.A_CELERY_REDIS_LOGICAL_DB}"
    
    CELERY_BACKEND:str = Field(default="redis", validation_alias=AliasChoices("A_CELERY_BACKEND", "CELERY_BACKEND"))
    CELERY_BACKEND_HOST:str = Field(default="127.0.0.1", validation_alias=AliasChoices("A_CELERY_BACKEND_HOST", "CELERY_BACKEND_HOST"))
    CELERY_BACKEND_PORT:str = Field(default="6379", validation_alias=AliasChoices("A_CELERY_BACKEND_PORT", "CELERY_BACKEND_PORT"))

    
    @computed_field
    def CELERY_BACKEND_URL(self) -> str:
        return f"{self.CELERY_BACKEND}://{self.CELERY_BACKEND_HOST}:{self.CELERY_BACKEND_PORT}/{self.A_CELERY_REDIS_LOGICAL_DB}"

    # ---------QDRANT (Vector Database)--------------
    QDRANT_HOST: str
    QDRANT_PORT: int
    QDRANT_RESUME_COLLECTION: str = "resumes"
    QDRANT_JOB_COLLECTION: str = "jobs"
    
    @computed_field
    def QDRANT_URL(self) -> str:
        return f"http://{self.QDRANT_HOST}:{self.QDRANT_PORT}"
    
    # ---------MINIO (Object Storage)--------------
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    MINIO_HOST: str
    MINIO_CLIENT_PORT: int
    MINIO_BUCKET_NAME: str
    
    @computed_field
    def MINIO_URL(self) -> str:
        return f"http://{self.MINIO_HOST}:{self.MINIO_CLIENT_PORT}"

    # ---------EMBEDDINGS--------------
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    
    # ---------HUGGING FACE ONLINE CONFIG--------------
    HF_ACCESS_TOKEN: str = ""
    HF_MODEL_NAME: str = "Qwen/Qwen3-Embedding-0.6B"
    HUGGING_FACE_ACCESS_URL: str = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
    
    # ---------BACKEND CALLBACK API--------------
    BACKEND_INTERNAL_URL: str = "http://host.docker.internal:8000"

    # ---------RAPIDAPI (JSEARCH)--------------
    RAPIDAPI_KEY: str = ""
    RAPIDAPI_HOST: str = "jsearch.p.rapidapi.com"

    model_config = SettingsConfigDict(env_file=".env",extra="ignore")

settings = Settings() #type:ignore