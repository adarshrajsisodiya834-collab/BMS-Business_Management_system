from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class CustomerCreate(BaseModel):
    name: str
    company_name: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    gstin: str = ""


class CustomerOut(CustomerCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float = 0
    quantity_in_stock: int = 0
    category_id: int | None = None


class ProductOut(ProductCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CategoryCreate(BaseModel):
    name: str


class CategoryOut(CategoryCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItemCreate]


class OrderOut(BaseModel):
    id: int
    customer_id: int
    status: str
    total_amount: float
    created_at: datetime
    items: list[OrderItemOut] = []
    model_config = ConfigDict(from_attributes=True)


class FirmProfileBase(BaseModel):
    firm_name: str = ""
    legal_name: str = ""
    business_type: str = ""
    gstin: str = ""
    pan: str = ""
    registration_no: str = ""
    gst_registration_type: str = ""
    phone: str = ""
    email: str = ""
    website: str = ""
    address_line1: str = ""
    address_line2: str = ""
    city: str = ""
    state: str = ""
    state_code: str = ""
    pin_code: str = ""
    country: str = "India"


class FirmProfileOut(FirmProfileBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
