from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
import pandas as pd
import io
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

@router.get("/drive/{driver_id}", response_model=list[schemas.DriveSimple])
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


@router.post("/drive/{drive_id}", response_model=dict)
async def add_data_to_drive_from_file(
    drive_id: int,  # Ensure this is passed as a proper dictionary in the request body
    db: Session = Depends(get_db),
    file: UploadFile = File(...)  # Ensure file upload is set correctly
):
    try:

        # Read the uploaded file's contents
        contents = await file.read()

        # Parse the CSV data using pandas
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        # Iterate through the rows of the CSV
        for index, row in df.iterrows():
            msg_id, time, *buffers = row[:10]  # Adjust as needed
            db_data = models.RawData(
                drive_id=drive_id, 
                msg_id=msg_id, 
                raw_data=buffers, 
                time=time
            )
            db.add(db_data)

        # Commit all changes at once
        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to insert data: {e}")
    
    return {"status": "success"}

