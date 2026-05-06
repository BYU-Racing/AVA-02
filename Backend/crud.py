# file: crud.py
# Desc: CRUD (Create, Read, Update, Delete) functions for interacting with database
# TODO: add db checks for error handling

import logging

from sqlalchemy import Numeric, cast, delete, distinct, func, select
from sqlalchemy.orm import Session, aliased

from . import models, schemas


## READ DRIVERS
def get_driver_by_name(db: Session, driver_name: str):
    return (
        db.execute(select(models.Driver).where(models.Driver.name == driver_name))
        .scalars()
        .first()
    )


def get_driver(db: Session, driver_id: int):
    driver = (
        db.execute(select(models.Driver).where(models.Driver.driver_id == driver_id))
        .scalars()
        .first()
    )
    logging.error(driver)
    return driver


def get_drivers(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.execute(
            select(models.Driver)
            .order_by(models.Driver.driver_id.desc())
            .offset(skip)
            .limit(limit)
        )
        .scalars()
        .all()
    )


## WRITE DRIVER


def create_driver(db: Session, user: schemas.DriverCreate):
    db_driver = models.Driver(name=user.name)
    db.add(db_driver)

    db.commit()
    db.refresh(db_driver)

    return db_driver


## READ DRIVES


def get_unique_sensors_from_drive(db: Session, drive_id: int):
    return (
        db.execute(
            select(distinct(models.RawData.msg_id)).where(
                models.RawData.drive_id == drive_id
            )
        )
        .scalars()
        .all()
    )


def get_drives(db: Session, skip: int = 0, limit: int = 500):
    return (
        db.execute(
            select(models.Drive)
            .order_by(models.Drive.drive_id.desc())
            .offset(skip)
            .limit(limit)
        )
        .scalars()
        .all()
    )


def get_drive(db: Session, drive_id: int):
    return (
        db.execute(select(models.Drive).where(models.Drive.drive_id == drive_id))
        .scalars()
        .first()
    )


def get_drives_by_driver(db: Session, driver_id: int):
    return (
        db.execute(
            select(models.Drive)
            .where(models.Drive.driver_id == driver_id)
            .order_by(models.Drive.drive_id.desc())
        )
        .scalars()
        .all()
    )


def get_drive_by_hash(db: Session, hash: str):
    return (
        db.execute(select(models.Drive).where(models.Drive.hash == hash))
        .scalars()
        .first()
    )


## WRITE DRIVES
def create_drive(db: Session, drive: schemas.DriveCreate):

    db_drive = models.Drive(
        driver_id=drive.driver_id, date=drive.date, notes=drive.notes, hash=drive.hash
    )
    db.add(db_drive)
    db.commit()
    db.refresh(db_drive)

    return db_drive


def delete_drive(db: Session, drive: models.Drive):
    db.delete(drive)
    db.commit()


## READ RAW DATA


def get_all_data_from_drive(db: Session, drive_id: int):
    return (
        db.execute(select(models.RawData).where(models.RawData.drive_id == drive_id))
        .scalars()
        .all()
    )


def get_sensors_data_from_drive(db: Session, drive_id: int, sensor_id: int):
    return (
        db.execute(
            select(models.RawData)
            .where(models.RawData.drive_id == drive_id)
            .where(models.RawData.msg_id == sensor_id)
            .order_by(models.RawData.time.asc())
        )
        .scalars()
        .all()
    )


def get_downsample_data_from_drive(
    db: Session, drive_id: int, sensor_id: int, start: int, end: int
):
    # Base query with time filtering
    base_statement = (
        select(models.RawData)
        .where(models.RawData.drive_id == drive_id)
        .where(models.RawData.msg_id == sensor_id)
    )

    if end != -1:
        base_statement = base_statement.where(models.RawData.time <= end)
    if start != 0:
        base_statement = base_statement.where(models.RawData.time >= start)

    base_statement = base_statement.order_by(models.RawData.time.asc())

    # Create subquery with grouping buckets
    grouped_subq = (
        base_statement.add_columns(
            func.ntile(500).over(order_by=models.RawData.time).label("bucket")
        )
    ).subquery()

    # Create alias for RawData model
    grouped_alias = aliased(models.RawData, grouped_subq)

    # Get first record from each bucket
    return (
        db.execute(
            select(grouped_alias)
            .distinct(grouped_subq.c.bucket)
            .order_by(grouped_subq.c.bucket, grouped_subq.c.time)
            .limit(500)
        )
        .scalars()
        .all()
    )


## WRITE RAW DATA


def create_raw_data(db: Session, data: schemas.RawDataCreate):
    db_data = models.RawData(
        drive_id=data.drive_id,
        msg_id=data.msg_id,
        raw_data=data.raw_data,
        time=data.time,
    )

    db.add(db_data)
    db.commit()
    db.refresh(db_data)

    return db_data
