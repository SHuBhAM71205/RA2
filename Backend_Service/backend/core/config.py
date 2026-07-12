import os
from urllib.parse import quote
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field

# Load root .env file
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path, override=True)


def _normalize_host(host: str | None, fallback: str = "127.0.0.1") -> str:
    if host is None:
        return fallback

    normalized = str(host).strip().strip('"').strip("'")
    if not normalized:
        return fallback

    if normalized.lower() in {"localhost", "0.0.0.0", "::1", "[::1]", "host.docker.internal"}:
        return fallback

    return normalized


class Settings(BaseSettings):
    
    #POSTGRES
    
    PG_DB_NAME :str 
    PG_DB_USER :str
    PG_DB_PASSWORD :str 
    PG_DB_HOST :str
    PG_DB_PORT :int
    
    def _effective_db_host(self) -> str:
        return _normalize_host(self.PG_DB_HOST)

    def _encode_component(self, value: str) -> str:
        return quote(str(value), safe="")

    @computed_field
    def POSTGRES_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self._encode_component(self.PG_DB_USER)}:"
            f"{self._encode_component(self.PG_DB_PASSWORD)}@{self._effective_db_host()}:{self.PG_DB_PORT}/{self.PG_DB_NAME}"
        )
    
    @computed_field
    def ALEMBIC_POSTGRES_URL(self) -> str:
        return (
            f"postgresql+psycopg://{self._encode_component(self.PG_DB_USER)}:"
            f"{self._encode_component(self.PG_DB_PASSWORD)}@{self._effective_db_host()}:{self.PG_DB_PORT}/{self.PG_DB_NAME}"
        )

    # --- MINIO ---
    MINIO_CLIENT_PORT: int 
    MINIO_UI_PORT: int 
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    MINIO_HOST: str 
    MINIO_BUCKET_NAME: str 
    @computed_field
    def MINIO_EXTERNAL_URL(self) -> str:
        return f"{self.MINIO_HOST}:{self.MINIO_CLIENT_PORT}"

    # --- AI / VECTOR ---
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    QDRANT_RESUME_COLLECTION: str = "resumes"
    QDRANT_JOB_COLLECTION: str = "jobs"
    RESUME_EMBEDDING_DIMENSION: int = 384
    JOB_EMBEDDING_DIMENSION: int = 384
    
    def _effective_qdrant_host(self) -> str:
        return _normalize_host(self.QDRANT_HOST)

    @computed_field
    def QDRANT_URL(self) -> str:
        return f"http://{self._effective_qdrant_host()}:{self.QDRANT_PORT}"
    
    # ---------REDIS(GENERAL)--------------

    GEN_REDIS_HOST:str
    GEN_REDIS_PORT:int
    GEN_REDIS_LOGICAL_DB:int
    
    def _effective_redis_host(self) -> str:
        return _normalize_host(self.GEN_REDIS_HOST)

    @computed_field
    def GEN_REDIS_URL(self) -> str:
        return f"redis://{self._effective_redis_host()}:{self.GEN_REDIS_PORT}/{self.GEN_REDIS_LOGICAL_DB}"

    # ---------CELERY--------------
    
    A_CELERY_REDIS_LOGICAL_DB: int = 0
    A_CELERY_BROKER: str = "redis"
    A_CELERY_BROKER_HOST: str = "localhost"
    A_CELERY_BROKER_PORT: str = "6379"
    
    def _effective_celery_broker_host(self) -> str:
        return _normalize_host(self.A_CELERY_BROKER_HOST)

    @computed_field
    def A_CELERY_BROKER_URL(self) -> str:
        return f"{self.A_CELERY_BROKER}://{self._effective_celery_broker_host()}:{self.A_CELERY_BROKER_PORT}/{self.A_CELERY_REDIS_LOGICAL_DB}"
    
    CELERY_BACKEND: str = "redis"
    CELERY_BACKEND_HOST: str = "localhost"
    CELERY_BACKEND_PORT: str = "6379"
    
    def _effective_celery_backend_host(self) -> str:
        return _normalize_host(self.CELERY_BACKEND_HOST)

    @computed_field
    def CELERY_BACKEND_URL(self) -> str:
        return f"{self.CELERY_BACKEND}://{self._effective_celery_backend_host()}:{self.CELERY_BACKEND_PORT}/{self.A_CELERY_REDIS_LOGICAL_DB}"
    
    
    # CRYPTOGRAPHIC
    BACKEND_SECRETE_KEY:str
    HASHING_ALGO:str
    
    #FRONTEND
    
    REACT_APP_FRONTEND_HOST:str
    REACT_APP_FRONTEND_PORT:int
    
    @computed_field
    def REACT_APP_FRONTEND_URL(self) -> str:
        return f"{self.REACT_APP_FRONTEND_HOST}"
    # def REACT_APP_FRONTEND_URL(self) -> str:
    #     return f"http://{self.REACT_APP_FRONTEND_HOST}:{self.REACT_APP_FRONTEND_PORT}"
    
    
    #LIMITS
    GLOBAL_RATE_LIMIT_PER_MINUTE: int = 100  # Max requests per minute per IP
    AUTH_RATE_LIMIT_PER_MINUTE: int = 5      # Max Auth request in a min allow per IP
    RESUME_UPLOAD_LIMIT: int = 10             # Max Resume upload in a min allow per userid
    RESUME_MAX_FILE_SIZE_MB: int = 10

    @property
    def RESUME_MAX_FILE_SIZE_BYTES(self) -> int:
        return self.RESUME_MAX_FILE_SIZE_MB * 1024 * 1024
    
    # ---------RAPIDAPI (JSEARCH)--------------
    RAPIDAPI_KEY: str = ""
    RAPIDAPI_HOST: str = "jsearch.p.rapidapi.com"
      


settings = Settings() #type:ignore
