from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from .endpoints import drive, driver

from . import crud, models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)


app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Include routers from different endpoint files
app.include_router(drive.router)
app.include_router(driver.router)


# Root endpoint (optional)
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}