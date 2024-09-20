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

@router.get("/drive/{driver_id}", response_model=list[schemas.Drive])
def get_drives_by_driver(driver_id: int, db: Session = Depends(get_db)):
    drives = crud.get_drives_by_driver(db, driver_id)
    return drives

@router.get("/drive/{drive_id}", response_model=schemas.Drive)
def get_drive_by_id(drive_id: int, db: Session = Depends(get_db)):
    drive = crud.get_drive(db, drive_id)
    return drive


@router.post("/drive", response_model=schemas.Drive)
def create_drive(drive: schemas.DriveCreate, db: Session = Depends(get_db)):
    #Need an endpoint for getting a drive by driveID
    db_drive = None
    if db_drive:
        raise HTTPException(status_code=400, detail="Drive already registered")
    
    return crud.create_drive(db=db, drive=drive)


@router.post("/drive/{driver_id}", response_model=schemas.Drive)
def create_drive_from_file(driver_id: int, drive: schemas.DriveCreate, db: Session = Depends(get_db)):
    return {"Test Endpoint": "complete"}


