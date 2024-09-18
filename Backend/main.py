from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from .endpoints import drive
from sqlalchemy import create_engine, MetaData
from databases import Database
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

app = FastAPI()

# Include routers from different endpoint files
app.include_router(drive.router)


# Root endpoint (optional)
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}