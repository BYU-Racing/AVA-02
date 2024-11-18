from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY

from .database import Base


class Driver(Base):
    __tablename__ = "drivers"
    driver_id = Column(Integer, primary_key=True)
    name = Column(String)

    drives = relationship("Drive", back_populates="driver")


class Drive(Base):
    __tablename__ = "drive"

    drive_id = Column(Integer, primary_key=True)
    driver_id = Column(Integer, ForeignKey("drivers.driver_id"))
    date = Column(DateTime)
    notes = Column(String)


    driver = relationship("Driver", back_populates="drives")


    raw_data = relationship("RawData", back_populates="drive")




class RawData(Base):
    __tablename__ = "raw_data"
    data_id = Column(Integer, primary_key=True)
    drive_id = Column(Integer, ForeignKey("drive.drive_id"))
    msg_id = Column(Integer)
    raw_data = Column(ARRAY(Integer))
    time = Column(Integer)


    drive = relationship("Drive", back_populates="raw_data")