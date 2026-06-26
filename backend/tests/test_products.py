"""
pytest tests for the /api/products and /api/categories endpoints.
Uses an in-memory SQLite DB so tests are isolated from the dev DB.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import Category, Product
from app.main import app

TEST_DB_URL = "sqlite:///:memory:"

# StaticPool ensures all connections share the same in-memory DB instance.
engine = create_engine(
    TEST_DB_URL,
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


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    runners = Category(name="Runners")
    boots = Category(name="Boots")
    db.add_all([runners, boots])
    db.flush()

    db.add_all([
        Product(name="AirStride Pro", price=119.99, category_id=runners.id,
                description="Lightweight trainer", rating=4.7, stock=42),
        Product(name="SpeedForm Elite", price=89.99, category_id=runners.id,
                description="Tempo runner", rating=4.5, stock=3),
        Product(name="TrailBlaze 2", price=74.99, category_id=runners.id,
                description="Entry trail runner", rating=4.1, stock=0),
        Product(name="HikeCore GTX", price=159.99, category_id=boots.id,
                description="Waterproof hiking boot", rating=4.6, stock=11),
        Product(name="Urban Chelsea", price=109.99, category_id=boots.id,
                description="Sleek Chelsea boot", rating=4.3, stock=5),
        Product(name="WorkForce Steel Toe", price=139.99, category_id=boots.id,
                description="Safety steel toe", rating=4.4, stock=0),
        # 7 more to test pagination (total = 13 > PAGE_SIZE 12)
        Product(name="Extra Boot A", price=50.00, category_id=boots.id,
                description="Extra", rating=4.0, stock=10),
        Product(name="Extra Boot B", price=55.00, category_id=boots.id,
                description="Extra", rating=4.0, stock=10),
        Product(name="Extra Boot C", price=60.00, category_id=boots.id,
                description="Extra", rating=4.0, stock=10),
        Product(name="Extra Boot D", price=65.00, category_id=boots.id,
                description="Extra", rating=4.0, stock=10),
        Product(name="Extra Boot E", price=70.00, category_id=boots.id,
                description="Extra", rating=4.0, stock=10),
        Product(name="Extra Boot F", price=75.00, category_id=boots.id,
                description="Extra", rating=4.0, stock=10),
        Product(name="Extra Boot G", price=80.00, category_id=boots.id,
                description="Extra", rating=4.0, stock=10),
    ])
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def test_search_returns_matching_products():
    resp = client.get("/api/products?q=air")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "AirStride Pro"


def test_search_is_case_insensitive():
    resp = client.get("/api/products?q=SPEED")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "SpeedForm Elite"


def test_category_filter_returns_only_that_category():
    cats = client.get("/api/categories").json()
    runners_id = next(c["id"] for c in cats if c["name"] == "Runners")

    resp = client.get(f"/api/products?category={runners_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert all(p["category_name"] == "Runners" for p in data["items"])


def test_out_of_stock_products_are_returned_and_flagged():
    resp = client.get("/api/products?q=TrailBlaze")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    item = data["items"][0]
    assert item["stock"] == 0
    assert item["stock_status"] == "out_of_stock"


def test_low_stock_flag():
    resp = client.get("/api/products?q=SpeedForm")
    assert resp.status_code == 200
    item = resp.json()["items"][0]
    assert item["stock"] == 3
    assert item["stock_status"] == "low_stock"


def test_in_stock_flag():
    resp = client.get("/api/products?q=AirStride")
    assert resp.status_code == 200
    item = resp.json()["items"][0]
    assert item["stock"] > 5
    assert item["stock_status"] == "in_stock"


def test_pagination_page1_has_12_items():
    resp = client.get("/api/products?page=1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 13
    assert len(data["items"]) == 12


def test_pagination_page2_has_remaining_items():
    resp = client.get("/api/products?page=2")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 13
    assert len(data["items"]) == 1


def test_sort_price_asc():
    resp = client.get("/api/products?sort=price_asc")
    assert resp.status_code == 200
    prices = [p["price"] for p in resp.json()["items"]]
    assert prices == sorted(prices)


def test_sort_price_desc():
    resp = client.get("/api/products?sort=price_desc")
    assert resp.status_code == 200
    prices = [p["price"] for p in resp.json()["items"]]
    assert prices == sorted(prices, reverse=True)


def test_price_range_filter():
    resp = client.get("/api/products?min_price=100&max_price=130")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert all(100 <= p["price"] <= 130 for p in items)


def test_categories_endpoint():
    resp = client.get("/api/categories")
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()]
    assert "Runners" in names
    assert "Boots" in names
