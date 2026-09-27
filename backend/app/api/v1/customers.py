from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models import Customer, Order
from app.schemas import CustomerCreate, CustomerOut

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=list[CustomerOut])
def list_customers(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(Customer).order_by(Customer.id.desc()).all()


@router.post("", response_model=CustomerOut)
def create_customer(
    data: CustomerCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    obj = Customer(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    data: CustomerCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    obj = db.get(Customer, customer_id)
    if not obj:
        raise HTTPException(404, "Customer not found")
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    obj = db.get(Customer, customer_id)
    if not obj:
        raise HTTPException(404, "Customer not found")
    if db.query(Order).filter(Order.customer_id == customer_id).first():
        raise HTTPException(
            400,
            "Customer has order history and cannot be deleted. Edit the customer instead.",
        )
    db.delete(obj)
    db.commit()
    return {"message": "Customer deleted"}
