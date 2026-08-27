import os
import tempfile
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from PIL import Image, ImageDraw, ImageFont

FIELD_NAME_MAP = {
    "mrp": "Maximum Retail Price (MRP)",
    "net_quantity": "Net Quantity",
    "packing_date": "Date of Packing / Mfg",
    "consumer_care": "Consumer Care Details",
    "manufacturer": "Manufacturer / Packer Details",
    "product_name": "Product Name / Generic Name",
    "font_height": "Rule 7 Numeral Height",
    "country_of_origin": "Country of Origin"
}

def format_field_name(raw_field: str) -> str:
    """Formats technical field identifiers into standard statutory labels."""
    f_lower = str(raw_field).lower().strip()
    if f_lower in FIELD_NAME_MAP:
        return FIELD_NAME_MAP[f_lower]
    if "mrp" in f_lower:
        return "MRP"
    return str(raw_field).replace('_', ' ').title()

def sanitize_text_for_pdf(text: str) -> str:
    """
    Sanitizes text for standard Type 1 PDF font rendering:
    - Replaces unicode Rupee symbol (₹) with 'Rs. ' to prevent black box glyph rendering.
    """
    if text is None:
        return ""
    s = str(text)
    s = s.replace("₹", "Rs. ").replace("Rs.  ", "Rs. ").replace("Rs. ", "Rs. ")
    return s

def create_annotated_product_image(inspection_data: dict, input_image_path: str = None) -> str:
    """
    Creates an image for the PDF report.
    - If violations exist: Draws explicit RED annotations over the failed areas.
    - If compliant: Displays a clean image without clutter, with a subtle verified badge.
    """
    has_violations = inspection_data.get('status') == 'NON_COMPLIANT' or any(
        d.get('status') in ['FAIL', 'POTENTIAL_VIOLATION'] for d in inspection_data.get('declarations', [])
    ) or any(
        r.get('status') == 'FAIL' for r in inspection_data.get('compliance_results', [])
    )
    
    # 1. Load or synthesize base image
    if input_image_path and os.path.exists(input_image_path):
        try:
            base_img = Image.open(input_image_path).convert('RGB')
            base_img.thumbnail((700, 500), Image.Resampling.LANCZOS)
        except Exception:
            base_img = None
    else:
        base_img = None

    if base_img is None:
        # Create a synthetic package card
        w, h = 600, 360
        base_img = Image.new('RGB', (w, h), color=(26, 32, 44))
        draw = ImageDraw.Draw(base_img)
        
        # Package frame
        draw.rectangle([(15, 15), (w-15, h-15)], outline=(74, 85, 104), width=2)
        
        # Header banner
        prod_name = sanitize_text_for_pdf(inspection_data.get('product', {}).get('name', 'Packaged Commodity'))
        category = sanitize_text_for_pdf(inspection_data.get('product', {}).get('category', 'General FMCG'))
        mfg = sanitize_text_for_pdf(inspection_data.get('product', {}).get('manufacturer', 'N/A'))
        
        draw.rectangle([(20, 20), (w-20, 70)], fill=(45, 55, 72))
        draw.text((35, 32), f"{prod_name} [{category}]", fill=(255, 255, 255))
        draw.text((35, 48), f"Mfd: {mfg}", fill=(160, 174, 192))
        
        # Declarations simulated positioning
        draw.text((40, 100), "PRINCIPAL DISPLAY PANEL (PDP)", fill=(113, 128, 150))
    else:
        w, h = base_img.size
        draw = ImageDraw.Draw(base_img)

    draw = ImageDraw.Draw(base_img)

    # 2. Apply Annotations ONLY if there are failures / violations
    if has_violations:
        failed_decls = [d for d in inspection_data.get('declarations', []) if d.get('status') in ['FAIL', 'POTENTIAL_VIOLATION', 'REVIEW']]
        failed_rules = [r for r in inspection_data.get('compliance_results', []) if r.get('status') in ['FAIL', 'REVIEW']]
        
        offset_y = 110
        for i, decl in enumerate(failed_decls):
            field_label = format_field_name(decl.get('field_name', ''))
            decl_val = sanitize_text_for_pdf(decl.get('value') or 'MISSING')
            matched_rule = next((r for r in failed_rules if decl.get('field_name') in str(r.get('details', '')).lower() or r.get('field') == decl.get('field_name')), None)
            rule_id = matched_rule.get('rule_id', 'Rule 6') if matched_rule else 'Rule 6 Violation'

            box_top = offset_y + (i * 65)
            if box_top + 55 < h - 20:
                # Red highlight box
                draw.rectangle([(30, box_top), (w - 30, box_top + 52)], outline=(220, 38, 38), width=3, fill=(153, 27, 27, 80))
                # Label badge
                draw.rectangle([(30, box_top), (210, box_top + 18)], fill=(220, 38, 38))
                draw.text((36, box_top + 3), f"VIOLATION: {rule_id}", fill=(255, 255, 255))
                # Issue description
                draw.text((38, box_top + 23), f"Field: {field_label} -> {decl_val}", fill=(254, 202, 202))
                if matched_rule:
                    details_sanitized = sanitize_text_for_pdf(matched_rule.get('details', ''))[:60]
                    draw.text((38, box_top + 37), f"Reason: {details_sanitized}...", fill=(254, 226, 226))

        # Top alert banner on image
        draw.rectangle([(0, 0), (w, 24)], fill=(185, 28, 28))
        draw.text((15, 6), "NON-COMPLIANCE AUDIT OVERLAY - STATUTORY ISSUES HIGHLIGHTED", fill=(255, 255, 255))

    else:
        # CLEAN COMPLIANT IMAGE: No red bounding clutter, just verified stamp
        badge_w, badge_h = 240, 32
        badge_x, badge_y = w - badge_w - 15, h - badge_h - 15
        draw.rectangle([(badge_x, badge_y), (w - 15, h - 15)], fill=(22, 101, 52), outline=(34, 197, 94), width=2)
        draw.text((badge_x + 12, badge_y + 9), "VERIFIED STATUTORY COMPLIANT", fill=(255, 255, 255))

    # Save to temp file
    temp_img = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    temp_path = temp_img.name
    temp_img.close()
    base_img.save(temp_path, format="PNG")
    return temp_path

def generate_pdf_report(inspection_data: dict, output_path: str):
    """
    Generates a professional PDF compliance report using ReportLab with embedded product image & conditional violation annotations.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1a202c'),
        spaceAfter=4
    )
    
    section_heading = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=5
    )

    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    story = []
    
    # 1. Header
    story.append(Paragraph("<b>PaarakhMetric Compliance & Enforcement Notice</b>", title_style))
    story.append(Paragraph("Statutory Audit under Legal Metrology (Packaged Commodities) Rules, 2011 & 2026 Amendments", body_style))
    story.append(Spacer(1, 10))
    
    # 2. Inspection Meta block
    status = inspection_data.get('status', 'PENDING')
    status_color = '#16a34a' if status == 'COMPLIANT' else '#dc2626' if status == 'NON_COMPLIANT' else '#d97706'
    status_text = f"<font color='{status_color}'><b>{status.replace('_', ' ')}</b></font>"
    
    meta_data = [
        [Paragraph("<b>Inspection ID:</b>", body_style), Paragraph(f"#{inspection_data.get('id', 'N/A')}", body_style),
         Paragraph("<b>Audit Timestamp:</b>", body_style), Paragraph(sanitize_text_for_pdf(inspection_data.get('timestamp', 'N/A')), body_style)],
        [Paragraph("<b>Enforcement Officer:</b>", body_style), Paragraph(sanitize_text_for_pdf(inspection_data.get('officer', 'Officer')), body_style),
         Paragraph("<b>Overall Status:</b>", body_style), Paragraph(status_text, body_style)],
        [Paragraph("<b>Audit Location:</b>", body_style), Paragraph(sanitize_text_for_pdf(inspection_data.get('location', 'N/A')), body_style),
         Paragraph("<b>Commodity Category:</b>", body_style), Paragraph(sanitize_text_for_pdf(inspection_data.get('product', {}).get('category', 'General FMCG')), body_style)]
    ]
    
    meta_table = Table(meta_data, colWidths=[110, 160, 110, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0'))
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))
    
    # 3. Product Photographic Evidence with Conditional Annotations
    story.append(Paragraph("Product Photographic Evidence & Audit Visualization", section_heading))
    
    input_img_path = inspection_data.get('image_filepath')
    temp_annotated_img = create_annotated_product_image(inspection_data, input_img_path)
    
    try:
        img_elem = RLImage(temp_annotated_img, width=440, height=170)
        img_table = Table([[img_elem]], colWidths=[540])
        img_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0f172a')),
            ('PADDING', (0,0), (-1,-1), 4),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#334155'))
        ]))
        story.append(img_table)
        
        if status == 'NON_COMPLIANT':
            story.append(Paragraph("<font color='#dc2626'><i>* Red bounding overlays indicate exact non-compliant or missing mandatory declarations identified during OCR audit.</i></font>", body_style))
        else:
            story.append(Paragraph("<font color='#16a34a'><i>* Clean product snapshot: No statutory non-compliances detected on inspected package panel.</i></font>", body_style))
            
    except Exception as e:
        story.append(Paragraph(f"<i>Image visualization preview unavailable: {e}</i>", body_style))
        
    story.append(Spacer(1, 10))

    # 4. Mandatory Declarations Audit Table
    story.append(Paragraph("Mandatory Declarations Audit (Rule 6)", section_heading))
    
    decl_headers = [
        Paragraph("<b>Statutory Declaration</b>", body_bold),
        Paragraph("<b>Extracted Token / Text</b>", body_bold),
        Paragraph("<b>OCR Conf.</b>", body_bold),
        Paragraph("<b>Compliance</b>", body_bold)
    ]
    
    table_rows = [decl_headers]
    for decl in inspection_data.get('declarations', []):
        d_status = decl.get('status', 'VALIDATED')
        lbl_color = '#16a34a' if d_status in ['VALIDATED', 'PASS'] else '#dc2626' if d_status in ['FAIL', 'POTENTIAL_VIOLATION'] else '#d97706'
        status_paragraph = Paragraph(f"<font color='{lbl_color}'><b>{d_status}</b></font>", body_style)
        
        conf = float(decl.get('confidence', 0.0))
        field_label = format_field_name(decl.get('field_name', ''))
        raw_val = decl.get('value')
        extracted_text = sanitize_text_for_pdf(raw_val) if raw_val else "<i>Not detected</i>"
        
        table_rows.append([
            Paragraph(field_label, body_style),
            Paragraph(extracted_text, body_style),
            Paragraph(f"{int(conf * 100)}%", body_style),
            status_paragraph
        ])
        
    decl_table = Table(table_rows, colWidths=[160, 200, 70, 110])
    decl_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(decl_table)
    story.append(Spacer(1, 10))
    
    # 5. Rules Detailed Findings
    story.append(Paragraph("Legal Metrology Rule Verification Findings", section_heading))
    rule_rows = [[
        Paragraph("<b>Rule Code</b>", body_bold),
        Paragraph("<b>Statutory Requirement & Verification Finding</b>", body_bold),
        Paragraph("<b>Verdict</b>", body_bold)
    ]]
    for rule in inspection_data.get('compliance_results', []):
        r_status = rule.get('status', 'PASS')
        r_color = '#16a34a' if r_status == 'PASS' else '#dc2626' if r_status == 'FAIL' else '#d97706'
        rule_details = sanitize_text_for_pdf(rule.get('details', 'N/A'))
            
        rule_rows.append([
            Paragraph(rule.get('rule_id', 'N/A'), body_style),
            Paragraph(rule_details, body_style),
            Paragraph(f"<font color='{r_color}'><b>{r_status}</b></font>", body_style)
        ])
        
    rule_table = Table(rule_rows, colWidths=[90, 360, 90])
    rule_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(rule_table)
    story.append(Spacer(1, 15))
    
    # 6. Officer Authorization & Stamp
    sig_data = [
        [Paragraph(f"<b>Audit Notes:</b> {sanitize_text_for_pdf(inspection_data.get('notes', 'Routine statutory inspection.'))}", body_style), 
         Paragraph("<b>Authorized Verification Seal:</b><br/><br/>_______________________________", body_style)]
    ]
    sig_table = Table(sig_data, colWidths=[360, 180])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(sig_table)
    
    # Build Document
    doc.build(story)
    
    # Clean up temporary annotated image
    if os.path.exists(temp_annotated_img):
        try:
            os.remove(temp_annotated_img)
        except Exception:
            pass
