from pydantic_settings import BaseSettings,SettingsConfigDict

from pydantic import computed_field

class Settings(BaseSettings):
    # ---------CELERY--------------
    
    A_CELERY_REDIS_LOGICAL_DB:int
    A_CELERY_BROKER:str
    A_CELERY_BROKER_HOST:str
    A_CELERY_BROKER_PORT:str
    
    @computed_field
    def CELERY_BROKER_URL(self) -> str:
        return f"{self.A_CELERY_BROKER}://{self.A_CELERY_BROKER_HOST}:{self.A_CELERY_BROKER_PORT}/{self.A_CELERY_REDIS_LOGICAL_DB}"
    
    A_CELERY_BACKEND:str
    A_CELERY_BACKEND_HOST:str
    A_CELERY_BACKEND_PORT:str

    
    @computed_field
    def CELERY_BACKEND_URL(self) -> str:
        return f"{self.A_CELERY_BACKEND}://{self.A_CELERY_BACKEND_HOST}:{self.A_CELERY_BACKEND_PORT}/{self.A_CELERY_REDIS_LOGICAL_DB}"

    
    model_config = SettingsConfigDict(env_file=".env",extra="ignore")

settings = Settings() #type:ignore