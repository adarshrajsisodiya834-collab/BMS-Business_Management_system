from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.base import Base
from app.db.session import engine
from sqlalchemy import inspect, text
from app.api.v1 import auth, customers, products, orders, invoices, dashboard, firm

Base.metadata.create_all(bind=engine)

if engine.url.get_backend_name() == "sqlite":
    inspector = inspect(engine)
    customer_columns = (
        {c["name"] for c in inspector.get_columns("customers")}
        if "customers" in inspector.get_table_names()
        else set()
    )
    with engine.begin() as conn:
        for name, ddl in [
            ("company_name", "VARCHAR(200) DEFAULT ''"),
            ("gstin", "VARCHAR(30) DEFAULT ''"),
        ]:
            if name not in customer_columns:
                conn.execute(text(f"ALTER TABLE customers ADD COLUMN {name} {ddl}"))

app = FastAPI(
    title="Business Management System API",
    version="1.0.0",
    description="Single-admin demo Business Management System.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(invoices.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(firm.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "BMS API is running", "docs": "/docs"}
