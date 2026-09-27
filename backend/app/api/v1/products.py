from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models import Product, Category, OrderItem
from app.schemas import ProductCreate, ProductOut, CategoryCreate, CategoryOut

router = APIRouter(tags=["Inventory"])


@router.get("/products", response_model=list[ProductOut])
def list_products(
    q: str = Query(""), db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    query = db.query(Product)
    q = q.strip()
    if q:
        like = f"%{q}%"
        query = query.filter((Product.name.ilike(like)) | (Product.sku.ilike(like)))
    return query.order_by(Product.id.desc()).all()


@router.post("/products", response_model=ProductOut)
def create_product(
    data: ProductCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    if db.query(Product).filter(Product.sku == data.sku).first():
        raise HTTPException(400, "SKU already exists")
    obj = Product(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    data: ProductCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    obj = db.get(Product, product_id)
    if not obj:
        raise HTTPException(404, "Product not found")
    duplicate = (
        db.query(Product)
        .filter(Product.sku == data.sku, Product.id != product_id)
        .first()
    )
    if duplicate:
        raise HTTPException(400, "SKU already exists")
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    obj = db.get(Product, product_id)
    if not obj:
        raise HTTPException(404, "Product not found")
    if db.query(OrderItem).filter(OrderItem.product_id == product_id).first():
        raise HTTPException(
            400,
            "Product has sales history and cannot be deleted. Edit the product instead.",
        )
    db.delete(obj)
    db.commit()
    return {"message": "Product deleted"}


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(Category).order_by(Category.name).all()


@router.post("/categories", response_model=CategoryOut)
def create_category(
    data: CategoryCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)
):
    obj = Category(name=data.name.strip())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
