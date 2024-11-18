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

@router.get("/sensors/{drive_id}", response_model=list[int])
def get_unique_sensors_from_drive(drive_id: int, db: Session = Depends(get_db)):
    sensors = crud.get_unique_sensors_from_drive(db, drive_id)

    if not sensors:
        raise HTTPException(status_code=404, detail="No sensors found for this drive")

    # Extract the sensor IDs from the results
    return [sensor_id[0] for sensor_id in sensors]


@router.post("/drive", response_model=schemas.Drive)
def create_drive(drive: schemas.DriveCreate, db: Session = Depends(get_db)):
    #Need an endpoint for getting a drive by driveID
    db_drive = None #TODO: THIS NEEDS TO CHANGE SO THAT IT CHECKS FOR EXISTENCE OF DRIVE HASH

    if db_drive:
        raise HTTPException(status_code=400, detail="Drive already registered")
    
    return crud.create_drive(db=db, drive=drive)


@router.get("/drive", response_model=list[schemas.DriveSimple])
def get_drives(db: Session = Depends(get_db)):
    drives = crud.get_drives(db)
    return drives

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

            if(msg_id >= 50 and  msg_id <= 54): ##HOT BOX CASE
                db_data = models.RawData(
                    drive_id=drive_id,
                    msg_id=((msg_id * 10) + 0),
                    raw_data=[buffers[0], buffers[1], 0, 0, 0, 0, 0, 0],
                    time=time
                )
                db.add(db_data)
                db_data = models.RawData(
                    drive_id=drive_id,
                    msg_id=((msg_id * 10) + 1),
                    raw_data=[buffers[2], buffers[3], 0, 0, 0, 0, 0, 0],
                    time=time
                )
                db.add(db_data)
                db_data = models.RawData(
                    drive_id=drive_id,
                    msg_id=((msg_id * 10) + 2),
                    raw_data=[buffers[4], buffers[5], 0, 0, 0, 0, 0, 0],
                    time=time
                )
                db.add(db_data)

            elif(msg_id == 4): #Accelerometer CASE
                db_data = models.RawData(
                    drive_id=drive_id,
                    msg_id=(((msg_id) * 100) + buffers[0]),
                    raw_data=[buffers[1],buffers[2], buffers[3], buffers[4], 0, 0, 0, 0],
                    time=time
                )
                db.add(db_data)

            else:
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

