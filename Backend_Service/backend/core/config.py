from pydantic_settings import BaseSettings,SettingsConfigDict

from pydantic import computed_field

class Settings(BaseSettings):
    
    #POSTGRES
    
    PG_DB_NAME :str 
    PG_DB_USER :str
    PG_DB_PASSWORD :str 
    PG_DB_HOST :str
    PG_DB_PORT :int
    
    @computed_field
    def POSTGRES_URL(self) -> str:
        return f"postgresql+asyncpg://{self.PG_DB_USER}:{self.PG_DB_PASSWORD}@{self.PG_DB_HOST}:{self.PG_DB_PORT}/{self.PG_DB_NAME}"
    
    @computed_field
    def ALEMBIC_POSTGRES_URL(self) -> str:
        return f"postgresql+psycopg://{self.PG_DB_USER}:{self.PG_DB_PASSWORD}@{self.PG_DB_HOST}:{self.PG_DB_PORT}/{self.PG_DB_NAME}"

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
    
    @computed_field
    def QDRANT_URL(self) -> str:
        return f"http://{self.QDRANT_HOST}:{self.QDRANT_PORT}"
    
    # ---------CELERY--------------
    
    CELERY_REDIS_LOGICAL_DB:int
    CELERY_BROKER:str
    CELERY_BROKER_HOST:str
    CELERY_BROKER_PORT:str
    
    @computed_field
    def CELERY_BROKER_URL(self) -> str:
        return f"{self.CELERY_BROKER}://{self.CELERY_BROKER_HOST}:{self.CELERY_BROKER_PORT}/{self.CELERY_REDIS_LOGICAL_DB}"
    
    CELERY_BACKEND:str
    CELERY_BACKEND_HOST:str
    CELERY_BACKEND_PORT:str

    
    @computed_field
    def CELERY_BACKEND_URL(self) -> str:
        return f"{self.CELERY_BACKEND}://{self.CELERY_BACKEND_HOST}:{self.CELERY_BACKEND_PORT}/{self.CELERY_REDIS_LOGICAL_DB}"
    
    
    # CRYPTOGRAPHIC
    BACKEND_SECRETE_KEY:str
    HASHING_ALGO:str
    
    #FRONTEND
    
    REACT_APP_FRONTEND_HOST:str
    REACT_APP_FRONTEND_PORT:int
    
    @computed_field
    def REACT_APP_FRONTEND_URL(self) -> str:
        return f"http://{self.REACT_APP_FRONTEND_HOST}:{self.REACT_APP_FRONTEND_PORT}"
    
    
    #LIMITS
    GLOBAL_RATE_LIMIT_PER_MINUTE: int = 100  # Max requests per minute per IP
    AUTH_RATE_LIMIT_PER_MINUTE: int = 5      # Max Auth request in a min allow per IP
    RESUME_UPLOAD_LIMIT: int = 10             # Max Resume upload in a min allow per userid
    RESUME_MAX_FILE_SIZE_MB: int = 10

    @property
    def RESUME_MAX_FILE_SIZE_BYTES(self) -> int:
        return self.RESUME_MAX_FILE_SIZE_MB * 1024 * 1024
    
    
    
    model_config = SettingsConfigDict(env_file=".env",extra="ignore")


settings = Settings() #type:ignore


