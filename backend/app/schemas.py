from pydantic import BaseModel, computed_field
from typing import Optional, List


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
    order_id: str
    total: float
    message: str
