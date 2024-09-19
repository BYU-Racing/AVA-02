from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime
import logging


## READ DRIVERS
def get_driver_by_name(db: Session, driver_name: str):
    return db.query(models.Driver).filter(models.Driver.name == driver_name).first()

def get_driver(db: Session, driver_id: int):
    driver = db.query(models.Driver).filter(models.Driver.driver_id == driver_id).first()
    logging.error(driver)
    return driver

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
def create_drive(db: Session, drive: schemas.DriveCreate):

    db_drive = models.Drive(driver_id=drive.driver_id, date=drive.date, notes=drive.notes)
    db.add(db_drive)
    db.commit()
    db.refresh(db_drive)

    return db_drive

## READ RAW DATA

def get_all_data_from_drive(db: Session, drive_id: int):
    return db.query(models.RawData).filter(models.RawData.drive_id == drive_id).all()

def get_sensors_data_from_drive(db: Session, drive_id: int, sensor_id: int):
    return db.query(models.RawData).filter(models.RawData.drive_id == drive_id).filter(models.RawData.msg_id == sensor_id).all()


## WRITE RAW DATA

def create_raw_data(db: Session, data: schemas.RawDataCreate):
    db_data = models.RawData(drive_id=data.drive_id, msg_id=data.msg_id, raw_data=data.raw_data)

    db.add(db_data)
    db.commit()
    db.refresh(db_data)

    return db_data
