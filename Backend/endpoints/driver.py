from fastapi import APIRouter, Depends, HTTPException
from Backend import crud, models, schemas
from Backend.database import SessionLocal, engine
from sqlalchemy.orm import Session


router = APIRouter()

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/driver", response_model=list[schemas.DriverSimple])
def get_drivers(db: Session = Depends(get_db)):
    drivers = crud.get_drivers(db)

    return drivers


@router.get("/driver/{id}", response_model=schemas.DriverSimple)
def get_driver_by_id(id: int, db: Session = Depends(get_db)):
    driver = crud.get_driver(db, id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@router.post("/driver", response_model=schemas.DriverSimple)
def create_driver(driver: schemas.DriverCreate, db: Session = Depends(get_db)):
    db_driver = crud.get_driver_by_name(db, driver.name)
    if db_driver:
        raise HTTPException(status_code=400, detail="Driver already registered")
    
    return crud.create_driver(db=db, user=driver)
