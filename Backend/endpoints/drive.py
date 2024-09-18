from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()

@router.get("/drive")
def get_users():
    return {"drives": ["drive", "drive", "drive"]}

@router.get("/drive/{drive_id}")
def get_user(drive_id: int):
    return {"drive_id": drive_id}