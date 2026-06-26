"""
Run once to populate the database:
  python3 -m app.seed
from the backend/ directory.
"""

from .database import engine, SessionLocal
from .models import Base, Category, Product


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Category).count() > 0:
        print("Database already seeded — skipping.")
        db.close()
        return

    runners = Category(name="Runners")
    boots = Category(name="Boots")
    casuals = Category(name="Casuals")
    db.add_all([runners, boots, casuals])
    db.flush()

    products = [
        # Runners — mix of stock levels
        Product(
            name="AirStride Pro",
            price=119.99,
            category_id=runners.id,
            description="Lightweight daily trainer with responsive foam.",
            rating=4.7,
            stock=42,
            image_url=None,
        ),
        Product(
            name="SpeedForm Elite",
            price=89.99,
            category_id=runners.id,
            description="Tempo runner built for speed workouts.",
            rating=4.5,
            stock=3,  # low stock
            image_url=None,
        ),
        Product(
            name="CloudRun X",
            price=134.99,
            category_id=runners.id,
            description="Long-distance comfort with cloud cushioning.",
            rating=4.8,
            stock=18,
            image_url=None,
        ),
        Product(
            name="TrailBlaze 2",
            price=74.99,
            category_id=runners.id,
            description="Entry-level trail runner, grippy outsole.",
            rating=4.1,
            stock=0,  # out of stock
            image_url=None,
        ),
        # Boots — mix of stock levels
        Product(
            name="HikeCore GTX",
            price=159.99,
            category_id=boots.id,
            description="Waterproof hiking boot with ankle support.",
            rating=4.6,
            stock=11,
            image_url=None,
        ),
        Product(
            name="Urban Chelsea",
            price=109.99,
            category_id=boots.id,
            description="Sleek Chelsea boot for everyday wear.",
            rating=4.3,
            stock=5,  # low stock
            image_url=None,
        ),
        Product(
            name="WorkForce Steel Toe",
            price=139.99,
            category_id=boots.id,
            description="Safety-rated steel toe, slip-resistant.",
            rating=4.4,
            stock=0,  # out of stock
            image_url=None,
        ),
        Product(
            name="SnowPeak Insulated",
            price=179.99,
            category_id=boots.id,
            description="Insulated winter boot rated to -30°C.",
            rating=4.9,
            stock=7,
            image_url=None,
        ),
        # Casuals — mix of stock levels
        Product(
            name="Canvas Classic",
            price=44.99,
            category_id=casuals.id,
            description="Timeless canvas sneaker, 8 colour options.",
            rating=4.2,
            stock=60,
            image_url=None,
        ),
        Product(
            name="SlipOn Air",
            price=54.99,
            category_id=casuals.id,
            description="Sock-fit slip-on, zero break-in time.",
            rating=4.0,
            stock=2,  # low stock
            image_url=None,
        ),
        Product(
            name="Retro Court",
            price=79.99,
            category_id=casuals.id,
            description="Court-inspired silhouette, clean and minimal.",
            rating=4.6,
            stock=25,
            image_url=None,
        ),
        Product(
            name="SandDrift Mule",
            price=64.99,
            category_id=casuals.id,
            description="Easy-on mule with memory foam insole.",
            rating=3.9,
            stock=0,  # out of stock
            image_url=None,
        ),
    ]

    db.add_all(products)
    db.commit()
    db.close()
    print(f"Seeded {len(products)} products across 3 categories.")


if __name__ == "__main__":
    seed()
