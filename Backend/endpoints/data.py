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


@router.get("/data/{drive_id}", response_model=list[schemas.RawData])
def get_data_from_drive(drive_id: int, db: Session = Depends(get_db)):
    data = crud.get_all_data_from_drive(db, drive_id)

    return data

@router.get("/data/{drive_id}/{sensor_id}", response_model=list[schemas.RawData])
def get_data_from_drive_for_sensor(drive_id: int, sensor_id: int, db: Session = Depends(get_db)):

    data = crud.get_sensors_data_from_drive(db, drive_id, sensor_id)

    return data

