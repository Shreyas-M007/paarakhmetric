import pytest
from app.extraction.parser import parse_ocr_results
from app.rules.engine import evaluate_compliance

def test_extraction_mrp():
    # Test valid MRP extraction
    ocr_data = [
        {"text": "M.R.P. Rs. 250.00", "confidence": 0.98, "bounding_box": {"x": 0, "y": 0, "width": 10, "height": 10}}
    ]
    parsed = parse_ocr_results(ocr_data)
    assert parsed["mrp"]["value"] == "₹250.00"
    assert parsed["mrp"]["confidence"] == 0.98

def test_extraction_qty():
    # Test Net Quantity units
    ocr_data = [
        {"text": "NET QUANTITY 5 kg", "confidence": 0.95, "bounding_box": {"x": 0, "y": 0, "width": 10, "height": 10}}
    ]
    parsed = parse_ocr_results(ocr_data)
    assert parsed["net_quantity"]["value"] == "5 kg"

def test_compliance_engine_pass():
    # Compliant package
    parsed = {
        "mrp": {"value": "₹250.00", "confidence": 0.98, "original_text": "MRP Rs 250"},
        "net_quantity": {"value": "5 kg", "confidence": 0.95, "original_text": "NET QTY 5kg"},
        "packing_date": {"value": "08/2026", "confidence": 0.90, "original_text": "PKD 08/2026"},
        "consumer_care": {"value": "1800111222", "confidence": 0.91, "original_text": "Care: 1800111222"},
        "manufacturer": {"value": "Mfd by India Foods Ltd", "confidence": 0.92, "original_text": "Mfd by India Foods Ltd"}
    }
    evaluation = evaluate_compliance(parsed)
    assert evaluation["overall_status"] == "COMPLIANT"
    
    # Verify individual rules are PASS
    for res in evaluation["results"]:
        assert res["status"] == "PASS"

def test_compliance_engine_fail():
    # Missing MRP
    parsed = {
        "mrp": {"value": "", "confidence": 0.0, "original_text": ""},
        "net_quantity": {"value": "5 kg", "confidence": 0.95, "original_text": "NET QTY 5kg"},
        "packing_date": {"value": "08/2026", "confidence": 0.90, "original_text": "PKD 08/2026"},
        "consumer_care": {"value": "1800111222", "confidence": 0.91, "original_text": "Care: 1800111222"},
        "manufacturer": {"value": "Mfd by India Foods Ltd", "confidence": 0.92, "original_text": "Mfd by India Foods Ltd"}
    }
    evaluation = evaluate_compliance(parsed)
    assert evaluation["overall_status"] == "NON_COMPLIANT"
    
    # MRP rule must FAIL
    mrp_res = next(r for r in evaluation["results"] if r["field"] == "mrp")
    assert mrp_res["status"] == "FAIL"

def test_pdf_report_generation(tmp_path):
    from app.pipeline.pdf_report import generate_pdf_report
    import os

    mock_inspection = {
        "id": 999,
        "timestamp": "2026-08-25 17:00:00",
        "status": "NON_COMPLIANT",
        "officer": "Officer Test",
        "location": "Test Warehouse",
        "notes": "Missing MRP details",
        "product": {
            "name": "Test Snack Pack",
            "manufacturer": "Snackco Inc",
            "category": "Chips",
            "barcode": "0000000000000"
        },
        "declarations": [
            {"field_name": "mrp", "value": "", "confidence": 0.0, "status": "FAIL"},
            {"field_name": "net_quantity", "value": "100 g", "confidence": 0.95, "status": "PASS"}
        ],
        "compliance_results": [
            {"rule_id": "PC-MRP-001", "details": "MRP is missing", "status": "FAIL"},
            {"rule_id": "PC-QTY-002", "details": "Net quantity is declared in grams", "status": "PASS"}
        ]
    }

    pdf_output = tmp_path / "test_report.pdf"
    generate_pdf_report(mock_inspection, str(pdf_output))
    assert os.path.exists(pdf_path := str(pdf_output))
    assert os.path.getsize(pdf_path) > 1000  # Report should contain data

if __name__ == "__main__":
    # Run tests directly if executed
    import sys
    pytest.main(sys.argv)
