from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import settings

# router
from backend.api.routers import (auth,resume)

#middleware



#constants
origin = [
    settings.REACT_APP_FRONTEND_URL
]



#fastapi app
app = FastAPI()


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