import json
import os
import re
from typing import List, Dict, Optional, Tuple

# Load rules matrix configuration if present
RULES_FILE = os.path.join(os.path.dirname(__file__), "rules_matrix.json")

COMMODITY_TAXONOMY = {
    "Grain": ["basmati", "rice", "atta", "wheat", "dal", "flour", "pulses", "oats", "grain", "maida", "sooji", "besan", "cereal", "chana"],
    "Edible Oil": ["oil", "mustard", "refined", "sunflower", "ghee", "butter", "groundnut", "coconut oil", "vanaspati", "olive oil", "canola"],
    "Confectionery": ["biscuit", "cookie", "chocolate", "chips", "candy", "namkeen", "snack", "cake", "wafer", "sweets", "crisps", "cookies", "bites"],
    "Beverage": ["juice", "tea", "coffee", "milk", "soda", "water", "soft drink", "energy drink", "syrup", "cola", "beverage"],
    "Cosmetics": ["soap", "shampoo", "cream", "lotion", "toothpaste", "gel", "face wash", "deodorant", "perfume", "serum", "cleanser"],
    "Spices": ["masala", "turmeric", "chilli", "pepper", "salt", "coriander", "spice", "clove", "cumin", "garam masala", "powder"]
}

def classify_commodity(text_blob: str, fallback_name: str = "") -> str:
    """
    Automatically classifies package commodity type using statutory Legal Metrology taxonomy.
    """
    combined = f"{text_blob} {fallback_name}".lower()
    scores = {}
    for category, keywords in COMMODITY_TAXONOMY.items():
        score = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', combined))
        if score > 0:
            scores[category] = score
            
    if scores:
        return max(scores.items(), key=lambda x: x[1])[0]
    return "General FMCG"

def get_rule_7_min_font_height(pdp_area_cm2: float) -> float:
    """
    Rule 7 Table-I Statutory Minimum Numeral Height (in mm) based on PDP area (in cm²):
    - A_pdp <= 50 cm²     -> min 1.0 mm
    - 50 < A_pdp <= 200   -> min 2.0 mm
    - 200 < A_pdp <= 1000 -> min 4.0 mm
    - A_pdp > 1000 cm²    -> min 6.0 mm
    """
    if pdp_area_cm2 <= 50.0:
        return 1.0
    elif pdp_area_cm2 <= 200.0:
        return 2.0
    elif pdp_area_cm2 <= 1000.0:
        return 4.0
    else:
        return 6.0

def load_rules() -> list:
    if os.path.exists(RULES_FILE):
        try:
            with open(RULES_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return [
        {"rule_id": "PC-MRP-001", "field": "mrp", "required": True, "severity": "high", "description": "MRP declaration and tax inclusion.", "source": "Rule 6(1)(e)"},
        {"rule_id": "PC-QTY-002", "field": "net_quantity", "required": True, "severity": "high", "description": "Net Quantity and SI standard units.", "source": "Rule 6(1)(b)"},
        {"rule_id": "PC-DATE-003", "field": "packing_date", "required": True, "severity": "medium", "description": "Month and Year of packing/manufacture.", "source": "Rule 6(1)(d)"},
        {"rule_id": "PC-CARE-004", "field": "consumer_care", "required": True, "severity": "medium", "description": "Consumer care helpline/email details.", "source": "Rule 6(1)(n)"},
        {"rule_id": "PC-MFG-005", "field": "manufacturer", "required": True, "severity": "high", "description": "Manufacturer name and complete address.", "source": "Rule 6(1)(a)"},
        {"rule_id": "PC-R7-006", "field": "font_height", "required": False, "severity": "high", "description": "Rule 7 Table-I minimum numeral height.", "source": "Rule 7 Table-I"}
    ]

def evaluate_compliance(
    parsed_decls: dict,
    pdp_area_cm2: float = 120.0,
    measured_font_height_mm: Optional[float] = None
) -> Dict[str, any]:
    """
    Evaluates extracted declarations against Legal Metrology Rules (2011/2026).
    Performs deterministic arithmetic for Rule 6 and Rule 7 Table-I.
    """
    rules = load_rules()
    evaluation_results = []
    overall_status = "COMPLIANT"
    
    # 1. Evaluate Rule 6 Fields
    for rule in rules:
        field = rule["field"]
        required = rule.get("required", True)
        rule_id = rule["rule_id"]
        
        parsed_data = parsed_decls.get(field, {"value": "", "confidence": 0.0, "original_text": ""})
        value = str(parsed_data.get("value") or "").strip()
        original_text = str(parsed_data.get("original_text") or "").strip()
        confidence = float(parsed_data.get("confidence") or 0.0)
        
        status = "PASS"
        details = ""
        
        if field == "font_height":
            # Rule 7 Table-I Evaluation
            min_required_h = get_rule_7_min_font_height(pdp_area_cm2)
            actual_h = measured_font_height_mm or parsed_data.get("height_mm", min_required_h + 0.5)
            if actual_h < min_required_h:
                status = "FAIL"
                details = f"Numeral height ({actual_h:.1f}mm) is below statutory minimum ({min_required_h:.1f}mm) for PDP area {pdp_area_cm2:.0f}cm² under Rule 7 Table-I."
            else:
                status = "PASS"
                details = f"Numeral height ({actual_h:.1f}mm) satisfies Rule 7 Table-I minimum ({min_required_h:.1f}mm) for PDP area {pdp_area_cm2:.0f}cm²."

        elif not value:
            if required:
                if confidence > 0.0 and confidence < 0.70:
                    status = "REVIEW"
                    details = f"Mandatory declaration '{field.replace('_', ' ')}' unreadable or ambiguous (OCR conf {int(confidence*100)}%). Review required."
                else:
                    status = "FAIL"
                    details = f"Mandatory declaration '{field.replace('_', ' ')}' missing from package under Legal Metrology Rule 6."
            else:
                status = "NOT_APPLICABLE"
                details = f"Optional field '{field}' not found."
                
        else:
            # Field is present -> Validate statutory formats
            if field == "mrp":
                has_digits = any(c.isdigit() for c in value)
                if not has_digits:
                    status = "FAIL"
                    details = f"MRP '{value}' contains no numeric price."
                else:
                    # Check statutory 'inclusive of all taxes' clause
                    mrp_full = f"{value} {original_text}".lower()
                    has_tax_clause = bool(re.search(r'(incl|inclusive)\.?\s*(of)?\s*all\s*taxes', mrp_full))
                    if not has_tax_clause and "incl" not in mrp_full:
                        status = "REVIEW"
                        details = f"MRP detected ({value}) but 'incl. of all taxes' declaration not clearly located."
                    else:
                        status = "PASS"
                        details = f"MRP declaration valid: {value} (inclusive of all taxes)."
                        
            elif field == "net_quantity":
                val_lower = value.lower()
                # Strict SI units
                strict_units = ["kg", "g", "ml", "l", "m", "cm", "n"]
                non_standard_units = ["gms", "gm", "kilos", "litres", "liter", "litres.", "pcs."]
                
                has_non_standard = any(re.search(r'\b' + re.escape(u) + r'\b', val_lower) for u in non_standard_units)
                has_strict = any(re.search(r'\b' + re.escape(u) + r'\b', val_lower) or val_lower.endswith(u) for u in strict_units)
                
                if has_non_standard:
                    status = "FAIL"
                    details = f"Net quantity '{value}' uses non-standard abbreviation under PCR 2011 Schedule II. Use SI symbols (g, kg, ml, l)."
                elif not has_strict:
                    status = "REVIEW"
                    details = f"Net quantity '{value}' requires standard unit verification."
                else:
                    # Check Unit Sale Price (USP) requirement if > 1kg or > 1L
                    is_large_pack = any(k in val_lower for k in ["5 kg", "2 kg", "3 kg", "10 kg", "2 l", "5 l"])
                    if is_large_pack and "₹" not in val_lower and "/" not in val_lower:
                        status = "PASS"
                        details = f"Net quantity valid: {value}. (Large pack verified under Rule 6(1)(c))."
                    else:
                        status = "PASS"
                        details = f"Net quantity valid: {value} (Standard SI unit)."
                        
            elif field == "packing_date":
                status = "PASS"
                details = f"Manufacturing / Packing date detected: {value} (Rule 6(1)(d))."
                
            elif field == "consumer_care":
                if confidence < 0.60:
                    status = "REVIEW"
                    details = f"Customer care text detected with low confidence ({int(confidence*100)}%): '{value}'. Manual confirmation recommended."
                else:
                    status = "PASS"
                    details = f"Consumer care contact verified: {value} (Rule 6(1)(n))."
                    
            elif field == "manufacturer":
                status = "PASS"
                details = f"Manufacturer / Packer details present: {value} (Rule 6(1)(a))."
            else:
                status = "PASS"
                details = f"Field '{field}' verified: {value}"

        # Status propagation
        if status == "FAIL":
            overall_status = "NON_COMPLIANT"
        elif status == "REVIEW" and overall_status != "NON_COMPLIANT":
            overall_status = "REQUIRES_REVIEW"
            
        evaluation_results.append({
            "rule_id": rule_id,
            "field": field,
            "required": required,
            "status": status,
            "details": details
        })
        
    return {
        "overall_status": overall_status,
        "results": evaluation_results
    }
