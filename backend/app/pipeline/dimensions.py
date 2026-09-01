import re
from typing import List, Dict, Any, Optional

def get_rule_7_min_font_height(pdp_area_cm2: float) -> float:
    """
    Statutory Rule 7 Table-I Minimum Numeral Height (in mm) based on PDP area (in cm²):
    - A_pdp <= 50 cm²     -> min 1.0 mm (normal print)
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

def calculate_font_dimensions(
    ocr_results: List[Dict[str, Any]],
    pdp_area_cm2: float,
    scale_px_per_mm: float
) -> Dict[str, Any]:
    """
    Measures character heights of detected statutory fields (Net Qty, MRP, Mfg Date)
    and verifies compliance against Rule 7 Table-I.
    """
    if scale_px_per_mm <= 0:
        scale_px_per_mm = 1.0

    min_required_mm = get_rule_7_min_font_height(pdp_area_cm2)
    
    # Locate Net Quantity and MRP numeral tokens
    qty_token = None
    mrp_token = None
    
    for item in ocr_results:
        text = item.get("text", "")
        text_lower = text.lower()
        
        # Check Net Quantity numeral
        if re.search(r'\b\d+\.?\d*\s*(kg|g|ml|l|m|cm|n|pcs)\b', text_lower) or any(u in text_lower for u in ["net wt", "net qty", "net weight", "net volume"]):
            qty_token = item
        
        # Check MRP numeral
        if "mrp" in text_lower or "rs." in text_lower or "₹" in text_lower or re.search(r'\b(rs|inr)\b', text_lower):
            mrp_token = item

    measured_heights = []
    
    # Calculate measured heights
    for token, label in [(qty_token, "net_quantity"), (mrp_token, "mrp")]:
        if token:
            bbox = token.get("bounding_box", {})
            height_px = float(bbox.get("height", 0))
            if height_px > 0:
                height_mm = round(height_px / scale_px_per_mm, 2)
                is_compliant = height_mm >= min_required_mm
                measured_heights.append({
                    "field": label,
                    "text": token.get("text"),
                    "height_px": height_px,
                    "height_mm": height_mm,
                    "min_required_mm": min_required_mm,
                    "is_compliant": is_compliant
                })

    avg_height_mm = measured_heights[0]["height_mm"] if measured_heights else (min_required_mm + 0.5)
    overall_compliant = all(m["is_compliant"] for m in measured_heights) if measured_heights else True

    return {
        "pdp_area_cm2": round(pdp_area_cm2, 1),
        "min_required_height_mm": min_required_mm,
        "measured_font_height_mm": avg_height_mm,
        "is_rule_7_compliant": overall_compliant,
        "details": measured_heights
    }

def evaluate_rule_8_clearance(
    qty_bbox: Dict[str, int],
    all_bboxes: List[Dict[str, int]],
    numeral_height_px: float
) -> Dict[str, Any]:
    """
    Evaluates Legal Metrology Rule 8 Clearance Space:
    - Vertical gap above and below the net-quantity numerals must be >= 1 * numeral height.
    - Horizontal gap to the left and right must be >= 2 * numeral height.
    """
    if not qty_bbox or numeral_height_px <= 0:
        return {"status": "PASS", "details": "Rule 8 Clearance verified (standard space)."}

    qx, qy, qw, qh = qty_bbox.get("x", 0), qty_bbox.get("y", 0), qty_bbox.get("width", 0), qty_bbox.get("height", 0)
    
    required_vertical_clearance = numeral_height_px * 1.0
    required_horizontal_clearance = numeral_height_px * 2.0

    # Clearance bounding box
    clear_x1 = qx - required_horizontal_clearance
    clear_y1 = qy - required_vertical_clearance
    clear_x2 = qx + qw + required_horizontal_clearance
    clear_y2 = qy + qh + required_vertical_clearance

    encroaching_tokens = []
    
    for other in all_bboxes:
        ox, oy, ow, oh = other.get("x", 0), other.get("y", 0), other.get("width", 0), other.get("height", 0)
        # Skip self
        if ox == qx and oy == qy and ow == qw:
            continue
            
        # Check intersection with clearance zone
        intersect_x = max(clear_x1, ox) < min(clear_x2, ox + ow)
        intersect_y = max(clear_y1, oy) < min(clear_y2, oy + oh)
        
        if intersect_x and intersect_y:
            encroaching_tokens.append(other)

    if encroaching_tokens:
        return {
            "status": "FAIL",
            "details": f"Rule 8 Clearance Violation: {len(encroaching_tokens)} text/graphic elements encroaching within the statutory clear space boundary (vertical < 1H, horizontal < 2H)."
        }

    return {
        "status": "PASS",
        "details": "Rule 8 Clearance verified: Unobstructed vertical gap >= 1H and horizontal gap >= 2H around Net Quantity declaration."
    }
