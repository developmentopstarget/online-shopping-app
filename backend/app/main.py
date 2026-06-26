"""
Sneaker Shop API — v1
A simple FastAPI backend for an online shopping app.
Endpoints: list products, get one product, "checkout" (fake/test mode).
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Sneaker Shop API")

# --- CORS setup ---
# Without this, the browser blocks requests from your React app (port 5173)
# to this API (port 8000), since they're on different ports.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Data models ---
# Pydantic models define the exact "shape" of data going in/out.
# FastAPI uses these to validate requests automatically.

class Product(BaseModel):
    id: int
    name: str
    price: float
    icon: str  # used by the frontend to pick an icon, no real images yet


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


# --- Fake in-memory "database" ---
# In v1, we don't have a real database yet — just a Python list.
# This resets every time the server restarts. That's fine for now.

PRODUCTS = [
    Product(id=1, name="Classic runner", price=59.00, icon="shoe"),
    Product(id=2, name="Trail boot", price=89.00, icon="shoe"),
    Product(id=3, name="Slip-on", price=45.00, icon="shoe"),
]


# --- Routes ---

@app.get("/")
def root():
    return {"status": "Sneaker Shop API is running"}


@app.get("/api/products", response_model=List[Product])
def get_products():
    """Return all products in the catalog."""
    return PRODUCTS


@app.get("/api/products/{product_id}", response_model=Product)
def get_product(product_id: int):
    """Return one product by id, or 404 if it doesn't exist."""
    for product in PRODUCTS:
        if product.id == product_id:
            return product
    raise HTTPException(status_code=404, detail="Product not found")


@app.post("/api/checkout", response_model=CheckoutResponse)
def checkout(request: CheckoutRequest):
    """
    Fake checkout — no real payment processor connected yet.
    Calculates the total and pretends the order succeeded.
    This is where Stripe (or similar) would plug in later.
    """
    total = 0.0
    for item in request.items:
        product = next((p for p in PRODUCTS if p.id == item.product_id), None)
        if product is None:
            raise HTTPException(
                status_code=400, detail=f"Unknown product_id {item.product_id}"
            )
        total += product.price * item.quantity

    return CheckoutResponse(
        success=True,
        order_id="TEST-ORDER-001",
        total=round(total, 2),
        message="This is a test checkout — no real payment was made.",
    )
