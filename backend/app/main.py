from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
import shutil

from app.database import init_db, get_db, SessionLocal, User, Product, Inspection, ProductImage, Declaration, ComplianceResult, OCRResult
from app.schemas import UserResponse, UserCreate, ProductResponse, ProductCreate, InspectionResponse, InspectionCreate

# Pipeline imports
from app.pipeline.quality import analyze_image_quality
from app.pipeline.preprocess import correct_skew, apply_contrast_enhancement
from app.pipeline.ocr_engine import perform_ocr
from app.extraction.parser import parse_ocr_results
from app.rules.engine import evaluate_compliance
from app.pipeline.pdf_report import generate_pdf_report

app = FastAPI(title="PaarakhMetric Backend", version="1.0")

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
def on_startup():
    init_db()
    db = SessionLocal()
    try:
        # Create default officer user if it doesn't exist
        default_user = db.query(User).filter(User.username == "officer_shrey").first()
        if not default_user:
            default_officer = User(username="officer_shrey", hashed_password="password123", role="officer")
            db.add(default_officer)
            db.commit()
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to PaarakhMetric API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "PaarakhMetric Backend"}

# --- User Routes ---
@app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = User(username=user.username, hashed_password=user.password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.post("/auth/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        User.username == user.username,
        User.hashed_password == user.password
    ).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    return {"message": "Login successful", "username": db_user.username, "role": db_user.role}

# --- Product Routes ---
@app.post("/products", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_prod = Product(
        name=product.name,
        manufacturer=product.manufacturer,
        category=product.category,
        barcode=product.barcode
    )
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    return db_prod

@app.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

# --- Inspection Routes ---
@app.post("/inspections", response_model=InspectionResponse)
def create_inspection(inspection: InspectionCreate, db: Session = Depends(get_db)):
    default_officer = db.query(User).first()
    if not default_officer:
        default_officer = User(username="officer_default", hashed_password="password", role="officer")
        db.add(default_officer)
        db.commit()
        db.refresh(default_officer)

    db_inspection = Inspection(
        product_id=inspection.product_id,
        officer_id=default_officer.id,
        location=inspection.location,
        notes=inspection.notes,
        status="REQUIRES_REVIEW"
    )
    db.add(db_inspection)
    db.commit()
    db.refresh(db_inspection)
    return db_inspection

@app.get("/inspections", response_model=List[InspectionResponse])
def get_inspections(db: Session = Depends(get_db)):
    return db.query(Inspection).all()

@app.get("/inspections/{inspection_id}", response_model=InspectionResponse)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    db_inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not db_inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return db_inspection

# --- Image Upload & E2E Process Pipeline ---
@app.post("/inspections/{inspection_id}/upload-image")
async def upload_image(
    inspection_id: int,
    panel_side: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Verify inspection exists
    db_inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not db_inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # 1. Save uploaded file
    filename = f"{inspection_id}_{panel_side}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Save Image details in database
    db_image = ProductImage(
        inspection_id=inspection_id,
        filename=filename,
        filepath=filepath,
        panel_side=panel_side
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    
    # 2. Run Image Quality Assessment
    quality_metrics = analyze_image_quality(filepath)
    if not quality_metrics.get("is_acceptable", True):
        # We still register the image, but warning response is returned
        return {
            "status": "REVIEW",
            "message": "Image quality check failed. Warnings triggered.",
            "quality": quality_metrics,
            "image_id": db_image.id
        }

    # 3. OpenCV Preprocessing (Correct skew & rotation)
    try:
        corrected_img = correct_skew(filepath)
        # Apply contrast enhancement for clarity
        enhanced_img = apply_contrast_enhancement(corrected_img)
        # Save processed image over original (or separate cache)
        shutil.copyfile(filepath, filepath + ".original.jpg")
        import cv2
        cv2.imwrite(filepath, enhanced_img)
    except Exception as e:
        # Gracefully log and proceed if OpenCV preprocess fails
        pass

    # 4. Execute PaddleOCR
    ocr_raw = perform_ocr(filepath)
    
    # Save OCR words/bboxes into DB for audit
    for item in ocr_raw:
        db_ocr = OCRResult(
            product_image_id=db_image.id,
            text=item["text"],
            confidence=item["confidence"],
            bbox_x=item["bounding_box"]["x"],
            bbox_y=item["bounding_box"]["y"],
            bbox_w=item["bounding_box"]["width"],
            bbox_h=item["bounding_box"]["height"]
        )
        db.add(db_ocr)
    db.commit()

    # 5. Extract fields (MRP, Net Qty, Dates)
    parsed_decls = parse_ocr_results(ocr_raw)
    
    # Save or update parsed declarations
    for field_name, decl in parsed_decls.items():
        # Check if already exists for this inspection
        existing = db.query(Declaration).filter(
            Declaration.inspection_id == inspection_id,
            Declaration.field_name == field_name
        ).first()
        
        if existing:
            existing.value = decl["value"]
            existing.status = decl["status"]
            existing.confidence = decl["confidence"]
            existing.original_text = decl["original_text"]
        else:
            db_decl = Declaration(
                inspection_id=inspection_id,
                field_name=field_name,
                value=decl["value"],
                status=decl["status"],
                confidence=decl["confidence"],
                original_text=decl["original_text"]
            )
            db.add(db_decl)
    db.commit()

    # 6. Execute Legal Metrology Rule Engine
    rule_outputs = evaluate_compliance(parsed_decls)
    
    # Save or update compliance results
    for rule_res in rule_outputs["results"]:
        existing_res = db.query(ComplianceResult).filter(
            ComplianceResult.inspection_id == inspection_id,
            ComplianceResult.rule_id == rule_res["rule_id"]
        ).first()
        
        if existing_res:
            existing_res.status = rule_res["status"]
            existing_res.details = rule_res["details"]
        else:
            db_rule_res = ComplianceResult(
                inspection_id=inspection_id,
                rule_id=rule_res["rule_id"],
                status=rule_res["status"],
                details=rule_res["details"]
            )
            db.add(db_rule_res)
            
    # Update Inspection health overall status
    db_inspection.status = rule_outputs["overall_status"]
    db.commit()
    
    return {
        "status": rule_outputs["overall_status"],
        "message": "Image processed. OCR & compliance checks succeeded.",
        "quality": quality_metrics,
        "declarations": parsed_decls,
        "rules_results": rule_outputs["results"]
    }

@app.get("/inspections/{inspection_id}/pdf-report")
def get_pdf_report(inspection_id: int, db: Session = Depends(get_db)):
    db_inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not db_inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
        
    # Serialize data for PDF engine
    product_data = {
        "name": db_inspection.product.name or "N/A",
        "manufacturer": db_inspection.product.manufacturer or "N/A",
        "category": db_inspection.product.category or "N/A",
        "barcode": db_inspection.product.barcode or "N/A"
    }
    
    decls_data = []
    for d in db_inspection.declarations:
        decls_data.append({
            "field_name": d.field_name,
            "value": d.value or "",
            "confidence": d.confidence or 0.0,
            "status": d.status
        })
        
    rules_data = []
    for r in db_inspection.compliance_results:
        rules_data.append({
            "rule_id": r.rule_id,
            "status": r.status,
            "details": r.details or ""
        })
        
    pdf_payload = {
        "id": db_inspection.id,
        "timestamp": db_inspection.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "status": db_inspection.status,
        "officer": "Officer Shrey",  # Default for MVP
        "location": db_inspection.location or "N/A",
        "notes": db_inspection.notes or "",
        "product": product_data,
        "declarations": decls_data,
        "compliance_results": rules_data
    }
    
    output_dir = "./reports"
    os.makedirs(output_dir, exist_ok=True)
    pdf_path = os.path.join(output_dir, f"report_{inspection_id}.pdf")
    
    try:
        generate_pdf_report(pdf_payload, pdf_path)
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {err}")
        
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"PaarakhMetric_Report_{inspection_id}.pdf")
