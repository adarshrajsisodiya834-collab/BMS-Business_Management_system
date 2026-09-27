from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models import Admin, Category, Customer, Product
from app.core.config import settings
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    if not db.query(Admin).first():
        db.add(
            Admin(
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
            )
        )

    if db.query(Category).count() == 0:
        for name in ["General", "Electronics", "Office"]:
            db.add(Category(name=name))
        db.commit()

    if db.query(Customer).count() == 0:
        db.add_all(
            [
                Customer(
                    name="Aarav Sharma",
                    email="aarav@example.com",
                    phone="9876543210",
                    address="Mumbai",
                ),
                Customer(
                    name="Priya Singh",
                    email="priya@example.com",
                    phone="9876501234",
                    address="Delhi",
                ),
                Customer(
                    name="Rohan Mehta",
                    email="rohan@example.com",
                    phone="9812345678",
                    address="Pune",
                ),
            ]
        )

    if db.query(Product).count() == 0:
        db.add_all(
            [
                Product(
                    name="Laptop",
                    sku="LAP-001",
                    price=65000,
                    quantity_in_stock=12,
                    category_id=2,
                ),
                Product(
                    name="Office Chair",
                    sku="CHR-001",
                    price=8500,
                    quantity_in_stock=20,
                    category_id=3,
                ),
                Product(
                    name="Keyboard",
                    sku="KEY-001",
                    price=1800,
                    quantity_in_stock=35,
                    category_id=2,
                ),
            ]
        )
    db.commit()
    print("Database initialized successfully.")
    print(f"Admin email: {settings.ADMIN_EMAIL}")
    print(f"Admin password: {settings.ADMIN_PASSWORD}")
finally:
    db.close()
