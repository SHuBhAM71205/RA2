from pydantic_settings import BaseSettings,SettingsConfigDict

from pydantic import computed_field

class Settings(BaseSettings):
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

    
    model_config = SettingsConfigDict(env_file=".env",extra="ignore")

settings = Settings() #type:ignore