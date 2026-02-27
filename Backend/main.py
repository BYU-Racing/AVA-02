from fastapi import FastAPI
from .endpoints import drive, driver, data, livetelemetryws
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .configDB import DATABASE_URL

from . import crud, models, schemas
from .database import SessionLocal, engine

BASE_DIR = Path(__file__).resolve().parent  # Backend/

# Only create tables if database is available (skip if RDS not configured yet)
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create database tables: {e}")

#fastapi dev main.py

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
    return {"status": "healthy", "message": "Special thanks from: Coleman Hardy, Landon Wheeler, Connor Mabey, Bryce Whitworth, Braden Toone, Bradford Bawden, and the rest of the BYU Racing Electronics Team"}

# Include routers from different endpoint files
app.include_router(drive.router, prefix="/api")
app.include_router(driver.router, prefix="/api")
app.include_router(data.router, prefix="/api")
app.include_router(livetelemetryws.router, prefix="/api")

class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        if response.status_code == 404:
            # If file not found, serve index.html for SPA routing
            return await super().get_response("index.html", scope)
        return response

# Mount static files LAST (catch-all route)
build_dir = Path("/app/FrontendDist")

if build_dir.exists():
    app.mount(
        "/",
        StaticFiles(directory=str(build_dir), html=True),
        name="static"
    )

    # SPA fallback for react-router (optional but recommended)
    # @app.get("/{path:path}")
    # def spa_fallback(path: str):
    #     return FileResponse(str(build_dir / "index.html"))

else:
    print(f"⚠️Error⚠️\nFrontend build directory not found at {build_dir}")