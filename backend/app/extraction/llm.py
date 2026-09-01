import os
import json
from typing import Dict, Any, List
from google import genai
from pydantic import BaseModel, Field

class FieldExtraction(BaseModel):
    value: str | None = Field(description="The cleaned extracted value (e.g. '₹240.00', '5 kg'). Null if missing.")
    original_text: str | None = Field(description="The exact raw text from the OCR input that corresponds to this field.")
    status: str = Field(description="One of: 'FOUND', 'MISSING', 'UNREADABLE'")

class LLM_LMPC_Result(BaseModel):
    mrp: FieldExtraction
    net_quantity: FieldExtraction
    packing_date: FieldExtraction
    best_before: FieldExtraction
    manufacturer: FieldExtraction
    country_of_origin: FieldExtraction
    generic_name: FieldExtraction
    unit_sale_price: FieldExtraction
    dimensions: FieldExtraction
    consumer_care: FieldExtraction
    unsupported_language_detected: bool = Field(description="True if non-English/Hindi scripts (like Kannada, Tamil, etc) are present")

from dotenv import load_dotenv

def parse_with_llm(ocr_text: str, avg_ocr_confidence: float) -> Dict[str, Any]:
    """
    Implements the PRD Phase 1 'Logic Tree for LLM Extraction'.
    """
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY not set. LLM extraction skipped.")
        return {}
        
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are an AI Legal Metrology Compliance Inspector.
    Extract the 10 statutory declarations from the following raw OCR text.
    
    Apply the following Logic Tree:
    1. If a declaration is clearly found, set status to 'FOUND' and extract the value.
    2. If a declaration is missing entirely, set status to 'MISSING'.
    3. If a declaration keyword exists but the value is garbled, corrupted, or unreadable due to bad OCR, set status to 'UNREADABLE'.
    4. If any non-English/Hindi scripts are detected, set unsupported_language_detected to true.
    
    RAW OCR TEXT:
    {ocr_text}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': LLM_LMPC_Result,
                'temperature': 0.1
            },
        )
        
        parsed = json.loads(response.text)
        
        # Adapt LLM format to the engine's expected dictionary format
        results = {}
        for field in ["mrp", "net_quantity", "packing_date", "best_before", "manufacturer", 
                      "country_of_origin", "generic_name", "unit_sale_price", "dimensions", "consumer_care"]:
            data = parsed.get(field, {})
            status = data.get("status", "MISSING")
            
            # Translate LLM statuses to confidence scores the engine understands
            # engine.py logic: confidence < 0.85 -> REVIEW, else pass/fail
            if status == "FOUND":
                conf = max(0.90, avg_ocr_confidence)
            elif status == "UNREADABLE":
                conf = 0.50 # Forces REVIEW flag in engine.py
            else:
                conf = 0.0 # Missing
                
            results[field] = {
                "value": data.get("value") or "",
                "confidence": conf,
                "original_text": data.get("original_text") or ""
            }
            
        results["unsupported_language_detected"] = parsed.get("unsupported_language_detected", False)
        return results
        
    except Exception as e:
        print(f"LLM Parsing Error: {e}")
        return {}
