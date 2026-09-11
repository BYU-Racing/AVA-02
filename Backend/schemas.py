# file: schemas.py
# Desc: Pydantic schemas for database models

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# Schema for RawData
class RawDataBase(BaseModel):
    msg_id: int
    raw_data: List[int]
    time: int


class RawDataCreate(RawDataBase):
    drive_id: int


class RawData(RawDataBase):
    data_id: int

    model_config = ConfigDict(from_attributes=True)


# Schema for Drive


class DriveBase(BaseModel):
    date: datetime
    notes: Optional[str] = None
    hash: Optional[str] = None


class DriveCreate(DriveBase):
    driver_id: int


class Drive(DriveBase):
    drive_id: int
    raw_data: List[RawData] = []

    model_config = ConfigDict(from_attributes=True)


# Schema for deleting drives; the drive_id is included in the url
class DeleteDriveRequest(BaseModel):
    password: str


# Schema for Driver


class DriverBase(BaseModel):
    name: str


class DriverCreate(DriverBase):
    pass


class Driver(DriverBase):
    driver_id: int
    drives: List[Drive] = []

    model_config = ConfigDict(from_attributes=True)


class DriverSimple(BaseModel):
    name: str
    driver_id: int

    model_config = ConfigDict(from_attributes=True)


class DriveSimple(BaseModel):
    date: datetime
    notes: Optional[str] = None
    driver: DriverSimple
    drive_id: int

    model_config = ConfigDict(from_attributes=True)
