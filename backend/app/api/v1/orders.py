from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models import Order, OrderItem, Customer, Product, Invoice
from app.schemas import OrderCreate, OrderOut

router = APIRouter(prefix="/orders", tags=["Orders"])


def _sync_invoice(order, db):
    invoice = db.query(Invoice).filter(Invoice.order_id == order.id).first()
    if invoice:
        invoice.status = (
            "Paid"
            if order.status == "Paid"
            else ("Cancelled" if order.status == "Cancelled" else "Unpaid")
        )


def _change_status(order, new_status, db):
    old_status = order.status
    if old_status == new_status:
        return
    if new_status == "Cancelled" and old_status != "Cancelled":
        for item in order.items:
            product = db.get(Product, item.product_id)
            if product:
                product.quantity_in_stock += item.quantity
    elif old_status == "Cancelled" and new_status != "Cancelled":
        for item in order.items:
            product = db.get(Product, item.product_id)
            if not product or product.quantity_in_stock < item.quantity:
                raise HTTPException(
                    400, f"Insufficient stock to reopen order #{order.id}"
                )
        for item in order.items:
            product = db.get(Product, item.product_id)
            product.quantity_in_stock -= item.quantity
    order.status = new_status
    _sync_invoice(order, db)


@router.get("", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(Order).order_by(Order.id.desc()).all()


@router.post("", response_model=OrderOut)
def create_order(
    data: OrderCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    customer = db.get(Customer, data.customer_id)
    if not customer:
        raise HTTPException(400, "Customer not found")
    if not data.items:
        raise HTTPException(400, "Add at least one product to the order")

    merged = {}
    for row in data.items:
        if row.quantity <= 0:
            raise HTTPException(400, "Quantity must be greater than zero")
        merged[row.product_id] = merged.get(row.product_id, 0) + row.quantity

    products = {}
    total = 0.0
    for product_id, quantity in merged.items():
        product = db.get(Product, product_id)
        if not product:
            raise HTTPException(400, f"Product #{product_id} not found")
        if product.quantity_in_stock < quantity:
            raise HTTPException(400, f"Insufficient stock for {product.name}")
        products[product_id] = product
        total += product.price * quantity

    order = Order(customer_id=customer.id, total_amount=total, status="Pending")
    db.add(order)
    db.flush()
    for product_id, quantity in merged.items():
        product = products[product_id]
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=product.price,
            )
        )
        product.quantity_in_stock -= quantity
    db.add(
        Invoice(
            order_id=order.id, invoice_number=f"INV-{order.id:05d}", status="Unpaid"
        )
    )
    db.commit()
    db.refresh(order)
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    status = status.strip().capitalize()
    if status not in {"Pending", "Paid", "Cancelled"}:
        raise HTTPException(400, "Status must be Pending, Paid or Cancelled")
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    _change_status(order, status, db)
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    return order
