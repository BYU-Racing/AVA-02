# file: drive.py
# Desc: Endpoint for adding and getting drive data

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query
from fastapi.responses import StreamingResponse
import pandas as pd
import io
import csv
import re
from .. import crud, models, schemas
from ..database import SessionLocal, engine
from sqlalchemy.orm import Session
from secrets import compare_digest
from ..configDB import DELETE_PASSWORD
from ..services.livetelemetry_decoder import CAN_DB
from cantools.database.errors import DecodeError
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

@router.delete("/drive/{drive_id}", response_model=dict)
def delete_drive(drive_id: int, 
                 delete_request: schemas.DeleteDriveRequest,
                 db: Session = Depends(get_db)):
    drive = crud.get_drive(db, drive_id)
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    if not compare_digest(delete_request.password, DELETE_PASSWORD):
        raise HTTPException(status_code=403, detail="Wrong password")

    crud.delete_drive(db, drive)
    return {"message": "Drive deleted successfully"}

@router.get("/drive/{drive_id}/csv")
def download_drive_csv(drive_id: int, msg_ids: list[int] | None = Query(None), db: Session = Depends(get_db)):
    drive = crud.get_drive(db, drive_id)
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    if msg_ids is not None and len(msg_ids) == 0:
        raise HTTPException(status_code=400, detail="Select at least one sensor")
    raw_rows = crud.get_sensor_data_by_msg_id(db, drive_id, msg_ids)
    csv_buffer = io.StringIO()
    writer = csv.writer(csv_buffer)
    writer.writerow([
        "msg_id",
        "time",
        "buffer0",
        "buffer1",
        "buffer2",
        "buffer3",
        "buffer4",
        "buffer5",
        "buffer6",
        "buffer7",
    ])

    for row in raw_rows:
        raw_data = list(row.raw_data or [])
        padded_raw_data = raw_data + [None] * (8 - len(raw_data))
        writer.writerow([row.msg_id, row.time, *padded_raw_data[:8]])

    safe_driver_name = re.sub(r"[^A-Za-z0-9_-]+", "_", drive.driver.name).strip("_") or "driver"
    formatted_date = drive.date.strftime("%Y%m%d_%H%M%S")
    filename = f"{safe_driver_name}_{formatted_date}_drive_{drive.drive_id}.csv"

    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.get("/drive/{drive_id}/csv_decoded")
def download_drive_csv_decoded(drive_id:int, msg_ids:list[int] | None = Query(None), db: Session = Depends(get_db)):
    drive = crud.get_drive(db, drive_id)
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    if msg_ids is not None and len(msg_ids) == 0:
        raise HTTPException(status_code=400, detail="Select at least one sensor")
    raw_rows = crud.get_sensor_data_by_msg_id(db, drive_id, msg_ids) 

    decoded_rows = []
    signal_names = set()
    for row in raw_rows:
        try:
            message = CAN_DB.get_message_by_frame_id(row.msg_id)

            # Convert stored integer bytes into the format cantools expects
            payload = bytes(row.raw_data or [])

            # Apply the sensor/ signal definitions and scaling applies the byte offset 
            signals = message.decode(
                payload,
                decode_choices=False,
                scaling = True
            )

        except KeyError:
            # CAN ID has no matching message in DBC
            signals = {}
        except DecodeError:
            # ID exists but could not be decode eg. length doesn't match DBC message
            signals = {}
        
        signal_names.update(signals.keys())
        decoded_rows.append(
            {
                "time": row.time,
                "msg_id": row.msg_id,
                **signals,
            }
        )
    
    # Writing decoded column headers
    csv_buffer = io.StringIO()
    fieldnames = ["time", "msg_id", *sorted(signal_names)]
    writer = csv.DictWriter(csv_buffer, fieldnames=fieldnames)
    writer.writeheader()

    for decoded_row in decoded_rows:
        writer.writerow(decoded_row)

    
    safe_driver_name = re.sub(r"[^A-Za-z0-9_-]+", "_", drive.driver.name).strip("_") or "driver"
    formatted_date = drive.date.strftime("%Y%m%d_%H%M%S")
    filename = f"{safe_driver_name}_{formatted_date}_drive_{drive.drive_id}_decoded.csv"

    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.get("/drive/{drive_id}/log")
def download_drive_log(drive_id:int, msg_ids:list[int] | None = Query(None), db: Session = Depends(get_db)):
    drive = crud.get_drive(db, drive_id)
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    if msg_ids is not None and len(msg_ids) == 0:
        raise HTTPException(status_code=400, detail="Select at least one sensor")
    rows = crud.get_sensor_data_by_msg_id(db, drive_id, msg_ids)     

    lines = []
    for row in rows: 
        stored_bytes = list(row.raw_data or [])

        # Elapsed milliseconds since the drive's start time
        timestamp_seconds = drive.date.timestamp() + (row.time / 1000.0)

        # Use the DBC's frame size to remove padding for known CAN ID's 
        try: 
            message = CAN_DB.get_message_by_frame_id(row.msg_id)
            payload_length = message.length
        except KeyError: 
            # Uknown IDs 
            payload_length = len(stored_bytes)

        payload = stored_bytes[:payload_length]
        #converting payload to hexadecimal
        payload_hex = "".join(f"{byte:02X}" for byte in payload)

        # Use three hex digits for standard ID's and eight for extended IDs.
        id_width = 3 if row.msg_id <= 0x7FF else 8
        can_id = f"{row.msg_id:0{id_width}X}"

        lines.append(
            f"({timestamp_seconds:.6f}) can0 {can_id}#{payload_hex}"
        )

    log_text = "\n".join(lines)
    if lines:
        log_text += "\n"
    

    safe_driver_name = re.sub(r"[^A-Za-z0-9_-]+", "_", drive.driver.name).strip("_") or "driver"
    formatted_date = drive.date.strftime("%Y%m%d_%H%M%S")
    filename = f"{safe_driver_name}_{formatted_date}_drive_{drive.drive_id}.log"

    return StreamingResponse(
        iter([log_text]),
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.get("/sensors/{drive_id}", response_model=list[int])
def get_unique_sensors_from_drive(drive_id: int, db: Session = Depends(get_db)):
    sensors = crud.get_unique_sensors_from_drive(db, drive_id)

    if not sensors:
        raise HTTPException(status_code=404, detail="No sensors found for this drive")

    return sensors


@router.post("/drive", response_model=schemas.Drive)
def create_drive(drive: schemas.DriveCreate, db: Session = Depends(get_db)):
    #Need an endpoint for getting a drive by driveID
    db_drive = crud.get_drive_by_hash(db, drive.hash)

    if db_drive:
        raise HTTPException(status_code=400, detail="Drive already uploaded")
    
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

