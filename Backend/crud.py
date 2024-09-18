from sqlalchemy.orm import Session
from . import models, schemas


## READ DRIVERS
def get_driver_by_name(db: Session, driver_name: str):
    return db.query(models.Driver).filter(models.Driver.name == driver_name).first()

def get_driver(db: Session, driver_id: int):
    return db.query(models.Driver).filter(models.Driver.driver_id == driver_id).first()

def get_drivers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Driver).offset(skip).limit(limit).all()

## WRITE DRIVER

def create_driver(db: Session, user: schemas.DriverCreate):
    db_driver = models.Driver(name=user.name)
    db.add(db_driver)

    db.commit()
    db.refresh(db_driver)
    
    return db_driver

## READ DRIVES
def get_drive(db: Session, drive_id: int):
    return db.query(models.Drive).filter(models.Drive.drive_id == drive_id).first()

def get_drives_by_driver(db: Session, driver_id: int):
    return db.query(models.Drive).filter(models.Drive.driver_id == driver_id).all()



## WRITE DRIVES


## READ RAW DATA



## WRITE RAW DATA

