from datetime import datetime
from pydantic import BaseModel, computed_field
from typing import Optional, List


class UserCreate(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CategoryOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class ProductOut(BaseModel):
    id: int
    name: str
    price: float
    category_id: int
    category_name: str
    description: str
    rating: float
    stock: int
    image_url: Optional[str]

    @computed_field
    @property
    def stock_status(self) -> str:
        if self.stock == 0:
            return "out_of_stock"
        if self.stock <= 5:
            return "low_stock"
        return "in_stock"

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: List[ProductOut]
    total: int


class CartItem(BaseModel):
    product_id: int
    quantity: int


class CheckoutRequest(BaseModel):
    items: List[CartItem]


class CheckoutResponse(BaseModel):
    success: bool
    order_id: int
    total: float
    message: str


class OrderItemOut(BaseModel):
    product_id: int
    product_name: str
    price: float
    quantity: int

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    created_at: datetime
    status: str
    total: float
    items: List[OrderItemOut]

    model_config = {"from_attributes": True}


class OrderListItem(BaseModel):
    id: int
    created_at: datetime
    status: str
    total: float
    item_count: int
