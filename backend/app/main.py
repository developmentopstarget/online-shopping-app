"""
Sneaker Shop API — M3
Adds JWT auth (register/login), user-scoped order history.
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from .database import engine, get_db
from .models import Base, Product, Category, Order, OrderItem, User
from .schemas import (
    ProductOut,
    ProductListResponse,
    CategoryOut,
    CheckoutRequest,
    CheckoutResponse,
    OrderOut,
    OrderListItem,
    UserCreate,
    UserOut,
    TokenResponse,
)
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_current_user,
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


@app.post("/auth/register", response_model=TokenResponse)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(func.lower(User.email) == payload.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        user=UserOut.model_validate(user),
    )


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()
    # Intentionally identical error for wrong email vs wrong password to avoid email enumeration.
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(
        access_token=create_access_token(user.id),
        user=UserOut.model_validate(user),
    )


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
def checkout(
    request: CheckoutRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    if not request.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = 0.0
    validated: list[tuple[Product, int]] = []

    for item in request.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f'"{product.name}" only has {product.stock} in stock',
            )
        total += product.price * item.quantity
        validated.append((product, item.quantity))

    order = Order(
        total=round(total, 2),
        user_id=current_user.id if current_user else None,
    )
    db.add(order)
    db.flush()

    for product, quantity in validated:
        db.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            price=product.price,
            quantity=quantity,
        ))
        product.stock -= quantity

    db.commit()
    db.refresh(order)

    return CheckoutResponse(
        success=True,
        order_id=order.id,
        total=order.total,
        message="Order placed.",
    )


@app.get("/api/orders", response_model=list[OrderListItem])
def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
        .all()
    )
    return [
        OrderListItem(
            id=o.id,
            created_at=o.created_at,
            status=o.status,
            total=o.total,
            item_count=sum(i.quantity for i in o.items),
        )
        for o in orders
    ]


@app.get("/api/orders/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
