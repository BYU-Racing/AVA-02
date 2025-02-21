from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from endpoints import drive, driver, data
from fastapi.middleware.cors import CORSMiddleware

from Backend import crud, models, schemas
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

#fastapi dev main.py

app = FastAPI(root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Include routers from different endpoint files
app.include_router(drive.router)
app.include_router(driver.router)
app.include_router(data.router)


# Root endpoint (optional)
@app.get("/")
def read_root():
    return {"Special thanks from": "Coleman Hardy, Landon Wheeler, Connor Mabey, Bryce Whitworth, Braden Toone, Bradford Bawden, and the rest of the BYU Racing Electronics Team"}
