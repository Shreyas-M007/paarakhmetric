import re
from rapidfuzz import process, fuzz

# Regex definitions
MRP_PATTERN = re.compile(
    r'(?:mrp|m\.r\.p\.|retail\s*price|max[a-z]*\s*retail\s*price)\s*(?:rs\.?|inr|rupees|₹)?\s*([\d.,]+)', 
    re.IGNORECASE
)

QTY_PATTERN = re.compile(
    r'(?:net\s*qty|net\s*quantity|net\s*wt|net\s*weight|weight|qty)\s*:?\s*([\d.,]+)\s*(kg|g|gm|gms|ml|l|liter|litres|pcs|units|u)', 
    re.IGNORECASE
)

DATE_PATTERN = re.compile(
    r'(?:pkd|packed|mfg|mfd|date\s*of\s*pack(?:ing)?|mfg\s*date)\s*:?\s*(\d{2}[/\-]\d{4}|\d{2}[/\-]\d{2}|[a-z]{3,9}\s*\d{4}|\d{4})',
    re.IGNORECASE
)

EMAIL_PATTERN = re.compile(
    r'[\w\.\-]+@[\w\.\-]+\.[a-zA-Z]{2,4}',
    re.IGNORECASE
)

PHONE_PATTERN = re.compile(
    r'(?:1800\s*\d{3}\s*\d{4}|\d{3,5}[\-\s]\d{6,8}|\+91\s*\d{10})',
    re.IGNORECASE
)

def parse_ocr_results(ocr_items: list) -> dict:
    """
    Parses full OCR text lines to identify mandatory Legal Metrology fields.
    Returns structured results:
    {
        "mrp": {"value": str, "confidence": float, "original_text": str},
        "net_quantity": {"value": str, "confidence": float, "original_text": str},
        "packing_date": {"value": str, "confidence": float, "original_text": str},
        "consumer_care": {"value": str, "confidence": float, "original_text": str},
        "manufacturer": {"value": str, "confidence": float, "original_text": str}
    }
    """
    results = {
        "mrp": {"value": "", "confidence": 0.0, "original_text": ""},
        "net_quantity": {"value": "", "confidence": 0.0, "original_text": ""},
        "packing_date": {"value": "", "confidence": 0.0, "original_text": ""},
        "consumer_care": {"value": "", "confidence": 0.0, "original_text": ""},
        "manufacturer": {"value": "", "confidence": 0.0, "original_text": ""}
    }

    # Aggregate text for holistic search
    full_text_lines = [item["text"] for item in ocr_items]
    
    for item in ocr_items:
        text = item["text"]
        conf = item["confidence"]
        
        # 1. Check MRP
        mrp_match = MRP_PATTERN.search(text)
        if mrp_match and conf > results["mrp"]["confidence"]:
            val = f"₹{mrp_match.group(1).strip()}"
            results["mrp"] = {"value": val, "confidence": conf, "original_text": text}
            
        # 2. Check Net Quantity
        qty_match = QTY_PATTERN.search(text)
        if qty_match and conf > results["net_quantity"]["confidence"]:
            val = f"{qty_match.group(1).strip()} {qty_match.group(2).strip()}"
            results["net_quantity"] = {"value": val, "confidence": conf, "original_text": text}
            
        # 3. Check Date of Packing
        date_match = DATE_PATTERN.search(text)
        if date_match and conf > results["packing_date"]["confidence"]:
            results["packing_date"] = {"value": date_match.group(1).strip(), "confidence": conf, "original_text": text}

        # 4. Check Consumer Care Info
        email_match = EMAIL_PATTERN.search(text)
        phone_match = PHONE_PATTERN.search(text)
        if (email_match or phone_match) and conf > results["consumer_care"]["confidence"]:
            vals = []
            if phone_match:
                vals.append(phone_match.group(0))
            if email_match:
                vals.append(email_match.group(0))
            results["consumer_care"] = {"value": ", ".join(vals), "confidence": conf, "original_text": text}
            
    # Fuzzy Matching for manufacturer identifiers (e.g. Mfd by, Packed by, Importer)
    mfg_keywords = ["mfd by", "manufactured by", "packed by", "imported by", "mfg. by"]
    best_mfg_line = None
    best_mfg_conf = 0.0
    
    for item in ocr_items:
        text = item["text"].lower()
        # Find if any keyword is in text
        for kw in mfg_keywords:
            score = fuzz.partial_ratio(kw, text)
            if score > 80 and item["confidence"] > best_mfg_conf:
                best_mfg_line = item["text"]
                best_mfg_conf = item["confidence"]
                
    if best_mfg_line:
        results["manufacturer"] = {"value": best_mfg_line, "confidence": best_mfg_conf, "original_text": best_mfg_line}

    return results
