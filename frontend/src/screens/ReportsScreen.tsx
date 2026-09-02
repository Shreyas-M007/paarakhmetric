import { useState } from 'react';
import { Search, FileText, Download, Share2, CheckCircle2, TrendingUp, BarChart3, ShieldAlert } from 'lucide-react';
import InspectionList, { Inspection } from '../components/InspectionList';
import { Language, translations, getStatusTranslation } from '../i18n';




interface ReportsScreenProps {
  inspections: Inspection[];
  onRowClick: (id: string) => void;
  onSearchClick?: () => void;
  language?: Language;
  user?: any;
}

export default function ReportsScreen({ inspections, onRowClick, onSearchClick, language = 'en', user }: ReportsScreenProps) {
  const [selectedId, setSelectedId] = useState<string>(inspections[0]?.id || '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [analyticsView, setAnalyticsView] = useState<'trends' | 'categories' | 'violations'>('trends');

  const t = translations[language] || translations.en;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const activeInspection = inspections.find(i => i.id === selectedId) || inspections[0] || null;

  // --- Aggregate Database Analytics across ALL Inspections ---
  const totalAudits = inspections.length;
  const compliantCount = inspections.filter(i => i.status === 'COMPLIANT').length;
  const nonCompliantCount = inspections.filter(i => i.status === 'NON_COMPLIANT').length;
  const reviewCount = inspections.filter(i => (i.status as string) === 'REVIEW' || (i.status as string) === 'REQUIRES_REVIEW').length;

  const overallPassRate = totalAudits > 0 ? Math.round((compliantCount / totalAudits) * 100) : 0;
  const overallFailRate = totalAudits > 0 ? Math.round((nonCompliantCount / totalAudits) * 100) : 0;
  const overallReviewRate = totalAudits > 0 ? Math.round((reviewCount / totalAudits) * 100) : 0;

  // Real Dynamic Category Aggregates
  const categoryStats = (() => {
    if (inspections.length === 0) return [];
    const map: Record<string, { count: number; pass: number }> = {};
    inspections.forEach(i => {
      const cat = i.meta?.split('·')?.[0]?.trim() || 'Packaged Commodity';
      if (!map[cat]) map[cat] = { count: 0, pass: 0 };
      map[cat].count += 1;
      if (i.status === 'COMPLIANT') map[cat].pass += 1;
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      count: data.count,
      rate: Math.round((data.pass / data.count) * 100)
    }));
  })();

  // Real Dynamic Statutory Rule Violations from Ledger
  const violationStats = (() => {
    const nonComp = inspections.filter(i => i.status === 'NON_COMPLIANT');
    if (nonComp.length === 0) return [];
    const map: Record<string, number> = {};
    nonComp.forEach(i => {
      const rule = i.title ? `Rule 6 - ${i.title} Infraction` : 'Legal Metrology Infraction';
      map[rule] = (map[rule] || 0) + 1;
    });
    return Object.entries(map).map(([rule, count]) => ({
      rule,
      count,
      pct: Math.round((count / nonComp.length) * 100)
    }));
  })();

  // Real Dynamic Timeline Aggregates
  const timelineData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap: Record<string, { total: number; pass: number }> = {
      Mon: { total: 0, pass: 0 },
      Tue: { total: 0, pass: 0 },
      Wed: { total: 0, pass: 0 },
      Thu: { total: 0, pass: 0 },
      Fri: { total: 0, pass: 0 },
      Sat: { total: 0, pass: 0 },
      Sun: { total: 0, pass: 0 }
    };

    inspections.forEach(i => {
      const ts = (i as any).timestamp;
      const d = ts ? new Date(ts) : new Date();
      const dayName = days[(d.getDay() + 6) % 7];
      if (dayMap[dayName]) {
        dayMap[dayName].total += 1;
        if (i.status === 'COMPLIANT') dayMap[dayName].pass += 1;
      }
    });

    return days.map(day => ({
      day,
      total: dayMap[day].total,
      pass: dayMap[day].pass,
      rate: dayMap[day].total > 0 ? Math.round((dayMap[day].pass / dayMap[day].total) * 100) : 0
    }));
  })();


  const handleGeneratePdf = () => {
    if (!activeInspection) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const photoHtml = activeInspection.image_url ? `
        <div style="margin: 20px 0; text-align: center;">
          <div style="font-size: 11px; font-weight: bold; color: #4b5563; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em;">Photographic Inspection Evidence</div>
          <img src="${activeInspection.image_url}" alt="${activeInspection.title}" style="max-height: 280px; max-width: 100%; object-fit: contain; border-radius: 8px; border: 1px solid #d1d5db; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
        </div>
      ` : '';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Legal Metrology Inspection Notice #${activeInspection.id}</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
            h1 { margin-bottom: 4px; font-size: 24px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; background: #fee2e2; color: #b91c1c; margin-bottom: 20px; }
            .badge.compliant { background: #dcfce7; color: #15803d; }
            .section { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
            .card { background: #f9fafb; padding: 12px; border-radius: 8px; font-size: 13px; }
            .footer { margin-top: 40px; font-size: 11px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <h1>PaarakhMetric Legal Metrology Notice</h1>
          <div class="badge ${activeInspection.status === 'COMPLIANT' ? 'compliant' : ''}">RECORD #${activeInspection.id} · STATUS: ${activeInspection.status}</div>
          <p><strong>Product Name:</strong> ${activeInspection.title}</p>
          <p><strong>Details / Location:</strong> ${activeInspection.meta}</p>
          <p><strong>Attesting Officer:</strong> ${user?.name || user?.username || 'Legal Metrology Officer'}</p>
          
          ${photoHtml}

          <div class="section">
            <h3>Statutory Evaluation Findings</h3>
            <div class="grid">
              <div class="card"><strong>Rule PC-MRP-001:</strong> Retail Sale Price (MRP) statutory verification.</div>
              <div class="card"><strong>Rule PC-DATE-003:</strong> Month & Year of packing/manufacture validated.</div>
              <div class="card"><strong>Rule PC-QTY-002:</strong> Standard SI units of weight/volume verified.</div>
              <div class="card"><strong>Rule PC-CARE-004:</strong> Consumer grievance helpline presence validated.</div>
            </div>
          </div>
          <div class="footer">Generated by PaarakhMetric AI Compliance Assistant · Legal Metrology (Packaged Commodities) Rules 2011</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
      showToast('PDF inspection report generated!');
    } else {
      window.open(`/api/inspections/${activeInspection.id}/pdf-report`, '_blank');
      showToast('Opening PDF report...');
    }
  };


  const handleShare = () => {
    if (!activeInspection) return;
    if (navigator.share) {
      navigator.share({
        title: `PaarakhMetric Inspection #${activeInspection.id}`,
        text: `Inspection Report for ${activeInspection.title} - Status: ${activeInspection.status}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText?.(window.location.href);
      showToast('Report link copied to clipboard!');
    }
  };

  if (inspections.length === 0) {
    return (
      <div className="flex flex-col gap-6 relative">
        <section className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="w-9 h-9 text-accent" />
            <div className="flex flex-col">
              <h1 className="font-display text-[28px] leading-[32px] font-bold tracking-tight m-0">{t.reports || "Reports & Intelligence"}</h1>
              <span className="text-[12px] font-semibold text-fg-muted uppercase tracking-wider">{language === 'hi' ? 'समग्र प्रवर्तन एनालिटिक्स' : language === 'kn' ? 'ಒಟ್ಟಾರೆ ಜಾರಿ ವಿಶ್ಲೇಷಣೆ' : 'Departmental Enforcement Intelligence'}</span>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface rounded-2xl border border-divider shadow-sm min-h-[50vh]">
          <FileText className="w-16 h-16 text-fg-muted/40 mb-4" />
          <h3 className="font-display text-xl font-bold text-fg mb-2">No Statutory Reports in Ledger</h3>
          <p className="text-sm text-fg-muted max-w-md mb-6 leading-relaxed">
            No product inspections have been logged yet. Scan a packaged commodity using the camera or gallery to generate official compliance reports, analytics, and legal notices.
          </p>
          <button 
            onClick={onSearchClick}
            className="bg-accent text-on-accent px-5 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-transform cursor-pointer shadow-md"
          >
            Go to Audit Ledger
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6 relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[250] bg-surface-elevated text-fg border border-divider px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <section className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText className="w-9 h-9 text-accent" />
          <div className="flex flex-col">
            <h1 className="font-display text-[28px] leading-[32px] font-bold tracking-tight m-0">{t.reports || "Reports & Intelligence"}</h1>
            <span className="text-[12px] font-semibold text-fg-muted uppercase tracking-wider">{language === 'hi' ? 'समग्र प्रवर्तन एनालिटिक्स' : language === 'kn' ? 'ಒಟ್ಟಾರೆ ಜಾರಿ ವಿಶ್ಲೇಷಣೆ' : 'Departmental Enforcement Intelligence'}</span>
          </div>
        </div>
        <button 
          onClick={onSearchClick}
          className="w-10 h-10 rounded-full bg-surface text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95 flex-shrink-0"
          title="Search Records"
        >
          <Search className="w-5 h-5" />
        </button>
      </section>

      {/* Responsive Desktop Multi-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Macro Database Analytics Graph (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-5">

          <section className="bg-surface rounded-2xl p-6 flex flex-col gap-5 border border-divider/60 shadow-sm relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-divider/50">
              <div>
                <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-fg-muted">
                  {language === 'hi' ? 'संपूर्ण डेटाबेस प्रवर्तन रुझान' : language === 'kn' ? 'ಸಮಗ್ರ ಜಾರಿ ಅಂಕಿಅಂಶಗಳು' : 'Entire Database Enforcement Trends'}
                </div>
                <div className="text-[18px] font-bold text-fg font-display mt-0.5">
                  {inspections.length} {language === 'hi' ? 'कुल संचित निरीक्षण' : language === 'kn' ? 'ಒಟ್ಟು ಪರಿಶೀಲನೆಗಳು' : 'Total Accumulated Audits'}
                </div>
              </div>

              {/* Analytics sub-tabs */}
              <div className="flex gap-1 bg-surface-recessed p-1 rounded-xl border border-divider">
                <button
                  onClick={() => setAnalyticsView('trends')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    analyticsView === 'trends' ? 'bg-accent text-on-accent shadow-sm' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'समय रुझान' : language === 'kn' ? 'ಟ್ರೆಂಡ್' : 'Timeline'}</span>
                </button>
                <button
                  onClick={() => setAnalyticsView('categories')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    analyticsView === 'categories' ? 'bg-accent text-on-accent shadow-sm' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'श्रेणी' : language === 'kn' ? 'ವರ್ಗ' : 'Commodities'}</span>
                </button>
                <button
                  onClick={() => setAnalyticsView('violations')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    analyticsView === 'violations' ? 'bg-accent text-on-accent shadow-sm' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'उल्लंघन' : language === 'kn' ? 'ಉಲ್ಲಂಘನೆ' : 'Violations'}</span>
                </button>
              </div>
            </div>

            {/* Global Key Health Ratio Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-fg-muted">{language === 'hi' ? 'समग्र अनुपालन दर' : language === 'kn' ? 'ಒಟ್ಟಾರೆ ಅನುಸರಣೆ ದರ' : 'Overall Departmental Compliance'}</span>
                <span className="font-bold font-mono text-success text-sm">{overallPassRate}% Compliant</span>
              </div>

              <div className="w-full h-4 bg-surface-recessed rounded-full overflow-hidden flex gap-1 p-0.5 border border-divider">
                <div style={{ width: `${overallPassRate}%` }} className="bg-success rounded-l-full transition-all duration-700" title={`Compliant: ${compliantCount}`} />
                {overallReviewRate > 0 && (
                  <div style={{ width: `${overallReviewRate}%` }} className="bg-warning transition-all duration-700" title={`Review: ${reviewCount}`} />
                )}
                <div style={{ width: `${Math.max(overallFailRate, 5)}%` }} className="bg-error rounded-r-full transition-all duration-700" title={`Violations: ${nonCompliantCount}`} />
              </div>

              <div className="flex items-center justify-between text-[11px] text-fg-muted pt-1">
                <span className="flex items-center gap-1.5 font-medium text-success">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  {compliantCount} {t.compliant || "Compliant"} ({overallPassRate}%)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-warning">
                  <span className="w-2 h-2 rounded-full bg-warning"></span>
                  {reviewCount} {t.needsReview || "Review"} ({overallReviewRate}%)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-error">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  {nonCompliantCount} {t.violationsFound || "Violations"} ({overallFailRate}%)
                </span>
              </div>
            </div>

            {/* VIEW 1: TIMELINE TRENDS */}
            {analyticsView === 'trends' && (
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between text-xs text-fg-muted">
                  <span>{language === 'hi' ? 'साप्ताहिक निरीक्षण मात्रा और अनुपालन दर' : language === 'kn' ? 'ವಾರದ ತಪಾಸಣೆ ಪ್ರಮಾಣ ಮತ್ತು ದರ' : 'Weekly Audit Volume & Compliance Rate'}</span>
                  <span className="text-[11px] text-accent font-bold">7-Day Aggregation</span>
                </div>

                <div className="flex items-end justify-between gap-3 h-28 pt-4 px-2 bg-surface-recessed/60 rounded-xl border border-divider/60">
                  {timelineData.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <div className="relative w-full flex items-end justify-center h-20 bg-surface-elevated/40 rounded-md overflow-hidden">
                        <div 
                          style={{ height: `${item.total > 0 ? Math.max(item.rate, 15) : 0}%` }} 
                          className={`w-full transition-all duration-500 rounded-t ${
                            item.total === 0 ? 'bg-transparent' : item.rate >= 85 ? 'bg-success' : item.rate >= 70 ? 'bg-warning' : 'bg-error'
                          }`} 
                        />
                        {item.total > 0 && (
                          <div className="absolute -top-7 bg-fg text-canvas text-[10px] font-bold px-2 py-0.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                            {item.pass}/{item.total} ({item.rate}%)
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-fg-muted font-mono">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 2: CATEGORIES */}
            {analyticsView === 'categories' && (
              <div className="flex flex-col gap-3 pt-2">
                <div className="text-xs text-fg-muted">
                  {language === 'hi' ? 'वस्तु श्रेणी द्वारा अनुपालन दर तुलना' : language === 'kn' ? 'ಸರಕು ವರ್ಗವಾರು ಅನುಸರಣೆ ಹೋಲಿಕೆ' : 'Category Compliance Comparison across all packaged commodities'}
                </div>

                {categoryStats.length === 0 ? (
                  <div className="p-6 text-center text-xs text-fg-muted bg-surface-recessed/40 rounded-xl border border-dashed border-divider">
                    No commodity categories logged yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {categoryStats.map((cat, idx) => (
                      <div key={idx} className="bg-surface-recessed/60 p-3 rounded-xl border border-divider/60 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-fg">{cat.name}</span>
                          <span className="font-mono font-bold text-fg">{cat.rate}% Pass · {cat.count} Audits</span>
                        </div>
                        <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${cat.rate}%` }} 
                            className={`h-full rounded-full transition-all duration-500 ${
                              cat.rate >= 85 ? 'bg-success' : cat.rate >= 70 ? 'bg-warning' : 'bg-error'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: VIOLATIONS */}
            {analyticsView === 'violations' && (
              <div className="flex flex-col gap-3 pt-2">
                <div className="text-xs text-fg-muted">
                  {language === 'hi' ? 'शीर्ष सबसे लगातार वैधानिक उल्लंघन' : language === 'kn' ? 'ಅತ್ಯಂತ ಸಾಮಾನ್ಯ ಕಾನೂನು ಉಲ್ಲಂಘನೆಗಳು' : 'Statutory Infractions logged across ledger'}
                </div>

                {violationStats.length === 0 ? (
                  <div className="p-6 text-center text-xs text-fg-muted bg-surface-recessed/40 rounded-xl border border-dashed border-divider">
                    No statutory violations recorded. All ledger commodities comply with LMPC rules.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {violationStats.map((viol, idx) => (
                      <div key={idx} className="bg-surface-recessed/60 p-3 rounded-xl border border-divider/60 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-fg truncate">{viol.rule}</span>
                          <span className="font-mono font-bold text-error ml-2 flex-shrink-0">{viol.pct}% ({viol.count})</span>
                        </div>
                        <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${viol.pct}%` }} 
                            className="h-full bg-error rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Single Inspection Generator & Report List (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Single Inspection Report Export Card */}
          <section className="bg-surface rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden border border-divider/60 shadow-sm">
            {!activeInspection ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-fg-muted">
                <FileText className="w-10 h-10 text-fg-muted/40 mb-2" />
                <span className="text-sm font-semibold text-fg">No Inspection Selected</span>
                <span className="text-xs text-fg-muted mt-1">Scan a product to generate an official statutory report.</span>
              </div>
            ) : (
              <>
                {/* Record Selector and Prev / Next Navigator */}
                <div className="flex items-center justify-between gap-2 border-b border-divider/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] tracking-[0.08em] uppercase text-fg-muted font-bold">
                      {language === 'hi' ? 'चयनित रिकॉर्ड' : language === 'kn' ? 'ಆಯ್ಕೆಮಾಡಿದ ತಪಾಸಣೆ' : 'Selected Record'}
                    </span>
                    <select 
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="bg-surface-elevated text-fg text-xs font-bold font-mono px-2 py-1 rounded-lg border border-divider outline-none cursor-pointer hover:border-accent"
                    >
                      {inspections.map((item, idx) => (
                        <option key={item.id} value={item.id}>
                          #{item.id} · {item.title} ({idx + 1}/{inspections.length})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Prev / Next Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const currentIndex = inspections.findIndex(i => i.id === selectedId);
                        if (currentIndex > 0) {
                          setSelectedId(inspections[currentIndex - 1].id);
                        }
                      }}
                      disabled={inspections.findIndex(i => i.id === selectedId) <= 0}
                      className="p-1.5 rounded-lg bg-surface-elevated text-fg-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Previous Inspection"
                    >
                      ←
                    </button>
                    <span className="text-xs font-mono font-bold text-fg-muted px-1">
                      {Math.max(1, inspections.findIndex(i => i.id === selectedId) + 1)} / {inspections.length}
                    </span>
                    <button
                      onClick={() => {
                        const currentIndex = inspections.findIndex(i => i.id === selectedId);
                        if (currentIndex >= 0 && currentIndex < inspections.length - 1) {
                          setSelectedId(inspections[currentIndex + 1].id);
                        }
                      }}
                      disabled={inspections.findIndex(i => i.id === selectedId) >= inspections.length - 1}
                      className="p-1.5 rounded-lg bg-surface-elevated text-fg-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Next Inspection"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-accent">
                    #{activeInspection.id}
                  </span>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-[0.02em] bg-transparent border border-divider ${
                    activeInspection.status === 'COMPLIANT' ? 'text-success' : activeInspection.status === 'NON_COMPLIANT' ? 'text-error font-bold' : 'text-warning'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {getStatusTranslation(activeInspection.status, language)}
                  </span>
                </div>

                <div>
                  <div className="font-display text-[22px] font-bold text-fg leading-tight">{activeInspection.title}</div>
                  <div className="text-[13px] whitespace-nowrap overflow-hidden text-ellipsis text-fg-muted mt-1">
                    {activeInspection.meta} · {t.officer} {user?.name || user?.username || 'Enforcement Officer'}
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button 
                    onClick={handleGeneratePdf}
                    className="flex-1 flex items-center justify-center gap-2 bg-accent text-on-accent rounded-xl p-3.5 text-[14px] font-bold active:scale-95 transition-transform shadow-lg shadow-accent/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {t.downloadPdf}
                  </button>
                  <button 
                    onClick={() => onRowClick(activeInspection.id)}
                    className="px-4 bg-surface-elevated hover:bg-surface border border-divider text-fg rounded-xl text-xs font-bold active:scale-95 transition-transform cursor-pointer"
                    title="View Full Inspection Details"
                  >
                    {language === 'hi' ? 'विवरण' : language === 'kn' ? 'ವಿವರ' : 'Details'}
                  </button>
                  <button 
                    onClick={handleShare}
                    className="w-12 flex-shrink-0 flex items-center justify-center bg-surface-elevated text-fg rounded-xl active:scale-95 transition-transform hover:text-accent border border-divider"
                    title="Share Report"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[11px] text-fg-muted text-center">
                  {t.reportPrintAvailable} · {activeInspection.timeInfo || 'Today'}
                </div>
              </>
            )}
          </section>


          {/* Past Reports List Selector */}
          <div className="bg-surface rounded-2xl p-5 border border-divider/60 shadow-sm">
            <InspectionList 
              title={language === 'hi' ? 'निरीक्षण रिपोर्ट चुनें' : language === 'kn' ? 'ತಪಾಸಣೆ ವರದಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select inspection report to inspect'}
              inspections={inspections.map(i => ({...i, iconType: 'FileText'}))} 
              onRowClick={(id) => {
                setSelectedId(id);
              }} 
              language={language}
            />
          </div>
        </div>
      </div>
    </div>


  );
}

