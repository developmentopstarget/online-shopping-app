from datetime import datetime
from pydantic import BaseModel, Field, computed_field
from typing import Optional, List


class UserCreate(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    is_admin: bool
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


class ProductCreate(BaseModel):
    name: str
    price: float = Field(gt=0)
    category_id: int
    description: str = ""
    rating: float = Field(default=0.0, ge=0.0, le=5.0)
    stock: int = Field(ge=0)
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    category_id: Optional[int] = None
    description: Optional[str] = None
    rating: Optional[float] = Field(default=None, ge=0.0, le=5.0)
    stock: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = None


class StockUpdate(BaseModel):
    stock: int = Field(ge=0)
