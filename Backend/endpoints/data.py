from fastapi import APIRouter

router = APIRouter()

@router.get("/data")
def get_users():
    return {"data": ["d", "at", "da"]}

@router.get("/drive/{data_id}")
def get_user(data_id: int):
    return {"drive_id": data_id}