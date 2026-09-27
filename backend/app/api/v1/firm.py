from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models import FirmProfile
from app.schemas import FirmProfileBase, FirmProfileOut

router = APIRouter(prefix="/firm", tags=["Firm Profile"])


@router.get("", response_model=FirmProfileOut)
def get_firm(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    obj = db.get(FirmProfile, 1)
    if not obj:
        obj = FirmProfile(id=1)
        db.add(obj)
        db.commit()
        db.refresh(obj)
    return obj


@router.put("", response_model=FirmProfileOut)
def update_firm(
    data: FirmProfileBase, db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    obj = db.get(FirmProfile, 1)
    if not obj:
        obj = FirmProfile(id=1)
        db.add(obj)
    for key, value in data.model_dump().items():
        setattr(obj, key, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(obj)
    return obj
