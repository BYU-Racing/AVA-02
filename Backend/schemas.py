from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# Schema for RawData
class RawDataBase(BaseModel):
    msg_id: int
    raw_data: List[int]
    time: int


class RawDataCreate(RawDataBase):
    drive_id: int


class RawData(RawDataBase):
    data_id: int

    class Config:
        orm_mode = True


# Schema for Drive



class DriveBase(BaseModel):
    date: datetime
    notes: Optional[str] = None


class DriveCreate(DriveBase):
    driver_id: int


class Drive(DriveBase):
    drive_id: int
    raw_data: List[RawData] = []

    class Config:
        orm_mode = True


# Schema for Driver
class DriverBase(BaseModel):
    name: str


class DriverCreate(DriverBase):
    pass


class Driver(DriverBase):
    driver_id: int
    drives: List[Drive] = []

    class Config:
        orm_mode = True


class DriverSimple(BaseModel):
    name: str
    driver_id: int

    class Config:
        orm_mode = True

class DriveSimple(BaseModel):
    date: datetime
    notes: Optional[str] = None
    driver: DriverSimple
    drive_id: int

    class Config:
        orm_mode = True



class FileBase(BaseModel):
    drive_id: int
    hash: str


class File(FileBase):
    file_id: int

    class Config:
        orm_mode = True

