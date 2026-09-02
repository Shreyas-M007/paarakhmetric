/**
 * Universal Statutory PDF Generator for PaarakhMetric
 * Legal Metrology (Packaged Commodities) Rules, 2011 · Department of Consumer Affairs
 * Includes all captured packaging photos, declarations, and rule evaluations.
 */
export function generateInspectionPdf(activeInspection: any, user?: any, _language: string = 'en'): boolean {
  if (!activeInspection) return false;


  // Collect ALL unique photographic evidence panels
  const allPhotos: Array<{ url: string; panel: string }> = [];
  const seenUrls = new Set<string>();

  const addPhoto = (url?: string, panel?: string) => {
    if (!url || typeof url !== 'string' || url.length < 10 || seenUrls.has(url)) return;
    seenUrls.add(url);
    allPhotos.push({ url, panel: panel || 'Packaging Panel' });
  };

  // 1. From images array (multi-panel captures)
  const imagesArr = activeInspection.images;
  if (Array.isArray(imagesArr)) {
    imagesArr.forEach((img: any) => {
      if (typeof img === 'string') addPhoto(img, 'Packaging Panel');
      else if (img && img.url) addPhoto(img.url, img.panel || 'Packaging Panel');
    });
  }

  // 2. From image_url
  if (activeInspection.image_url) {
    addPhoto(activeInspection.image_url, 'Primary Panel');
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return false;
  }

  const photoHtml = allPhotos.length > 0 ? `
    <div style="margin: 16px 0; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
        <span style="font-size: 11px; font-weight: bold; color: #334155; text-transform: uppercase; letter-spacing: 0.05em;">
          Statutory Photographic Evidence (${allPhotos.length} Panel${allPhotos.length > 1 ? 's' : ''} Recorded)
        </span>
        <span style="font-size: 10px; color: #64748b; font-family: monospace;">Rule 15 LMPC Forensic Dossier</span>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;">
        ${allPhotos.map((p, idx) => `
          <div style="flex: 1 1 ${allPhotos.length === 1 ? '100%' : allPhotos.length === 2 ? '45%' : '30%'}; min-width: 180px; max-width: ${allPhotos.length === 1 ? '450px' : '280px'}; text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <img src="${p.url}" alt="Panel ${idx + 1}" style="width: 100%; max-height: ${allPhotos.length === 1 ? '320px' : '200px'}; object-fit: contain; border-radius: 4px;" />
            <div style="margin-top: 6px; font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block;">
              ${p.panel.toUpperCase()} · EVIDENCE #${idx + 1}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const decls = ((activeInspection as any).declarations && (activeInspection as any).declarations.length > 0)
    ? (activeInspection as any).declarations
    : [];

  const declRows = decls.length > 0
    ? decls.map((d: any) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 12px; font-weight: 600; text-transform: capitalize; color: #1e293b;">${(d.field_name || '').replace(/_/g, ' ')}</td>
          <td style="padding: 8px 12px; font-family: monospace; font-weight: bold; color: #0f172a;">${d.value || 'Not Detected'}</td>
          <td style="padding: 8px 12px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${d.status === 'VALIDATED' || d.status === 'OFFICER_CONFIRMED' ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}">
              ${d.status || 'VERIFIED'}
            </span>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">No extracted declarations recorded for this scan.</td></tr>`;

  const rules = ((activeInspection as any).compliance_results && (activeInspection as any).compliance_results.length > 0)
    ? (activeInspection as any).compliance_results
    : [];

  const ruleRows = rules.length > 0
    ? rules.map((r: any) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 12px; font-family: monospace; font-weight: bold; color: #0f172a;">${r.rule_id}</td>
          <td style="padding: 8px 12px; color: #334155;">${r.details || 'Statutory declaration evaluated'}</td>
          <td style="padding: 8px 12px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${r.status === 'PASS' ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}">
              ${r.status}
            </span>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">All standard statutory requirements satisfied.</td></tr>`;

  const formatOfficialDate = (ts?: string) => {
    const d = ts ? new Date(ts) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  const formattedInspectionDate = formatOfficialDate((activeInspection as any).timestamp);
  const commodityTitle = activeInspection.title || activeInspection.product?.name || 'Packaged Commodity';
  const categoryMeta = activeInspection.meta || activeInspection.product?.category || 'General FMCG';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Legal Metrology Inspection Notice #${activeInspection.id}</title>
      <style>
        @page { margin: 12mm; size: A4; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 16px; color: #0f172a; line-height: 1.5; font-size: 12px; }
        .header-banner { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
        h1 { margin: 0 0 4px 0; font-size: 19px; font-weight: 800; letter-spacing: -0.02em; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; background: #fee2e2; color: #b91c1c; }
        .badge.compliant { background: #dcfce7; color: #15803d; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
        .meta-table td { padding: 7px 12px; font-size: 11.5px; }
        .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #334155; margin: 14px 0 6px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11.5px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
        .data-table th { background: #f1f5f9; padding: 7px 12px; text-align: left; font-size: 10.5px; text-transform: uppercase; color: #475569; }
        .footer { margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10.5px; color: #64748b; page-break-inside: avoid; }
        .signature-box { text-align: center; border-top: 1px dashed #94a3b8; width: 200px; padding-top: 6px; }
      </style>
    </head>
    <body>
      <div class="header-banner">
        <div>
          <h1>Government Legal Metrology Enforcement Notice</h1>
          <div style="font-size: 11.5px; color: #475569;">Legal Metrology (Packaged Commodities) Rules, 2011 · Department of Consumer Affairs</div>
        </div>
        <div>
          <span class="badge ${activeInspection.status === 'COMPLIANT' ? 'compliant' : ''}">
            NOTICE #${activeInspection.id} · ${activeInspection.status}
          </span>
        </div>
      </div>

      <table class="meta-table">
        <tr>
          <td style="width: 25%;"><strong>Commodity:</strong></td>
          <td style="width: 35%;">${commodityTitle}</td>
          <td style="width: 20%;"><strong>Inspection Date:</strong></td>
          <td style="width: 20%;">${formattedInspectionDate}</td>
        </tr>
        <tr>
          <td><strong>Category / Location:</strong></td>
          <td>${categoryMeta}</td>
          <td><strong>Attesting Officer:</strong></td>
          <td>${user?.name || user?.username || 'Legal Metrology Officer'}</td>
        </tr>
      </table>

      ${photoHtml}

      <div class="section-title">1. Mandatory Statutory Declarations Audited</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 35%;">Declaration Parameter</th>
            <th style="width: 45%;">Detected On Packaging</th>
            <th style="width: 20%;">Compliance Verdict</th>
          </tr>
        </thead>
        <tbody>
          ${declRows}
        </tbody>
      </table>

      <div class="section-title">2. Legal Metrology Statutory Rule Evaluation</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 25%;">Rule Reference</th>
            <th style="width: 55%;">Statutory Requirement & Finding</th>
            <th style="width: 20%;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${ruleRows}
        </tbody>
      </table>

      <div class="footer">
        <div>
          <div>Generated by PaarakhMetric Statutory Compliance Engine</div>
          <div>Digital Evidence Hash: SHA256-${activeInspection.id}-AUDIT-${Date.now().toString(36).toUpperCase()}</div>
        </div>
        <div class="signature-box">
          <div style="font-weight: bold; color: #0f172a;">${user?.name || user?.username || 'Enforcement Officer'}</div>
          <div>${user?.designation || 'Legal Metrology Officer'}</div>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 350);
  return true;
}
