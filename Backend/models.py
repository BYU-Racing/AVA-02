from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Driver(Base):
    __tablename__ = "drivers"
    driver_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String)

    drives = relationship("Drive", back_populates="driver")


class Drive(Base):
    __tablename__ = "drive"

    drive_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    driver_id: Mapped[int] = mapped_column(Integer, ForeignKey("drivers.driver_id"))
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    hash: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)

    driver = relationship("Driver", back_populates="drives")

    raw_data = relationship(
        "RawData",
        back_populates="drive",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class RawData(Base):
    __tablename__ = "raw_data"
    __table_args__ = (
        Index("ix_raw_data_drive_msg_time", "drive_id", "msg_id", "time"),
    )

    data_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    drive_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("drive.drive_id", ondelete="CASCADE"),
        nullable=False,
    )
    msg_id: Mapped[int] = mapped_column(Integer)
    raw_data: Mapped[list[int]] = mapped_column(ARRAY(Integer), nullable=False)
    time: Mapped[int] = mapped_column(Integer)

    drive = relationship("Drive", back_populates="raw_data")
