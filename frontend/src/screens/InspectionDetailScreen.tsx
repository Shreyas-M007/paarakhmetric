import { useState } from 'react';
import { ArrowLeft, Download, Scan, AlertCircle, CheckCircle, AlertTriangle, Edit3, Save, ShieldCheck } from 'lucide-react';
import { computeRuleTally } from '../utils/mapInspection';
import { Language, translations, getStatusTranslation, getDeclarationFieldTranslation, getCategoryTranslation } from '../i18n';


interface InspectionDetailScreenProps {
  inspection: any;
  inspections?: any[];
  onSelectInspection?: (id: number) => void;
  capturedImage: string | null;
  onBack: () => void;
  onManualOverride: (fieldName: string, newValue: string) => void;
  language?: Language;
}

export default function InspectionDetailScreen({
  inspection, inspections = [], onSelectInspection, capturedImage, onBack, onManualOverride, language = 'en'
}: InspectionDetailScreenProps) {
  const [inspectingSide, setInspectingSide] = useState('front');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const t = translations[language] || translations.en;

  const displayImage = capturedImage || inspection.image_url;

  const { failed, total } = computeRuleTally(inspection.compliance_results);
  const statusLabel = getStatusTranslation(inspection.status, language);
  const statusColor = inspection.status === 'COMPLIANT' ? 'text-success' :
    inspection.status === 'NON_COMPLIANT' ? 'text-error font-bold' : 'text-warning';

  const currentIndex = inspections.findIndex(i => i.id === inspection.id);

  const handleSaveEdit = (fieldName: string) => {
    onManualOverride(fieldName, editValue);
    setEditingField(null);
    setEditValue('');
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <section className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-10 h-10 rounded-xl bg-surface border border-divider text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated active:scale-95 flex-shrink-0 cursor-pointer"
            title="Back to Ledger"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[22px] sm:text-[26px] font-bold tracking-tight m-0 text-fg">
                {language === 'hi' ? `निरीक्षण #${inspection.id}` : language === 'kn' ? `ತಪಾಸಣೆ #${inspection.id}` : `Inspection #${inspection.id}`}
              </h1>
              
              {/* Inspection Picker Dropdown */}
              {inspections.length > 1 && onSelectInspection && (
                <select
                  value={inspection.id}
                  onChange={(e) => onSelectInspection(Number(e.target.value))}
                  className="bg-surface-elevated text-fg text-xs font-bold font-mono px-2 py-1 rounded-lg border border-divider outline-none cursor-pointer hover:border-accent"
                >
                  {inspections.map((item, idx) => (
                    <option key={item.id} value={item.id}>
                      #{item.id} · {item.product?.name || item.title || 'Item'} ({idx + 1}/{inspections.length})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <span className="text-[13px] text-fg-muted truncate block">
              {inspection.product?.name || 'Packaged Item'} · {inspection.timestamp ? new Date(inspection.timestamp).toLocaleDateString() : 'Today'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Prev / Next Inspection Buttons */}
          {inspections.length > 1 && onSelectInspection && (
            <div className="flex items-center gap-1 bg-surface border border-divider rounded-xl p-1">
              <button
                onClick={() => {
                  if (currentIndex > 0) {
                    onSelectInspection(inspections[currentIndex - 1].id);
                  }
                }}
                disabled={currentIndex <= 0}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-surface-elevated text-fg-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Previous Inspection"
              >
                ← {language === 'hi' ? 'पिछला' : language === 'kn' ? 'ಹಿಂದಿನ' : 'Prev'}
              </button>
              <span className="text-xs font-mono font-bold text-fg-muted px-1.5">
                {Math.max(1, currentIndex + 1)} / {inspections.length}
              </span>
              <button
                onClick={() => {
                  if (currentIndex >= 0 && currentIndex < inspections.length - 1) {
                    onSelectInspection(inspections[currentIndex + 1].id);
                  }
                }}
                disabled={currentIndex < 0 || currentIndex >= inspections.length - 1}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-surface-elevated text-fg-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Next Inspection"
              >
                {language === 'hi' ? 'अगला' : language === 'kn' ? 'ಮುಂದಿನ' : 'Next'} →
              </button>
            </div>
          )}

          <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-[0.02em] bg-transparent border border-divider ${statusColor} flex-shrink-0`}>
            <span className="w-2 h-2 rounded-full bg-current" />{statusLabel}
          </span>
        </div>
      </section>


      {/* Responsive Desktop Multi-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Label Visualizer Photo & Packaging Side Selector (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <section className="bg-surface rounded-2xl overflow-hidden border border-divider/60 shadow-sm">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold font-body flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-accent" /> {t.labelVisualizer || "Label Visualizer"}
              </span>
              <span className="text-[10px] bg-surface-elevated text-fg-muted px-2 py-0.5 rounded font-mono">
                {getCategoryTranslation(inspection.product?.category, language)}
              </span>
            </div>

            {/* Side tabs */}
            <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
              {['front', 'back', 'side'].map((side) => (
                <button key={side} onClick={() => setInspectingSide(side)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap cursor-pointer ${
                    inspectingSide === side
                      ? 'bg-accent text-on-accent border-accent'
                      : 'bg-surface-elevated text-fg-muted border-transparent hover:bg-surface'
                  }`}>
                  {side === 'front' ? t.frontPanelPdp : side === 'back' ? t.backLabel : t.sideViews}
                </button>
              ))}
            </div>

            <div className="relative aspect-square bg-surface-recessed flex items-center justify-center mx-4 mb-4 rounded-xl overflow-hidden border border-divider/40">
              {displayImage ? (
                <img src={displayImage} alt="Captured Package" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center text-fg-muted p-4 text-center">
                  <Scan className="w-16 h-16 mb-3 stroke-1 opacity-30 text-accent" />
                  <span className="text-fg font-bold">{inspection.product?.name || 'Packaged Commodity'}</span>
                  <p className="text-[10px] text-fg-muted mt-1">AI bounding boxes map verified declarations</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Rule Tally, Declarations & Rule Verdicts (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Rule tally hero */}
          <section className="bg-surface rounded-2xl p-6 border border-divider/60 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fg-muted uppercase tracking-wider">
                {language === 'hi' ? 'वैधानिक मूल्यांकन सारांश' : language === 'kn' ? 'ಶಾಸನಬದ್ಧ ಮೌಲ್ಯಮಾಪನ ಸಾರಾಂಶ' : 'Statutory Evaluation Summary'}
              </span>
              <ShieldCheck className="w-5 h-5 text-accent" />
            </div>
            <div className="font-display text-[36px] leading-tight font-bold text-fg mt-2">
              {failed}<span className="text-[18px] font-medium text-fg-muted ml-1.5">
                {language === 'hi' ? `में से ${total} नियम असफल` : language === 'kn' ? `ರಲ್ಲಿ ${total} ನಿಯಮಗಳು ವಿಫಲವಾಗಿವೆ` : `of ${total} rules failed`}
              </span>
            </div>
            {failed > 0 ? (
              <p className="text-[13px] text-error font-medium mt-1">
                {inspection.compliance_results?.filter((r: any) => r.status === 'FAIL')
                  .map((r: any) => r.details).join(' · ')}
              </p>
            ) : (
              <p className="text-[13px] text-success font-medium mt-1">
                {language === 'hi' ? 'सभी वैधानिक विधिक मापविज्ञान घोषणाएं सत्यापित और अनुपालन में हैं।' :
                 language === 'kn' ? 'ಎಲ್ಲಾ ಶಾಸನಬದ್ಧ ಕಾನೂನು ಮಾಪನಶಾಸ್ತ್ರ ಘೋಷಣೆಗಳು ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿವೆ ಮತ್ತು ಅನುಸರಣೆಯಲ್ಲಿವೆ.' :
                 'All statutory Legal Metrology declarations verified and compliant.'}
              </p>
            )}
          </section>

          {/* Declarations table */}
          <section className="flex flex-col gap-3">
            <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold font-body">
              {t.statutoryRequirement}
            </span>
            <div className="flex flex-col gap-2">
              {inspection.declarations?.map((decl: any) => {
                const isEditing = editingField === decl.field_name;
                return (
                  <div key={decl.field_name || decl.id} className="bg-surface rounded-2xl p-4 flex items-center gap-3 border border-divider/60">
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] font-semibold text-fg capitalize block truncate">
                        {getDeclarationFieldTranslation(decl.field_name, language)}
                      </span>
                      {isEditing ? (
                        <div className="flex gap-2 mt-1">
                          <input value={editValue} onChange={e => setEditValue(e.target.value)}
                            className="flex-1 bg-surface-recessed border border-divider rounded-lg px-2.5 py-1 text-sm text-fg outline-none focus:border-accent font-body" />
                          <button onClick={() => handleSaveEdit(decl.field_name)}
                            className="text-accent p-1 cursor-pointer"><Save className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <span className="text-[13px] text-fg-muted block truncate">{decl.value || (language === 'hi' ? 'नहीं मिला' : language === 'kn' ? 'ಪತ್ತೆಯಾಗಿಲ್ಲ' : 'Not detected')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {decl.confidence && (
                        <span className="text-[10px] text-fg-muted font-mono">{Math.round(decl.confidence * 100)}%</span>
                      )}
                      {!isEditing && (
                        <button onClick={() => { setEditingField(decl.field_name); setEditValue(decl.value || ''); }}
                          className="text-fg-muted hover:text-fg p-1 cursor-pointer" title="Manual Override"><Edit3 className="w-3.5 h-3.5" /></button>
                      )}
                      {decl.status === 'VALIDATED' || decl.status === 'OFFICER_CONFIRMED' ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : decl.status === 'POTENTIAL_VIOLATION' ? (
                        <AlertCircle className="w-4 h-4 text-error" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Compliance rule results */}
          <section className="flex flex-col gap-3">
            <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold font-body">
              {t.ruleVerdicts}
            </span>
            <div className="flex flex-col gap-2">
              {inspection.compliance_results?.map((rule: any, idx: number) => {
                const ruleStatusColor = rule.status === 'PASS' ? 'text-success' : rule.status === 'FAIL' ? 'text-error font-bold' : 'text-warning';
                const ruleStatusLabel = getStatusTranslation(rule.status, language);
                return (
                  <div key={rule.rule_id || idx} className="bg-surface rounded-2xl p-4 flex items-center gap-3 border border-divider/60">
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="text-[14px] font-semibold text-fg truncate">
                        {rule.rule_id} · {getDeclarationFieldTranslation(rule.field || '', language)}
                      </span>

                      <span className="text-[13px] text-fg-muted truncate">{rule.details}</span>
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-[0.02em] bg-transparent border border-divider ${ruleStatusColor}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />{ruleStatusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Actions */}
          <section className="flex gap-3 pb-4">
            <button 
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Legal Metrology Report - #${inspection.id}</title>
                      <style>
                        body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
                        h1 { margin-bottom: 2px; font-size: 24px; }
                        .tag { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; background: #fee2e2; color: #b91c1c; margin-bottom: 24px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                        th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 13px; }
                        th { background: #f9fafb; font-weight: 600; }
                        .pass { color: #15803d; font-weight: bold; }
                        .fail { color: #b91c1c; font-weight: bold; }
                        .footer { margin-top: 40px; font-size: 11px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }
                      </style>
                    </head>
                    <body>
                      <h1>PaarakhMetric Statutory Inspection Report</h1>
                      <div class="tag">RECORD ID: #${inspection.id} · STATUS: ${inspection.status}</div>
                      <p><strong>Packaged Commodity:</strong> ${inspection.product?.name || 'Packaged Commodity'}</p>
                      <p><strong>Category / Site:</strong> ${inspection.product?.category || 'General'} · ${inspection.location || 'Depot'}</p>
                      <p><strong>Officer In Charge:</strong> ${inspection.officer || 'Officer Shrey'}</p>

                      <h3>1. Statutory Declarations Audit (Rule 6)</h3>
                      <table>
                        <tr><th>Declaration Field</th><th>Detected Value</th><th>Status</th></tr>
                        ${(inspection.declarations || []).map((d: any) => `
                          <tr>
                            <td style="text-transform: capitalize;">${(d.field_name || '').replace(/_/g, ' ')}</td>
                            <td>${d.value || 'Not Detected'}</td>
                            <td>${d.status}</td>
                          </tr>
                        `).join('')}
                      </table>

                      <h3>2. Compliance Rule Matrix Verification</h3>
                      <table>
                        <tr><th>Rule ID</th><th>Requirement</th><th>Verdict</th></tr>
                        ${(inspection.compliance_results || []).map((r: any) => `
                          <tr>
                            <td><strong>${r.rule_id}</strong></td>
                            <td>${r.details || ''}</td>
                            <td class="${r.status === 'PASS' ? 'pass' : 'fail'}">${r.status}</td>
                          </tr>
                        `).join('')}
                      </table>

                      <div class="footer">
                        Generated by PaarakhMetric AI Compliance Assistant · Legal Metrology Department
                      </div>
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.focus();
                  setTimeout(() => printWindow.print(), 300);
                } else {
                  window.open(`/api/inspections/${inspection.id}/pdf-report`, '_blank');
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-accent text-on-accent rounded-full p-4 text-[15px] font-bold active:scale-95 transition-transform shadow-lg shadow-accent/20 cursor-pointer"
            >
              <Download className="w-5 h-5" /> Generate PDF Inspection Report
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
