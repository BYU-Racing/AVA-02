# NOT USED CURRENTLY

from sqlalchemy.orm import Session
from .. import crud, models, schemas
import uuid
from ..database import SessionLocal

# ========== Functions for adding data to database ===========

def normalize_raw_data(raw_data: List[int]) -> List[int]:
    # Analysis pipeline expects 8-byte payload-style arrays.
    return (raw_data + [0] * 8)[:8]

def get_or_create_default_driver_id(db: Session) -> int:
    driver = crud.get_driver(db, DEFAULT_LIVE_DRIVER_ID)
    if driver is not None:
        return driver.driver_id

    try:
        default_driver = models.Driver(
            driver_id=DEFAULT_LIVE_DRIVER_ID,
            name=DEFAULT_LIVE_DRIVER_NAME
        )
        db.add(default_driver)
        db.commit()
        db.refresh(default_driver)
        logger.info(
            "Created default live telemetry driver with id=%s",
            default_driver.driver_id
        )
        return default_driver.driver_id
    except Exception as exc:
        db.rollback()
        logger.warning(
            "Could not create default driver id=%s (%s). Falling back.",
            DEFAULT_LIVE_DRIVER_ID,
            exc
        )

    existing_by_name = crud.get_driver_by_name(db, DEFAULT_LIVE_DRIVER_NAME)
    if existing_by_name is not None:
        return existing_by_name.driver_id

    fallback_driver = crud.create_driver(
        db=db,
        user=schemas.DriverCreate(name=DEFAULT_LIVE_DRIVER_NAME)
    )
    logger.warning(
        "Using fallback live telemetry driver id=%s",
        fallback_driver.driver_id
    )
    return fallback_driver.driver_id

def create_live_drive(db: Session) -> models.Drive:
    driver_id = get_or_create_default_driver_id(db)
    now = datetime.now(UTC_PLUS_8)

    drive = schemas.DriveCreate(
        driver_id=driver_id,
        date=now,
        notes=AUTO_DRIVE_NOTE,
        hash=f"live-{uuid.uuid4().hex}"
    )
    return crud.create_drive(db=db, drive=drive)

def persist_live_packet(db: Session, drive_id: int, decoded_packet: Dict):
    db_row = models.RawData(
        drive_id=drive_id,
        msg_id=decoded_packet["id"],
        raw_data=normalize_raw_data(decoded_packet["bytes"]),
        time=decoded_packet["timestamp"]
    )
    db.add(db_row)
    db.commit()