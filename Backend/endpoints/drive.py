from fastapi import APIRouter, Depends, HTTPException
from .. import crud, models, schemas
from ..database import SessionLocal, engine
from sqlalchemy.orm import Session
router = APIRouter()

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/drive", response_model=list[schemas.Drive])
def get_drives(db: Session = Depends(get_db)):
    drives = crud.get_drives_by_driver(db, 0)
    return drives



@router.get("/drive/{drive_id}")
def get_user(drive_id: int):
    return {"drive_id": drive_id}