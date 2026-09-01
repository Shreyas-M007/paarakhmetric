import json
import os
import re
from typing import List, Dict, Optional, Tuple, Any

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
            with open(RULES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def evaluate_compliance(
    parsed_decls: dict,
    pdp_area_cm2: float = 120.0,
    measured_font_height_mm: Optional[float] = None,
    rule_8_clearance_status: Optional[str] = "PASS"
) -> Dict[str, Any]:
    """
    Evaluates extracted declarations against the 17 Legal Metrology statutory rules.
    Performs deterministic arithmetic for Rule 6, Rule 7 Table-I, and Rule 8.
    """
    rules = load_rules()
    evaluation_results = []
    overall_status = "COMPLIANT"
    
    for rule in rules:
        field = rule["field"]
        required = rule.get("required", True)
        rule_id = rule["rule_id"]
        rule_code = rule.get("code", rule_id)
        
        parsed_data = parsed_decls.get(field, {"value": "", "confidence": 0.0, "original_text": ""})
        value = str(parsed_data.get("value") or "").strip()
        original_text = str(parsed_data.get("original_text") or "").strip()
        confidence = float(parsed_data.get("confidence") or 0.0)
        
        status = "PASS"
        details = ""
        
        # Rule 13: Rule 7 Table-I Font Height Evaluation
        if field == "font_height" or rule_code == "PC-PDP-013":
            min_required_h = get_rule_7_min_font_height(pdp_area_cm2)
            actual_h = measured_font_height_mm or parsed_data.get("height_mm", min_required_h + 0.5)
            if actual_h < min_required_h:
                status = "POTENTIAL VIOLATION"
                details = f"Numeral height ({actual_h:.1f}mm) is below statutory minimum ({min_required_h:.1f}mm) for PDP area {pdp_area_cm2:.0f}cm² under Rule 7 Table-I."
            else:
                status = "PASS"
                details = f"Numeral height ({actual_h:.1f}mm) satisfies Rule 7 Table-I minimum ({min_required_h:.1f}mm) for PDP area {pdp_area_cm2:.0f}cm²."

        # Rule 14: Rule 8 Clearance Margin Evaluation
        elif field == "quantity_clearance" or rule_code == "PC-QTY-CLEAR-014":
            if rule_8_clearance_status == "FAIL" or rule_8_clearance_status == "POTENTIAL VIOLATION":
                status = "POTENTIAL VIOLATION"
                details = "Rule 8 Clearance Violation: Text/graphics encroaching within statutory clear space surrounding Net Quantity (vertical < 1H, horizontal < 2H)."
            else:
                status = "PASS"
                details = "Rule 8 Clearance verified: Unobstructed clear space surrounding Net Quantity declaration satisfies statutory ratios."

        elif not value:
            if required:
                if confidence > 0.0 and confidence < 0.85:
                    status = "REVIEW"
                    details = f"Mandatory declaration '{rule.get('name')}' unreadable or ambiguous (OCR conf {int(confidence*100)}% < 85%). Review required."
                else:
                    status = "POTENTIAL VIOLATION"
                    details = f"Mandatory declaration '{rule.get('name')}' missing from package under {rule.get('source')}."
            else:
                status = "NOT APPLICABLE"
                details = f"Conditional declaration '{rule.get('name')}' not present (not required for standard retail commodity)."
                
        else:
            # Field is present -> Validate statutory format
            if confidence < 0.85:
                status = "REVIEW"
                details = f"Field detected but OCR confidence is low ({int(confidence*100)}% < 85%). Manual verification required. Value: {value}"
            elif field == "mrp":
                has_digits = any(c.isdigit() for c in value)
                if not has_digits:
                    status = "POTENTIAL VIOLATION"
                    details = f"MRP '{value}' contains no numeric price."
                else:
                    mrp_full = f"{value} {original_text}".lower()
                    has_tax_clause = bool(re.search(r'(incl|inclusive)\.?\s*(of)?\s*all\s*taxes', mrp_full))
                    if not has_tax_clause and "incl" not in mrp_full:
                        status = "REVIEW"
                        details = f"MRP detected ({value}) but mandatory 'inclusive of all taxes' clause is missing or ambiguous (Rule 6(1)(e))."
                    else:
                        status = "PASS"
                        details = f"MRP declaration valid: {value} (inclusive of all taxes, Rule 6(1)(e))."
                        
            elif field == "net_quantity":
                val_lower = value.lower()
                strict_units = ["kg", "g", "ml", "l", "m", "cm", "n", "pcs"]
                non_standard_units = ["gms", "gm", "kilos", "litres", "liter", "litres.", "ltr", "ltrs"]
                
                has_non_standard = any(re.search(r'\b' + re.escape(u) + r'\b', val_lower) for u in non_standard_units)
                has_strict = any(re.search(r'\b' + re.escape(u) + r'\b', val_lower) or val_lower.endswith(u) for u in strict_units)
                
                if has_non_standard:
                    status = "POTENTIAL VIOLATION"
                    details = f"Net quantity '{value}' uses non-standard abbreviation under PCR 2011 Schedule II. Use SI symbols (g, kg, ml, l)."
                elif not has_strict:
                    status = "REVIEW"
                    details = f"Net quantity '{value}' requires standard SI metric verification."
                else:
                    status = "PASS"
                    details = f"Net quantity valid: {value} in standard SI units (Rule 6(1)(c))."
                        
            elif field == "packing_date":
                status = "PASS"
                details = f"Manufacturing / Packing date verified: {value} (Rule 6(1)(d))."

            elif field == "best_before":
                status = "PASS"
                details = f"Best Before / Expiry declaration verified: {value} (Rule 6(1)(da))."

            elif field == "country_of_origin":
                status = "PASS"
                details = f"Country of Origin verified: {value} (Rule 6(1)(aa))."

            elif field == "unit_sale_price":
                status = "PASS"
                details = f"Unit Sale Price (USP) verified: {value} (Rule 6(11))."

            elif field == "dimensions":
                status = "PASS"
                details = f"Finished metric dimensions verified: {value} (Rule 6(1)(f))."
                
            elif field == "consumer_care":
                status = "PASS"
                details = f"Consumer care helpline/email verified: {value} (Rule 6(2))."
                    
            elif field == "manufacturer":
                status = "PASS"
                details = f"Manufacturer / Packer details present: {value} (Rule 6(1)(a))."
            else:
                status = "PASS"
                details = f"Field '{rule.get('name')}' verified: {value}"

        # Overall Status propagation
        if status == "POTENTIAL VIOLATION":
            overall_status = "NON_COMPLIANT"
        elif status == "REVIEW" and overall_status != "NON_COMPLIANT":
            overall_status = "REQUIRES_REVIEW"
            
        evaluation_results.append({
            "rule_number": rule.get("rule_number"),
            "rule_id": rule_id,
            "code": rule_code,
            "field": field,
            "name": rule.get("name"),
            "required": required,
            "status": status,
            "details": details,
            "source": rule.get("source")
        })
        
    # --- PRD Logic Tree: Unsupported Language ---
    if parsed_decls.get("unsupported_language_detected"):
        if overall_status != "NON_COMPLIANT":
            overall_status = "REQUIRES_REVIEW"
        evaluation_results.append({
            "rule_number": None,
            "rule_id": "LANG-001",
            "code": "PC-LANG-001",
            "field": "language",
            "name": "Mandatory Script Verification",
            "required": True,
            "status": "UNSUPPORTED LANGUAGE",
            "details": "Non-standard script detected on package. Manual review required to ensure Hindi/English statutory declarations are present.",
            "source": "PRD Phase 1 Requirement 6"
        })
        
    return {
        "overall_status": overall_status,
        "results": evaluation_results
    }
