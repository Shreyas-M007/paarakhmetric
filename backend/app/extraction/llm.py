import os
import json
import base64
import urllib.request
import urllib.error
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

def analyze_multimodal_package_images(images_base64: List[str], product_name: str = "", category: str = "") -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {
            "error": "GEMINI_API_KEY not configured on server backend environment variables.",
            "success": False
        }

    image_parts = []
    for img_str in images_base64:
        if not img_str:
            continue
        clean_b64 = img_str.split(",")[1] if "," in img_str else img_str
        mime_type = "image/jpeg"
        if img_str.startswith("data:image/png"):
            mime_type = "image/png"
        elif img_str.startswith("data:image/webp"):
            mime_type = "image/webp"

        image_parts.append({
            "inline_data": {
                "mime_type": mime_type,
                "data": clean_b64
            }
        })

    if not image_parts:
        return {"error": "No valid images received", "success": False}

    prompt = f"""You are an expert Legal Metrology (LMPC Act 2011 & Packaged Commodities Rules) inspector in India.
You are provided with {len(image_parts)} photo(s) of different panels/sides of the SAME packaged product (Front PDP, Back Label, Cap MRP/MFD, Bottom seal).

Product Hint: "{product_name or 'Packaged Commodity'}", Category: "{category or 'General FMCG'}"

Find and extract the exact statutory declarations from the package images:
1. mrp: The exact Maximum Retail Price printed on any package surface (e.g. "₹120.00", "Rs. 150.00 (Incl. of all taxes)"). Look across all panels, including caps, seals, lids, bottom bases, or back labels.
2. net_quantity: The exact Net Weight / Volume / Count with standard SI unit (e.g. "500 g", "1 kg", "200 ml", "1 L", "10 Units", "5 N").
3. packing_date: The exact Month & Year of packing / manufacture / import (e.g. "08/2026", "AUG 2026", "MFD: 07/2026", "PKD: 09/2026").
4. manufacturer: The exact corporate name and complete postal address of the manufacturer / packer / marketer.
5. consumer_care: The customer care phone number, toll-free number, or email address.

Return JSON ONLY with this schema:
{{
  "product_name": string,
  "category": string,
  "manufacturer": string,
  "overall_status": "COMPLIANT" | "NON_COMPLIANT" | "REQUIRES_REVIEW",
  "declarations": [
    {{ "field_name": "mrp", "value": string, "status": "VALIDATED" | "POTENTIAL_VIOLATION" | "MISSING", "confidence": number, "original_text": string }},
    {{ "field_name": "net_quantity", "value": string, "status": "VALIDATED" | "POTENTIAL_VIOLATION" | "MISSING", "confidence": number, "original_text": string }},
    {{ "field_name": "packing_date", "value": string, "status": "VALIDATED" | "POTENTIAL_VIOLATION" | "MISSING", "confidence": number, "original_text": string }},
    {{ "field_name": "manufacturer", "value": string, "status": "VALIDATED" | "POTENTIAL_VIOLATION" | "MISSING", "confidence": number, "original_text": string }},
    {{ "field_name": "consumer_care", "value": string, "status": "VALIDATED" | "POTENTIAL_VIOLATION" | "MISSING", "confidence": number, "original_text": string }}
  ],
  "compliance_results": [
    {{ "rule_id": "PC-MRP-001", "field": "mrp", "status": "PASS" | "FAIL", "details": string }},
    {{ "rule_id": "PC-QTY-002", "field": "net_quantity", "status": "PASS" | "FAIL", "details": string }},
    {{ "rule_id": "PC-DATE-003", "field": "packing_date", "status": "PASS" | "FAIL", "details": string }},
    {{ "rule_id": "PC-MFG-004", "field": "manufacturer", "status": "PASS" | "FAIL", "details": string }},
    {{ "rule_id": "PC-CARE-005", "field": "consumer_care", "status": "PASS" | "FAIL", "details": string }}
  ]
}}"""

    models = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.6-flash"]
    last_err = None




    for model in models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}] + image_parts
                }],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.1
                }
            }
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"})
            
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status == 200:
                    resp_body = resp.read().decode("utf-8")
                    data = json.loads(resp_body)
                    raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if raw_text:
                        parsed = json.loads(raw_text)
                        parsed["success"] = True
                        return parsed
        except Exception as e:
            last_err = str(e)
            print(f"Backend Gemini error on {model}: {e}")

    return {
        "error": f"Failed to execute Vision AI: {last_err}",
        "success": False
    }


def parse_with_llm(ocr_text: str, avg_ocr_confidence: float) -> Dict[str, Any]:
    """
    Parses single OCR text tokens using Gemini LLM if API key is set.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {}

    prompt = f"""You are an AI Legal Metrology Compliance Inspector.
Extract the statutory declarations from this raw OCR text:
{ocr_text}

Return JSON with keys: mrp, net_quantity, packing_date, best_before, manufacturer, country_of_origin, generic_name, unit_sale_price, dimensions, consumer_care.
Each field should have: value (string), status ('FOUND' | 'MISSING' | 'UNREADABLE'), original_text (string)."""

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json", "temperature": 0.1}
        }
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                parsed = json.loads(raw_text)
                results = {}
                for field in ["mrp", "net_quantity", "packing_date", "best_before", "manufacturer", 
                              "country_of_origin", "generic_name", "unit_sale_price", "dimensions", "consumer_care"]:
                    item = parsed.get(field, {})
                    status = item.get("status", "MISSING")
                    conf = 0.95 if status == "FOUND" else (0.50 if status == "UNREADABLE" else 0.0)
                    results[field] = {
                        "value": item.get("value") or "",
                        "confidence": conf,
                        "original_text": item.get("original_text") or ""
                    }
                return results
    except Exception as e:
        print(f"parse_with_llm error: {e}")
    return {}


def parse_with_vision_llm(image_path: str, fallback_ocr_text: str = "") -> Dict[str, Any]:
    """
    Vision LLM extraction helper for single image paths.
    """
    if not os.path.exists(image_path):
        return {}
    try:
        with open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        res = analyze_multimodal_package_images([b64])
        if res.get("success"):
            decls = {d["field_name"]: {"value": d["value"], "confidence": d["confidence"], "original_text": d.get("original_text", "")} for d in res.get("declarations", [])}
            return decls
    except Exception as e:
        print(f"parse_with_vision_llm error: {e}")
    return {}

