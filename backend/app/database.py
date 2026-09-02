from datetime import datetime
import json
import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
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
    role = Column(String, default="officer")  # controller, supervisor, officer
    full_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    badge_number = Column(String, nullable=True)
    jurisdiction = Column(String, nullable=True)
    designation = Column(String, nullable=True)


class StatutoryRule(Base):
    __tablename__ = "statutory_rules"
    id = Column(Integer, primary_key=True, index=True)
    rule_number = Column(Integer, unique=True, index=True)
    rule_id = Column(String, unique=True, index=True, nullable=False)  # e.g. Rule 6(1)(a)
    code = Column(String, index=True, nullable=False)  # e.g. PC-MFG-001
    field = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    year = Column(String, nullable=False)
    required = Column(Boolean, default=True)
    severity = Column(String, default="high")
    description = Column(Text, nullable=False)
    source = Column(String, nullable=False)
    applies_to = Column(String, default="all")

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
    rule_id = Column(String, nullable=False)  # PC-MRP-007, etc.
    status = Column(String, default="REVIEW")  # PASS, FAIL, REVIEW, NOT_APPLICABLE
    details = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)

    inspection = relationship("Inspection", back_populates="compliance_results")

from sqlalchemy import text

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # 1. Initialize FTS5 virtual table
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                CREATE VIRTUAL TABLE IF NOT EXISTS inspections_fts USING fts5(
                    inspection_id UNINDEXED,
                    product_name,
                    manufacturer,
                    category,
                    barcode,
                    location,
                    status,
                    notes,
                    ocr_text,
                    violations_summary
                );
            """))
            conn.commit()
        except Exception:
            pass

    # 2. Seed / Synchronize the 17 Statutory Rules
    rules_json_path = os.path.join(os.path.dirname(__file__), "rules", "rules_matrix.json")
    if os.path.exists(rules_json_path):
        db = SessionLocal()
        try:
            with open(rules_json_path, "r", encoding="utf-8") as f:
                rules_data = json.load(f)
                
            for r in rules_data:
                existing = db.query(StatutoryRule).filter(StatutoryRule.rule_id == r["rule_id"]).first()
                if not existing:
                    rule_record = StatutoryRule(
                        rule_number=r.get("rule_number"),
                        rule_id=r["rule_id"],
                        code=r["code"],
                        field=r["field"],
                        name=r["name"],
                        year=r["year"],
                        required=r.get("required", True),
                        severity=r.get("severity", "high"),
                        description=r["description"],
                        source=r["source"],
                        applies_to=r.get("applies_to", "all")
                    )
                    db.add(rule_record)
                else:
                    existing.rule_number = r.get("rule_number")
                    existing.code = r["code"]
                    existing.field = r["field"]
                    existing.name = r["name"]
                    existing.year = r["year"]
                    existing.required = r.get("required", True)
                    existing.severity = r.get("severity", "high")
                    existing.description = r["description"]
                    existing.source = r["source"]
                    existing.applies_to = r.get("applies_to", "all")
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[WARN] Error seeding statutory rules: {e}")
        finally:
            db.close()

def sync_inspection_fts(db: Session, inspection_id: int):
    """Synchronize an inspection and its OCR/compliance results into the FTS5 search index."""
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        return
    
    prod_name = (insp.product.name if insp.product else "") or ""
    manufacturer = (insp.product.manufacturer if insp.product else "") or ""
    category = (insp.product.category if insp.product else "") or ""
    barcode = (insp.product.barcode if insp.product else "") or ""
    location = insp.location or ""
    status_val = insp.status or ""
    notes = insp.notes or ""
    
    ocr_texts = []
    for img in insp.images:
        for ocr in img.ocr_results:
            if ocr.text:
                ocr_texts.append(ocr.text)
    ocr_combined = " ".join(ocr_texts)
    
    violations = []
    for r in insp.compliance_results:
        if r.status in ("FAIL", "REVIEW"):
            violations.append(f"{r.rule_id}: {r.details}")
    violations_summary = " | ".join(violations)
    
    try:
        db.execute(text("DELETE FROM inspections_fts WHERE inspection_id = :id"), {"id": inspection_id})
        db.execute(text("""
            INSERT INTO inspections_fts (
                inspection_id, product_name, manufacturer, category, barcode,
                location, status, notes, ocr_text, violations_summary
            ) VALUES (
                :inspection_id, :product_name, :manufacturer, :category, :barcode,
                :location, :status, :notes, :ocr_text, :violations_summary
            )
        """), {
            "inspection_id": inspection_id,
            "product_name": prod_name,
            "manufacturer": manufacturer,
            "category": category,
            "barcode": barcode,
            "location": location,
            "status": status_val,
            "notes": notes,
            "ocr_text": ocr_combined,
            "violations_summary": violations_summary
        })
        db.commit()
    except Exception:
        db.rollback()

