from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models import Invoice, Order, Customer, OrderItem, Product

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def serialize_invoice(x):
    order = x.order
    customer = order.customer if order else None
    items = []
    if order:
        for item in order.items:
            items.append(
                {
                    "product_id": item.product_id,
                    "product_name": (
                        item.product.name
                        if item.product
                        else f"Product #{item.product_id}"
                    ),
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "line_total": item.quantity * item.unit_price,
                }
            )
    return {
        "id": x.id,
        "invoice_number": x.invoice_number,
        "status": x.status,
        "issued_at": x.issued_at,
        "order_id": order.id if order else None,
        "order_status": order.status if order else None,
        "order_total": order.total_amount if order else 0,
        "customer_id": customer.id if customer else None,
        "customer_name": customer.name if customer else "Unknown customer",
        "customer_email": customer.email if customer else "",
        "customer_phone": customer.phone if customer else "",
        "customer_address": customer.address if customer else "",
        "customer_company": customer.company_name if customer else "",
        "customer_gstin": customer.gstin if customer else "",
        "items": items,
    }


@router.get("")
def list_invoices(
    q: str = Query("", description="Search invoice number, order ID or customer"),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    query = (
        db.query(Invoice)
        .join(Order, Invoice.order_id == Order.id)
        .join(Customer, Order.customer_id == Customer.id)
    )
    q = q.strip()
    if q:
        like = f"%{q}%"
        filters = [Invoice.invoice_number.ilike(like), Customer.name.ilike(like)]
        if q.isdigit():
            n = int(q)
            filters.extend([Invoice.order_id == n, Invoice.id == n])
        query = query.filter(or_(*filters))
    rows = query.order_by(Invoice.id.desc()).all()
    return [serialize_invoice(x) for x in rows]


@router.get("/{invoice_id}")
def get_invoice(
    invoice_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    return serialize_invoice(invoice)


@router.patch("/{invoice_id}/status")
def update_invoice_status(
    invoice_id: int,
    status: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    status = status.strip().capitalize()
    if status not in {"Unpaid", "Paid", "Cancelled"}:
        raise HTTPException(400, "Status must be Unpaid, Paid or Cancelled")
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    order = invoice.order
    if order:
        old_status = order.status
        new_order_status = (
            "Paid"
            if status == "Paid"
            else ("Cancelled" if status == "Cancelled" else "Pending")
        )
        if old_status != new_order_status:
            if new_order_status == "Cancelled" and old_status != "Cancelled":
                for item in order.items:
                    product = db.get(Product, item.product_id)
                    if product:
                        product.quantity_in_stock += item.quantity
            elif old_status == "Cancelled" and new_order_status != "Cancelled":
                for item in order.items:
                    product = db.get(Product, item.product_id)
                    if not product or product.quantity_in_stock < item.quantity:
                        raise HTTPException(
                            400, f"Insufficient stock to reopen order #{order.id}"
                        )
                for item in order.items:
                    product = db.get(Product, item.product_id)
                    product.quantity_in_stock -= item.quantity
            order.status = new_order_status
    invoice.status = status
    db.commit()
    db.refresh(invoice)
    return serialize_invoice(invoice)
