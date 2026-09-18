# file: main.py
# Desc: Main FastAPI app, runs on startup. Sets up endpoints, db, and connects to frontend

from pathlib import Path
from typing import Union

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import crud, models, schemas
from .configDB import DATABASE_URL
from .database import SessionLocal, engine
from .endpoints import data, drive, driver, livetelemetry

BASE_DIR = Path(__file__).resolve().parent  # Backend/

# Only create tables if database is available (skip if RDS not configured yet)
# try:
#     models.Base.metadata.create_all(bind=engine)
# except Exception as e:
#     print(f"Warning: Could not create database tables: {e}")

# fastapi dev main.py

app = FastAPI()

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


# API health check endpoint
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Special thanks from: Coleman Hardy, Landon Wheeler, Connor Mabey, Bryce Whitworth, Toben Whitworth, Braden Toone, Bradford Bawden, Blake Hill and the rest of the BYU Racing Electronics Team",
    }


# Include routers from different endpoint files
app.include_router(drive.router, prefix="/api")
app.include_router(driver.router, prefix="/api")
app.include_router(data.router, prefix="/api")
app.include_router(livetelemetry.router, prefix="/api")


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope) -> FileResponse | Response:
        try:
            response = await super().get_response(path, scope)
            if response is None or response.status_code == 404:
                return FileResponse(str(build_dir / "index.html"))
            return response
        except (StarletteHTTPException, Exception) as e:
            # If file not found, serve index.html for SPA routing
            if getattr(e, "status_code", None) == 404:
                return await super().get_response("index.html", scope)
            raise e


# Mount static files LAST (catch-all route)
build_dir = Path("/app/FrontendDist")

if build_dir.exists():
    app.mount("/", SPAStaticFiles(directory=str(build_dir), html=True), name="static")

else:
    print(f"⚠️Error⚠️\nFrontend build directory not found at {build_dir}")
