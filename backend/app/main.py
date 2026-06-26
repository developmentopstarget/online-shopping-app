"""
Sneaker Shop API — M1
Real SQLite database via SQLAlchemy. Products support search, category filter,
price range, sort, and pagination.
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from .database import engine, get_db
from .models import Base, Product, Category
from .schemas import (
    ProductOut,
    ProductListResponse,
    CategoryOut,
    CheckoutRequest,
    CheckoutResponse,
)
from .seed import seed

Base.metadata.create_all(bind=engine)
seed()

app = FastAPI(title="Sneaker Shop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PAGE_SIZE = 12


@app.get("/")
def root():
    return {"status": "Sneaker Shop API is running"}


@app.get("/api/categories", response_model=list[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name).all()


@app.get("/api/products", response_model=ProductListResponse)
def get_products(
    q: Optional[str] = Query(None),
    category: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort: Optional[str] = Query(None, pattern="^(price_asc|price_desc)$"),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if q:
        query = query.filter(func.lower(Product.name).contains(q.lower()))
    if category is not None:
        query = query.filter(Product.category_id == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.id.asc())

    total = query.count()
    products = query.offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()

    items = [
        ProductOut(
            id=p.id,
            name=p.name,
            price=p.price,
            category_id=p.category_id,
            category_name=p.category.name,
            description=p.description,
            rating=p.rating,
            stock=p.stock,
            image_url=p.image_url,
        )
        for p in products
    ]
    return ProductListResponse(items=items, total=total)


@app.get("/api/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductOut(
        id=product.id,
        name=product.name,
        price=product.price,
        category_id=product.category_id,
        category_name=product.category.name,
        description=product.description,
        rating=product.rating,
        stock=product.stock,
        image_url=product.image_url,
    )


@app.post("/api/checkout", response_model=CheckoutResponse)
def checkout(request: CheckoutRequest, db: Session = Depends(get_db)):
    total = 0.0
    for item in request.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
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
