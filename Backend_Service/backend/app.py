from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import settings
from backend.qudrant.session import ensure_qdrant_collections
from backend.minio.session import ensure_minio_bucket

# router
from backend.api.routers import (auth, resume, internal)

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_qdrant_collections()
    ensure_minio_bucket()
    yield

#constants
origin = [
    settings.REACT_APP_FRONTEND_URL
]



#fastapi app
app = FastAPI(lifespan=lifespan)


#CROS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=origin,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def root():
    return {"text":"This is the api for the resume analysis"}


# add_router
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(internal.router)