import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(inspection_data: dict, output_path: str):
    """
    Generates a professional PDF compliance report using ReportLab.
    """
    # Create the document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#2c3e50'),
        spaceAfter=15
    )
    
    section_heading = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#2c3e50'),
        spaceBefore=12,
        spaceAfter=6,
        borderPadding=2
    )

    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#2c3e50')
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    story = []
    
    # 1. Header
    story.append(Paragraph("PaarakhMetric Compliance Report", title_style))
    story.append(Paragraph("Legal Metrology (Packaged Commodities) Rules, 2011 Compliance Audit", body_style))
    story.append(Spacer(1, 15))
    
    # 2. Inspection Meta block
    status_color = '#27ae60' # Green
    if inspection_data['status'] == 'NON_COMPLIANT':
        status_color = '#c0392b' # Red
    elif inspection_data['status'] == 'REQUIRES_REVIEW':
        status_color = '#f39c12' # Amber
        
    status_text = f"<font color='{status_color}'><b>{inspection_data['status'].replace('_', ' ')}</b></font>"
    
    meta_data = [
        [Paragraph("<b>Inspection ID:</b>", body_style), Paragraph(f"#{inspection_data['id']}", body_style),
         Paragraph("<b>Audit Date:</b>", body_style), Paragraph(inspection_data['timestamp'], body_style)],
        [Paragraph("<b>Enforcement Officer:</b>", body_style), Paragraph(inspection_data['officer'], body_style),
         Paragraph("<b>Overall Status:</b>", body_style), Paragraph(status_text, body_style)],
        [Paragraph("<b>Location:</b>", body_style), Paragraph(inspection_data['location'], body_style),
         Paragraph("", body_style), Paragraph("", body_style)]
    ]
    
    meta_table = Table(meta_data, colWidths=[120, 150, 100, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8f9fa')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#e9ecef'))
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    # 3. Product Metadata
    story.append(Paragraph("Product Information", section_heading))
    product_data = [
        [Paragraph("<b>Product Name:</b>", body_style), Paragraph(inspection_data['product']['name'], body_style)],
        [Paragraph("<b>Manufacturer:</b>", body_style), Paragraph(inspection_data['product']['manufacturer'], body_style)],
        [Paragraph("<b>Category:</b>", body_style), Paragraph(inspection_data['product']['category'], body_style)],
        [Paragraph("<b>Barcode / GTIN:</b>", body_style), Paragraph(inspection_data['product']['barcode'], body_style)]
    ]
    prod_table = Table(product_data, colWidths=[120, 400])
    prod_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e9ecef')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(prod_table)
    story.append(Spacer(1, 15))
    
    # 4. Declarations & Violations check
    story.append(Paragraph("Mandatory Declarations Audit", section_heading))
    
    decl_headers = [
        Paragraph("<b>Mandatory Field</b>", body_bold),
        Paragraph("<b>Extracted Value</b>", body_bold),
        Paragraph("<b>OCR Conf.</b>", body_bold),
        Paragraph("<b>Compliance</b>", body_bold)
    ]
    
    table_rows = [decl_headers]
    for decl in inspection_data['declarations']:
        lbl_color = '#27ae60'
        if decl['status'] in ['FAIL', 'POTENTIAL_VIOLATION']:
            lbl_color = '#c0392b'
        elif decl['status'] == 'REVIEW':
            lbl_color = '#f39c12'
            
        status_paragraph = Paragraph(f"<font color='{lbl_color}'><b>{decl['status']}</b></font>", body_style)
        
        table_rows.append([
            Paragraph(decl['field_name'].replace('_', ' ').title(), body_style),
            Paragraph(decl['value'] or "<i>Not detected</i>", body_style),
            Paragraph(f"{int(decl['confidence']*100)}%", body_style),
            status_paragraph
        ])
        
    decl_table = Table(table_rows, colWidths=[130, 210, 80, 100])
    decl_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e9ecef')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dee2e6')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(decl_table)
    story.append(Spacer(1, 15))
    
    # 5. Rules Detailed Findings
    story.append(Paragraph("Compliance Rules Matrix Findings", section_heading))
    rule_rows = [[
        Paragraph("<b>Rule ID</b>", body_bold),
        Paragraph("<b>Verification Result Details</b>", body_bold),
        Paragraph("<b>Status</b>", body_bold)
    ]]
    for rule in inspection_data['compliance_results']:
        r_color = '#27ae60'
        if rule['status'] == 'FAIL':
            r_color = '#c0392b'
        elif rule['status'] == 'REVIEW':
            r_color = '#f39c12'
            
        rule_rows.append([
            Paragraph(rule['rule_id'], body_style),
            Paragraph(rule['details'], body_style),
            Paragraph(f"<font color='{r_color}'><b>{rule['status']}</b></font>", body_style)
        ])
        
    rule_table = Table(rule_rows, colWidths=[100, 320, 100])
    rule_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e9ecef')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dee2e6')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(rule_table)
    story.append(Spacer(1, 20))
    
    # 6. Sign-off area
    story.append(Paragraph("Officer Signature / Comments Area", section_heading))
    sig_data = [
        [Paragraph(f"<b>Inspector Notes:</b> {inspection_data.get('notes', '')}", body_style), 
         Paragraph("<b>Authorized Verification Stamp</b><br/><br/><br/>_______________________", body_style)]
    ]
    sig_table = Table(sig_data, colWidths=[350, 170])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(sig_table)
    
    # Build Document
    doc.build(story)
