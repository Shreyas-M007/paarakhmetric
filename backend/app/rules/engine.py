import json
import os
from typing import List, Dict

# Load rules matrix configuration
RULES_FILE = os.path.join(os.path.dirname(__file__), "rules_matrix.json")

def load_rules() -> list:
    if os.path.exists(RULES_FILE):
        with open(RULES_FILE, "r") as f:
            return json.load(f)
    return []

def evaluate_compliance(parsed_decls: dict) -> Dict[str, any]:
    """
    Evaluates parsed declarations against the rules matrix.
    Returns:
    {
        "overall_status": "COMPLIANT" | "NON_COMPLIANT" | "REQUIRES_REVIEW",
        "results": [RuleResultDict]
    }
    """
    rules = load_rules()
    evaluation_results = []
    
    overall_status = "COMPLIANT"
    
    for rule in rules:
        field = rule["field"]
        required = rule["required"]
        
        # Get parsed data for this field
        parsed_data = parsed_decls.get(field, {"value": "", "confidence": 0.0, "original_text": ""})
        value = parsed_data.get("value", "").strip()
        confidence = parsed_data.get("confidence", 0.0)
        
        status = "PASS"
        details = ""
        
        if not value:
            if required:
                # If confidence is low or we have no scan, we ask for review. 
                # If we scanned with high confidence but still found nothing, flag as potential violation.
                if confidence > 0.0 and confidence < 0.70:
                    status = "REVIEW"
                    details = f"Mandatory field '{field}' not detected. OCR confidence was low ({int(confidence*100)}%). Manual inspection required."
                else:
                    status = "FAIL"
                    details = f"Mandatory field '{field}' is missing from scanned packaging."
            else:
                status = "NOT_APPLICABLE"
                details = f"Optional field '{field}' is not present."
        else:
            # Field is present. Validate formats.
            if field == "mrp":
                # MRP should have numerical value
                nums = [c for c in value if c.isdigit()]
                if not nums:
                    status = "FAIL"
                    details = f"MRP value '{value}' does not contain valid price numbers."
                else:
                    status = "PASS"
                    details = f"MRP detected: {value} (validated)"
                    
            elif field == "net_quantity":
                # Validate standard unit endings
                val_lower = value.lower()
                valid_units = ["kg", "g", "gm", "gms", "ml", "l", "liter", "liters", "litres", "pcs", "units"]
                has_valid_unit = any(val_lower.endswith(unit) for unit in valid_units)
                if not has_valid_unit:
                    status = "FAIL"
                    details = f"Net quantity unit in '{value}' is non-standard under PCR Schedule II."
                else:
                    status = "PASS"
                    details = f"Net quantity detected: {value}"
                    
            elif field == "packing_date":
                # Valid dates (e.g. MM/YYYY or PKD strings)
                status = "PASS"
                details = f"Packing date detected: {value}"
                
            elif field == "consumer_care":
                if confidence < 0.60:
                    status = "REVIEW"
                    details = f"Consumer care contact found but OCR confidence is low ({int(confidence*100)}%). Verify: '{value}'"
                else:
                    status = "PASS"
                    details = f"Consumer care contact verified: {value}"
            else:
                status = "PASS"
                details = f"Field '{field}' present: {value}"
                
        # Propagate statuses to overall inspection health
        if status == "FAIL":
            overall_status = "NON_COMPLIANT"
        elif status == "REVIEW" and overall_status != "NON_COMPLIANT":
            overall_status = "REQUIRES_REVIEW"
            
        evaluation_results.append({
            "rule_id": rule["rule_id"],
            "field": field,
            "required": required,
            "status": status,
            "details": details
        })
        
    return {
        "overall_status": overall_status,
        "results": evaluation_results
    }
