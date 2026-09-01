import re
from typing import List, Dict, Any
from rapidfuzz import fuzz, process

# ---------------------------------------------------------------------------
# Space-tolerant Statutory Regex Patterns
# RapidOCR sometimes collapses whitespace (e.g. "MRPRs240").
# All patterns use \s* between every token to match both spaced and
# space-stripped OCR output. normalize_ocr_text() also inserts canonical
# spaces before common keyword boundaries as a first-pass fix.
# ---------------------------------------------------------------------------

# MRP – Rule 6(1)(e)
MRP_PATTERN = re.compile(
    r'(?:m\s*r\s*p|m\s*\.\s*r\s*\.\s*p\s*\.|retail\s*price|max\w*\s*retail\s*price)'
    r'\s*:?\s*(?:rs\.?|inr|rupees|₹)?\s*([\d.,]+)',
    re.IGNORECASE
)

# Net Quantity – Rule 6(1)(c)
QTY_PATTERN = re.compile(
    r'(?:net\s*qty|net\s*quantity|net\s*wt\.?|net\s*weight|net\s*vol(?:ume)?)'
    r'\s*:?\s*([\d.,]+)\s*(kg|g|gm|gms|ml|l\b|liter|litres|ltr|ltrs|pcs|units|u\b|m\b|cm|mm|n\b)',
    re.IGNORECASE
)

# Packing / Mfg Date – Rule 6(1)(d)
DATE_PATTERN = re.compile(
    r'(?:p\s*k\s*d|m\s*f\s*g|m\s*f\s*d|packed|mfg\s*date|packaging\s*date|date\s*of\s*pack(?:ing)?)'
    r'\s*:?\s*(\d{2}[/\-]\d{4}|\d{2}[/\-]\d{2}|[a-z]{3,9}\s*\d{4}|\d{4})',
    re.IGNORECASE
)

# Best Before – Rule 6(1)(da)
BEST_BEFORE_PATTERN = re.compile(
    r'(?:best\s*before|use\s*by|expiry|exp\s*\.?\s*date|exp\.?)\s*:?\s*([a-z0-9\s/.\-]{3,30})',
    re.IGNORECASE
)

# Country of Origin – Rule 6(1)(aa)
COO_PATTERN = re.compile(
    r'(?:country\s*of\s*origin|made\s*in|produced\s*in|assembled\s*in|origin)\s*:?\s*([a-zA-Z\s]{2,30})',
    re.IGNORECASE
)

# Unit Sale Price – Rule 6(11)
USP_PATTERN = re.compile(
    r'(?:unit\s*sale\s*price|u\s*s\s*p)\s*:?\s*(?:rs\.?|₹)?\s*([\d.,]+\s*/\s*(?:g|kg|ml|l|unit|piece|cm|m|n))',
    re.IGNORECASE
)

# Dimensions – Rule 6(1)(f)
DIMENSIONS_PATTERN = re.compile(
    r'(?:dimensions?|size|dim)\s*:?\s*(\d+[\d.,]*\s*(?:cm|mm|m|inch)\s*[xX×*]\s*\d+[\d.,]*\s*(?:cm|mm|m|inch)(?:\s*[xX×*]\s*\d+[\d.,]*\s*(?:cm|mm|m|inch))?)',
    re.IGNORECASE
)

# Consumer care
EMAIL_PATTERN = re.compile(r'[\w.\-]+@[\w.\-]+\.[a-zA-Z]{2,4}', re.IGNORECASE)

PHONE_PATTERN = re.compile(
    r'(?:1800[\s\-]*\d{3}[\s\-]*\d{3,4}|\d{4,5}[\-\s]\d{6,8}|\+91[\s\-]*\d{10}|\b\d{10}\b)',
    re.IGNORECASE
)

# ---------------------------------------------------------------------------
# OCR text normalizer: fixes space-collapsed output from RapidOCR
# e.g. "MRPRs240" -> "MRP Rs 240", "NETQUANTITY5Kg" -> "NET QUANTITY 5 Kg"
# ---------------------------------------------------------------------------
def normalize_ocr_text(text: str) -> str:
    """
    Insert spaces at letter→digit and digit→letter boundaries,
    and at known keyword boundaries to fix RapidOCR space-collapsed output.
    e.g. 'MRPRs240' -> 'MRP Rs 240', 'NETQUANTITY5Kg' -> 'NET QUANTITY 5 Kg'
    """
    # 1. Insert space before known keyword boundaries (case-insensitive)
    keyword_splits = [
        (r'(?i)(MRP)(Rs|INR|₹|\d)', r'\1 \2'),
        (r'(?i)(NET)(QTY|QUANTITY|WT|WEIGHT|VOL)', r'\1 \2'),
        (r'(?i)(PKD|MFG|MFD)([\d/])', r'\1 \2'),
        (r'(?i)(CARE|HELPLINE)(:)', r'\1\2'),
        (r'(?i)(MFD|MFG|PKD|PACKED)(BY)', r'\1 \2'),
        (r'(?i)(BEST)(BEFORE)', r'\1 \2'),
        (r'(?i)(COUNTRY)(OF)', r'\1 \2'),
        (r'(?i)(MADE)(IN)', r'\1 \2'),
        (r'(?i)(INCL|INCLUSIVE)(OF)', r'\1 \2'),
    ]
    for pattern, replacement in keyword_splits:
        text = re.sub(pattern, replacement, text)

    # 2. Insert space before digits that immediately follow letters: "Rs240" -> "Rs 240"
    text = re.sub(r'([a-zA-Z₹])(\d)', r'\1 \2', text)
    # 3. Insert space before letters that immediately follow digits: "5kg" -> "5 kg"
    text = re.sub(r'(\d)([a-zA-Z])', r'\1 \2', text)
    # 4. Collapse multiple spaces
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()



def parse_ocr_results(ocr_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Parses OCR text tokens into structured Legal Metrology statutory fields.
    Applies Levenshtein-distance fuzzy matching with RapidFuzz for noisy packaging text.
    """
    results = {
        "mrp": {"value": "", "confidence": 0.0, "original_text": ""},
        "net_quantity": {"value": "", "confidence": 0.0, "original_text": ""},
        "packing_date": {"value": "", "confidence": 0.0, "original_text": ""},
        "best_before": {"value": "", "confidence": 0.0, "original_text": ""},
        "consumer_care": {"value": "", "confidence": 0.0, "original_text": ""},
        "manufacturer": {"value": "", "confidence": 0.0, "original_text": ""},
        "country_of_origin": {"value": "", "confidence": 0.0, "original_text": ""},
        "generic_name": {"value": "", "confidence": 0.0, "original_text": ""},
        "unit_sale_price": {"value": "", "confidence": 0.0, "original_text": ""},
        "dimensions": {"value": "", "confidence": 0.0, "original_text": ""}
    }

    full_text_combined = " ".join([item.get("text", "") for item in ocr_items])

    for item in ocr_items:
        raw_text = item.get("text", "").strip()
        conf = float(item.get("confidence", 0.0))

        # Normalize: fix space-collapsed RapidOCR output before regex matching
        text = normalize_ocr_text(raw_text)
        text_lower = text.lower()

        # 1. MRP (Rule 6(1)(e))
        mrp_match = MRP_PATTERN.search(text)
        if mrp_match and conf > results["mrp"]["confidence"]:
            # Normalize noisy OCR: O -> 0
            price_clean = mrp_match.group(1).strip().replace("O", "0").replace("o", "0")
            results["mrp"] = {
                "value": f"₹{price_clean}",
                "confidence": conf,
                "original_text": raw_text
            }

        # 2. Net Quantity (Rule 6(1)(c))
        qty_match = QTY_PATTERN.search(text)
        if qty_match and conf > results["net_quantity"]["confidence"]:
            raw_val = qty_match.group(1).strip().replace("O", "0")

            unit_val = qty_match.group(2).strip().lower()
            results["net_quantity"] = {
                "value": f"{raw_val} {unit_val}",
                "confidence": conf,
                "original_text": raw_text
            }

        # 3. Date of Packing / Manufacture (Rule 6(1)(d))
        date_match = DATE_PATTERN.search(text)
        if date_match and conf > results["packing_date"]["confidence"]:
            results["packing_date"] = {
                "value": date_match.group(1).strip(),
                "confidence": conf,
                "original_text": raw_text
            }

        # 4. Best Before / Use By (Rule 6(1)(da))
        bb_match = BEST_BEFORE_PATTERN.search(text)
        if bb_match and conf > results["best_before"]["confidence"]:
            results["best_before"] = {
                "value": bb_match.group(0).strip(),
                "confidence": conf,
                "original_text": raw_text
            }

        # 5. Country of Origin (Rule 6(1)(aa))
        coo_match = COO_PATTERN.search(text)
        if coo_match and conf > results["country_of_origin"]["confidence"]:
            results["country_of_origin"] = {
                "value": coo_match.group(1).strip().title(),
                "confidence": conf,
                "original_text": raw_text
            }

        # 6. Unit Sale Price (Rule 6(1)(11))
        usp_match = USP_PATTERN.search(text)
        if usp_match and conf > results["unit_sale_price"]["confidence"]:
            results["unit_sale_price"] = {
                "value": f"₹{usp_match.group(1).strip()}",
                "confidence": conf,
                "original_text": raw_text
            }

        # 7. Dimensions (Rule 6(1)(f))
        dim_match = DIMENSIONS_PATTERN.search(text)
        if dim_match and conf > results["dimensions"]["confidence"]:
            results["dimensions"] = {
                "value": dim_match.group(1).strip(),
                "confidence": conf,
                "original_text": raw_text
            }

        # 8. Consumer Care Details (Rule 6(2))
        email_match = EMAIL_PATTERN.search(text)
        phone_match = PHONE_PATTERN.search(raw_text)  # use raw_text for phone — hyphens preserved
        if (email_match or phone_match or "care" in text_lower or "helpline" in text_lower) and conf > results["consumer_care"]["confidence"]:
            vals = []
            if phone_match:
                vals.append(phone_match.group(0))
            if email_match:
                vals.append(email_match.group(0))
            if not vals:
                vals.append(raw_text)
            results["consumer_care"] = {
                "value": ", ".join(vals),
                "confidence": conf,
                "original_text": raw_text
            }

    # Fuzzy Matching for Manufacturer / Packer (Rule 6(1)(a))
    mfg_keywords = ["mfd by", "manufactured by", "packed by", "marketed by", "imported by", "mfg. by", "pkd by", "packer"]
    best_mfg_line = None
    best_mfg_conf = 0.0

    for item in ocr_items:
        text = item.get("text", "")
        text_lower = text.lower()
        for kw in mfg_keywords:
            score = fuzz.partial_ratio(kw, text_lower)
            if score > 75 and item.get("confidence", 0.0) >= best_mfg_conf:
                best_mfg_line = text
                best_mfg_conf = float(item.get("confidence", 0.0))

    if best_mfg_line:
        results["manufacturer"] = {
            "value": best_mfg_line,
            "confidence": best_mfg_conf,
            "original_text": best_mfg_line
        }

    # Extract Generic Commodity Name (Rule 6(1)(b)) if first prominent headline
    if ocr_items and not results["generic_name"]["value"]:
        # Top prominent text is often generic identity or brand + generic
        first_line = ocr_items[0].get("text", "")
        if first_line and not any(k in first_line.lower() for k in ["mrp", "net", "pkd", "mfd", "care"]):
            results["generic_name"] = {
                "value": first_line,
                "confidence": float(ocr_items[0].get("confidence", 0.9)),
                "original_text": first_line
            }

    return results
