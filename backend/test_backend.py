import pytest
from app.extraction.parser import parse_ocr_results
from app.rules.engine import evaluate_compliance, classify_commodity, get_rule_7_min_font_height

def test_extraction_mrp():
    # Test valid MRP extraction
    ocr_data = [
        {"text": "M.R.P. Rs. 250.00 (incl. of all taxes)", "confidence": 0.98, "bounding_box": {"x": 0, "y": 0, "width": 10, "height": 10}}
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

def test_commodity_classification():
    # Automatic categorization taxonomy tests
    assert classify_commodity("India Gate Super Basmati Rice 5kg") == "Grain"
    assert classify_commodity("Cold Pressed Pure Mustard Oil 1L") == "Edible Oil"
    assert classify_commodity("Chocolate Chip Butter Cookies 200g") == "Confectionery"
    assert classify_commodity("Herbal Aloe Vera Shampoo 500ml") == "Cosmetics"
    assert classify_commodity("Organic Turmeric Powder 100g") == "Spices"
    assert classify_commodity("Pure Orange Juice 1L") == "Beverage"

def test_rule_7_table_1_font_height_math():
    # Rule 7 Table-I minimum numeral height math based on Principal Display Panel area
    assert get_rule_7_min_font_height(35.0) == 1.0     # A <= 50 cm²
    assert get_rule_7_min_font_height(120.0) == 2.0    # 50 < A <= 200 cm²
    assert get_rule_7_min_font_height(500.0) == 4.0    # 200 < A <= 1000 cm²
    assert get_rule_7_min_font_height(1500.0) == 6.0   # A > 1000 cm²

def test_compliance_engine_pass():
    # Compliant package
    parsed = {
        "mrp": {"value": "₹250.00", "confidence": 0.98, "original_text": "MRP Rs 250 (incl. of all taxes)"},
        "net_quantity": {"value": "5 kg", "confidence": 0.95, "original_text": "NET QTY 5kg"},
        "packing_date": {"value": "08/2026", "confidence": 0.90, "original_text": "PKD 08/2026"},
        "consumer_care": {"value": "1800111222", "confidence": 0.91, "original_text": "Care: 1800111222"},
        "manufacturer": {"value": "Mfd by India Foods Ltd", "confidence": 0.92, "original_text": "Mfd by India Foods Ltd"}
    }
    evaluation = evaluate_compliance(parsed, pdp_area_cm2=150.0, measured_font_height_mm=3.0)
    assert evaluation["overall_status"] == "COMPLIANT"
    
    for res in evaluation["results"]:
        assert res["status"] == "PASS"

def test_compliance_engine_fail():
    # Missing MRP & non-standard Net Quantity unit (gms instead of g)
    parsed = {
        "mrp": {"value": "", "confidence": 0.0, "original_text": ""},
        "net_quantity": {"value": "500 gms", "confidence": 0.95, "original_text": "500 gms"},
        "packing_date": {"value": "08/2026", "confidence": 0.90, "original_text": "PKD 08/2026"},
        "consumer_care": {"value": "1800111222", "confidence": 0.91, "original_text": "Care: 1800111222"},
        "manufacturer": {"value": "Mfd by India Foods Ltd", "confidence": 0.92, "original_text": "Mfd by India Foods Ltd"}
    }
    evaluation = evaluate_compliance(parsed)
    assert evaluation["overall_status"] == "NON_COMPLIANT"
    
    mrp_res = next(r for r in evaluation["results"] if r["field"] == "mrp")
    assert mrp_res["status"] == "FAIL"

    qty_res = next(r for r in evaluation["results"] if r["field"] == "net_quantity")
    assert qty_res["status"] == "FAIL"

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
            "category": "Confectionery",
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
    assert os.path.getsize(pdf_path) > 1000

def test_argon2id_hashing_and_jwt():
    from app.auth import hash_password, verify_password, create_access_token, decode_access_token
    raw_pw = "OfficerSecurePass2026!"
    hashed = hash_password(raw_pw)
    assert hashed.startswith("$argon2id$")
    assert verify_password(hashed, raw_pw) is True
    assert verify_password(hashed, "wrongpassword") is False

    token = create_access_token({"sub": "officer_shrey", "role": "officer"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "officer_shrey"
    assert payload["role"] == "officer"

def test_fts5_and_rapidfuzz_search():
    from fastapi.testclient import TestClient
    from app.main import app, on_startup
    on_startup()
    with TestClient(app) as client:
        # 1. Exact / Prefix match (Basmati)
        resp = client.get("/inspections/search?q=Basmati")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        assert any("Basmati" in item["product"]["name"] for item in data)

        # 2. Typo tolerance with RapidFuzz (Bsmati -> Basmati)
        resp_typo = client.get("/inspections/search?q=Bsmati")
        assert resp_typo.status_code == 200
        data_typo = resp_typo.json()
        assert len(data_typo) > 0
        assert any("Basmati" in item["product"]["name"] for item in data_typo)

def test_delete_inspection_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app, on_startup
    on_startup()
    with TestClient(app) as client:
        # 1. Create a temporary product
        prod_resp = client.post("/products", json={
            "name": "Temporary Test Item for Deletion",
            "manufacturer": "Temp Foods",
            "category": "Confectionery",
            "barcode": "9999999999999"
        })
        assert prod_resp.status_code in [200, 201]
        prod_id = prod_resp.json()["id"]

        # 2. Create a temporary inspection
        create_resp = client.post("/inspections", json={
            "product_id": prod_id,
            "location": "Test Depot",
            "notes": "Testing delete endpoint"
        })
        assert create_resp.status_code in [200, 201]
        temp_id = create_resp.json()["id"]

        # 3. Verify it exists
        get_resp = client.get(f"/inspections/{temp_id}")
        assert get_resp.status_code == 200

        # 4. Delete it
        del_resp = client.delete(f"/inspections/{temp_id}")
        assert del_resp.status_code == 200
        assert del_resp.json()["id"] == temp_id

        # 5. Verify it is now 404
        get_after = client.get(f"/inspections/{temp_id}")
        assert get_after.status_code == 404
