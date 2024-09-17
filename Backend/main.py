from fastapi import FastAPI
from .endpoints import drive

app = FastAPI()

# Include routers from different endpoint files
app.include_router(drive.router)

# Root endpoint (optional)
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}