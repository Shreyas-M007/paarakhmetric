from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from app.config import settings

# Create engine & session factory
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# DB Session Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Model Definitions
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="officer")  # admin, supervisor, officer

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=True)
    manufacturer = Column(String, index=True, nullable=True)
    category = Column(String, index=True, nullable=True)
    barcode = Column(String, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    inspections = relationship("Inspection", back_populates="product")

class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="REQUIRES_REVIEW")  # COMPLIANT, NON_COMPLIANT, REQUIRES_REVIEW
    location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    product = relationship("Product", back_populates="inspections")
    images = relationship("ProductImage", back_populates="inspection")
    compliance_results = relationship("ComplianceResult", back_populates="inspection")
    declarations = relationship("Declaration", back_populates="inspection")

class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    panel_side = Column(String, nullable=False)  # front, back, side, top, bottom, close-up
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    inspection = relationship("Inspection", back_populates="images")
    ocr_results = relationship("OCRResult", back_populates="image")

class OCRResult(Base):
    __tablename__ = "ocr_results"
    id = Column(Integer, primary_key=True, index=True)
    product_image_id = Column(Integer, ForeignKey("product_images.id"), nullable=False)
    text = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    bbox_x = Column(Integer, nullable=False)
    bbox_y = Column(Integer, nullable=False)
    bbox_w = Column(Integer, nullable=False)
    bbox_h = Column(Integer, nullable=False)

    image = relationship("ProductImage", back_populates="ocr_results")

class Declaration(Base):
    __tablename__ = "declarations"
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    field_name = Column(String, nullable=False)  # mrp, net_quantity, mfg_date, consumer_care, manufacturer_details
    value = Column(String, nullable=True)
    status = Column(String, default="DETECTED")  # DETECTED, VALIDATED, POTENTIAL_VIOLATION, OFFICER_CONFIRMED
    confidence = Column(Float, nullable=True)
    original_text = Column(Text, nullable=True)

    inspection = relationship("Inspection", back_populates="declarations")

class ComplianceResult(Base):
    __tablename__ = "compliance_results"
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    rule_id = Column(String, nullable=False)  # PC-MRP-001, etc.
    status = Column(String, default="REVIEW")  # PASS, FAIL, REVIEW, NOT_APPLICABLE
    details = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)

    inspection = relationship("Inspection", back_populates="compliance_results")

def init_db():
    Base.metadata.create_all(bind=engine)
