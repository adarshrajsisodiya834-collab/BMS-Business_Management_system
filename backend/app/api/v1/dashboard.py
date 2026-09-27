from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models import Customer, Product, Order, Invoice

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def stats(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    revenue = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0))
        .filter(Order.status == "Paid")
        .scalar()
        or 0
    )
    return {
        "customers": db.query(Customer).count(),
        "products": db.query(Product).count(),
        "orders": db.query(Order).count(),
        "unpaid_invoices": db.query(Invoice).filter(Invoice.status == "Unpaid").count(),
        "revenue": float(revenue),
    }
