from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# User Schemas
class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    name: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[str] = None
    barcode: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Image Schemas
class ProductImageBase(BaseModel):
    panel_side: str

class ProductImageResponse(ProductImageBase):
    id: int
    filename: str
    filepath: str
    uploaded_at: datetime
    class Config:
        from_attributes = True

# OCR Results
class OCRResultResponse(BaseModel):
    id: int
    text: str
    confidence: float
    bbox_x: int
    bbox_y: int
    bbox_w: int
    bbox_h: int
    class Config:
        from_attributes = True

# Declaration Schemas
class DeclarationBase(BaseModel):
    field_name: str
    value: Optional[str] = None
    status: str
    confidence: Optional[float] = None
    original_text: Optional[str] = None

class DeclarationUpdate(BaseModel):
    value: str
    status: str

class DeclarationResponse(DeclarationBase):
    id: int
    class Config:
        from_attributes = True

# Compliance Results
class ComplianceResultResponse(BaseModel):
    id: int
    rule_id: str
    status: str
    details: Optional[str] = None
    checked_at: datetime
    class Config:
        from_attributes = True

# Inspection Schemas
class InspectionBase(BaseModel):
    product_id: int
    location: Optional[str] = None
    notes: Optional[str] = None

class InspectionCreate(InspectionBase):
    pass

class InspectionResponse(BaseModel):
    id: int
    product_id: int
    officer_id: int
    timestamp: datetime
    status: str
    location: Optional[str]
    notes: Optional[str]
    product: ProductResponse
    images: List[ProductImageResponse] = []
    declarations: List[DeclarationResponse] = []
    compliance_results: List[ComplianceResultResponse] = []

    class Config:
        from_attributes = True
