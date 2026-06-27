"""
pytest tests for POST /api/checkout, GET /api/orders, GET /api/orders/{id}.
Uses an isolated in-memory SQLite DB per test.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import Category, Product
from app.main import app


def _auth_header(client: TestClient, email: str = "test@example.com", password: str = "pass1234") -> dict:
    client.post("/auth/register", json={"email": email, "password": password})
    resp = client.post("/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    cat = Category(name="Runners")
    db.add(cat)
    db.flush()
    db.add_all([
        Product(name="AirStride Pro", price=119.99, category_id=cat.id,
                description="Lightweight trainer", rating=4.7, stock=10),
        Product(name="SpeedForm Elite", price=89.99, category_id=cat.id,
                description="Tempo runner", rating=4.5, stock=2),
        Product(name="TrailBlaze 2", price=74.99, category_id=cat.id,
                description="Trail runner", rating=4.1, stock=0),
    ])
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)
    del app.dependency_overrides[get_db]


client = TestClient(app)


def test_checkout_succeeds_and_returns_order():
    resp = client.post("/api/checkout", json={"items": [
        {"product_id": 1, "quantity": 2},
        {"product_id": 2, "quantity": 1},
    ]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert isinstance(data["order_id"], int)
    assert data["total"] == round(119.99 * 2 + 89.99, 2)


def test_checkout_decrements_stock():
    before = client.get("/api/products?q=AirStride").json()["items"][0]["stock"]
    assert before == 10

    client.post("/api/checkout", json={"items": [{"product_id": 1, "quantity": 3}]})

    after = client.get("/api/products?q=AirStride").json()["items"][0]["stock"]
    assert after == 7


def test_checkout_fails_for_unknown_product():
    resp = client.post("/api/checkout", json={"items": [{"product_id": 999, "quantity": 1}]})
    assert resp.status_code == 404


def test_checkout_fails_for_out_of_stock():
    # TrailBlaze 2 has stock=0
    resp = client.post("/api/checkout", json={"items": [{"product_id": 3, "quantity": 1}]})
    assert resp.status_code == 400
    assert "stock" in resp.json()["detail"].lower()


def test_checkout_fails_when_quantity_exceeds_stock():
    # SpeedForm Elite has stock=2, requesting 5
    resp = client.post("/api/checkout", json={"items": [{"product_id": 2, "quantity": 5}]})
    assert resp.status_code == 400


def test_order_total_matches_line_items():
    resp = client.post("/api/checkout", json={"items": [
        {"product_id": 1, "quantity": 1},
        {"product_id": 2, "quantity": 2},
    ]})
    assert resp.json()["total"] == round(119.99 * 1 + 89.99 * 2, 2)


def test_order_history_returns_newest_first():
    headers = _auth_header(client)
    client.post("/api/checkout", json={"items": [{"product_id": 1, "quantity": 1}]}, headers=headers)
    client.post("/api/checkout", json={"items": [{"product_id": 2, "quantity": 1}]}, headers=headers)

    orders = client.get("/api/orders", headers=headers).json()
    assert len(orders) == 2
    assert orders[0]["id"] > orders[1]["id"]


def test_order_detail_includes_line_items():
    headers = _auth_header(client, email="detail@example.com")
    resp = client.post("/api/checkout", json={"items": [
        {"product_id": 1, "quantity": 2},
    ]}, headers=headers)
    order_id = resp.json()["order_id"]

    detail = client.get(f"/api/orders/{order_id}", headers=headers).json()
    assert detail["id"] == order_id
    assert len(detail["items"]) == 1
    assert detail["items"][0]["product_name"] == "AirStride Pro"
    assert detail["items"][0]["quantity"] == 2
    assert detail["items"][0]["price"] == 119.99


def test_order_not_found_returns_404():
    headers = _auth_header(client, email="notfound@example.com")
    resp = client.get("/api/orders/99999", headers=headers)
    assert resp.status_code == 404
