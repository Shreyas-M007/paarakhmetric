import re

with open('app/main.py', 'r') as f:
    content = f.read()

new_logic = """    # --- EXECUTE EXACT PAARAKHMETRIC PIPELINE ---
    from app.pipeline.orchestrator import run_paarakhmetric_pipeline
    
    pipeline_result = run_paarakhmetric_pipeline(filepath, use_vision_llm=True)
    
    parsed_decls = pipeline_result.get('extracted_fields', {})
    compliance = pipeline_result.get('compliance_report', {})
    ocr_raw = pipeline_result.get('ocr_raw', [])
    
    # Save OCR words/bboxes into DB for audit
    if ocr_raw:
        for item in ocr_raw:
            try:
                db_ocr = OCRResult(
                    product_image_id=db_image.id,
                    text=item.get('text', ''),
                    confidence=item.get('confidence', 0.0),
                    bbox_x=item.get('bounding_box', {}).get('x', 0),
                    bbox_y=item.get('bounding_box', {}).get('y', 0),
                    bbox_w=item.get('bounding_box', {}).get('width', 0),
                    bbox_h=item.get('bounding_box', {}).get('height', 0)
                )
                db.add(db_ocr)
            except Exception as e:
                pass
        db.commit()

    # Extract declarations & Automatic Commodity Categorization
    all_ocr_text = " ".join([item.get('text', '') for item in (ocr_raw or [])])
    detected_name = parsed_decls.get('product_name', {}).get('value') or ''
    detected_category = classify_commodity(all_ocr_text, detected_name)
    
    if db_inspection.product:
        if not db_inspection.product.name or db_inspection.product.name == 'New Unidentified Package':
            db_inspection.product.name = detected_name or 'Packaged Commodity'
        if not db_inspection.product.category or db_inspection.product.category == 'General':
            db_inspection.product.category = detected_category
        db.commit()
    
    # Save or update parsed declarations
    for field_name, decl in parsed_decls.items():
        if field_name == 'unsupported_language_detected':
            continue
        existing = db.query(Declaration).filter(
            Declaration.inspection_id == inspection_id,
            Declaration.field_name == field_name
        ).first()
        
        if existing:
            existing.value = decl.get('value', '')
            existing.status = decl.get('status', 'MISSING')
            existing.confidence = decl.get('confidence', 0.0)
            existing.original_text = decl.get('original_text', '')
        else:
            db_decl = Declaration(
                inspection_id=inspection_id,
                field_name=field_name,
                value=decl.get('value', ''),
                status=decl.get('status', 'MISSING'),
                confidence=decl.get('confidence', 0.0),
                original_text=decl.get('original_text', '')
            )
            db.add(db_decl)
    db.commit()

    # Update overall status
    overall_status = compliance.get('overall_status', 'REQUIRES_REVIEW')
    db_inspection.status = overall_status
    db.commit()

    # Log to Compliance Result
    for res in compliance.get('results', []):
        db_res = ComplianceResult(
            inspection_id=inspection_id,
            rule_id=res.get('rule_id'),
            status=res.get('status'),
            details=res.get('details')
        )
        db.add(db_res)
    db.commit()

    return {
        'status': 'success',
        'image_id': db_image.id,
        'image_url': f'/uploads/{filename}',
        'extracted_data': parsed_decls,
        'compliance_report': compliance
    }
"""

pattern = re.compile(r'# 2\. Run Image Quality Assessment.*?(?=\n@app|\Z)', re.DOTALL)
new_content = re.sub(pattern, new_logic, content)

with open('app/main.py', 'w') as f:
    f.write(new_content)
print('Done patching main.py')
