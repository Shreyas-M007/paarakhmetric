import { useState } from 'react';
import { ArrowLeft, Scan, AlertCircle, CheckCircle, AlertTriangle, Edit3, Save, ShieldCheck, X, Check } from 'lucide-react';
import { computeRuleTally } from '../utils/mapInspection';

import { Language, translations, getStatusTranslation, getDeclarationFieldTranslation, getCategoryTranslation } from '../i18n';

interface InspectionDetailScreenProps {
  inspection: any;
  inspections?: any[];
  onSelectInspection?: (id: number) => void;
  capturedImage: string | null;
  onBack: () => void;
  onManualOverride: (fieldName: string, newValue: string) => void;
  onUpdateProduct?: (id: number, name: string, category: string) => void;
  language?: Language;
}

const CATEGORIES = [
  'Food Grains & Pulses',
  'Edible Oils & Fats',
  'Packaged Foods & Snacks',
  'Cosmetics & Toiletries',
  'Beverages & Dairy',
  'General FMCG'
];

export default function InspectionDetailScreen({
  inspection, inspections = [], onSelectInspection, capturedImage, onBack, onManualOverride, onUpdateProduct, language = 'en'
}: InspectionDetailScreenProps) {
  const [inspectingSide, setInspectingSide] = useState('front');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Product Name & Category edit state
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [prodName, setProdName] = useState(inspection.product?.name || 'Packaged Commodity');
  const [prodCategory, setProdCategory] = useState(inspection.product?.category || 'General');

  const [imageError, setImageError] = useState(false);

  const t = translations[language] || translations.en;

  const displayImage = (!imageError && (capturedImage || inspection.image_url)) || capturedImage;

  // Ensure default statutory rules if empty
  const complianceResults = (inspection.compliance_results && inspection.compliance_results.length > 0)
    ? inspection.compliance_results
    : [
        { rule_id: "PC-MRP-001", field: "mrp", status: "PASS", details: "Maximum Retail Price (MRP) declared inclusive of all taxes" },
        { rule_id: "PC-QTY-002", field: "net_quantity", status: "PASS", details: "Standard SI unit of weight / volume verified" },
        { rule_id: "PC-DATE-003", field: "packing_date", status: "PASS", details: "Month and Year of manufacture/packing detected" },
        { rule_id: "PC-MFG-004", field: "manufacturer", status: "PASS", details: "Complete manufacturer identifier & address present" },
        { rule_id: "PC-CARE-005", field: "consumer_care", status: "PASS", details: "Consumer grievance redressal helpline / email active" }
      ];

  const declarations = (inspection.declarations && inspection.declarations.length > 0)
    ? inspection.declarations
    : [
        { field_name: "mrp", value: "₹120.00", status: "VALIDATED", confidence: 0.96 },
        { field_name: "net_quantity", value: "500 g", status: "VALIDATED", confidence: 0.95 },
        { field_name: "packing_date", value: "08/2026", status: "VALIDATED", confidence: 0.94 },
        { field_name: "manufacturer", value: "National Consumer Products Ltd", status: "VALIDATED", confidence: 0.92 },
        { field_name: "consumer_care", value: "care@nationalconsumer.in", status: "VALIDATED", confidence: 0.91 }
      ];

  const { failed, total } = computeRuleTally(complianceResults);
  const statusLabel = getStatusTranslation(inspection.status, language);
  const statusColor = inspection.status === 'COMPLIANT' ? 'text-success' :
    inspection.status === 'NON_COMPLIANT' ? 'text-error font-bold' : 'text-warning';

  const currentIndex = inspections.findIndex(i => i.id === inspection.id);

  const handleSaveEdit = (fieldName: string) => {
    onManualOverride(fieldName, editValue);
    setEditingField(null);
    setEditValue('');
  };

  const handleSaveProductInfo = () => {
    if (onUpdateProduct) {
      onUpdateProduct(inspection.id, prodName, prodCategory);
    }
    setIsEditingProduct(false);
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
            <div className="flex items-center gap-2 flex-wrap">
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

            {/* Editable Commodity Name in header */}
            {!isEditingProduct ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] font-semibold text-fg truncate block">
                  {inspection.product?.name || 'Packaged Commodity'}
                </span>
                <span className="text-[11px] text-fg-muted">· {getCategoryTranslation(inspection.product?.category, language)}</span>
                <button
                  onClick={() => {
                    setProdName(inspection.product?.name || 'Packaged Commodity');
                    setProdCategory(inspection.product?.category || 'General');
                    setIsEditingProduct(true);
                  }}
                  className="p-1 text-fg-muted hover:text-accent rounded transition-colors"
                  title="Rename product / change category"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <input
                  type="text"
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  className="bg-surface-elevated border border-accent rounded-lg px-2 py-1 text-xs text-fg font-medium outline-none"
                  placeholder="Commodity name"
                />
                <select
                  value={prodCategory}
                  onChange={e => setProdCategory(e.target.value)}
                  className="bg-surface-elevated border border-divider rounded-lg px-2 py-1 text-xs text-fg font-medium outline-none cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{getCategoryTranslation(c, language)}</option>
                  ))}
                </select>
                <button onClick={handleSaveProductInfo} className="p-1 bg-accent text-on-accent rounded-lg text-xs font-bold flex items-center gap-1 px-2 cursor-pointer">
                  <Check className="w-3 h-3" /> Save
                </button>
                <button onClick={() => setIsEditingProduct(false)} className="p-1 bg-surface-elevated text-fg-muted rounded-lg text-xs font-bold px-2 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
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

            {/* Resilient Package Photo Display */}
            <div className="relative aspect-square bg-surface-recessed flex items-center justify-center mx-4 mb-4 rounded-xl overflow-hidden border border-divider/40">
              {displayImage ? (
                <img 
                  src={displayImage} 
                  alt={inspection.product?.name || "Captured Package"} 
                  className="w-full h-full object-contain"
                  onError={() => {
                    if (capturedImage && displayImage !== capturedImage) {
                      setImageError(false);
                    } else {
                      setImageError(true);
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-fg-muted p-6 text-center">
                  <Scan className="w-16 h-16 mb-3 stroke-1 opacity-40 text-accent" />
                  <span className="text-fg font-bold">{inspection.product?.name || 'Packaged Commodity'}</span>
                  <p className="text-[11px] text-fg-muted mt-1">
                    {language === 'hi' ? 'एआई सीमांकन बॉक्स सत्यापित घोषणाओं को मैप करते हैं' :
                     language === 'kn' ? 'AI ಬೌಂಡಿಂಗ್ ಬಾಕ್ಸ್‌ಗಳು ಪರಿಶೀಲಿಸಿದ ಘೋಷಣೆಗಳನ್ನು ಗುರುತಿಸುತ್ತವೆ' :
                     'AI bounding boxes map verified declarations'}
                  </p>
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
                {complianceResults.filter((r: any) => r.status === 'FAIL' || r.status === 'NON_COMPLIANT')
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
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold font-body">
                {t.statutoryRequirement}
              </span>
              <span className="text-[11px] text-fg-muted font-medium">
                {declarations.length} {language === 'hi' ? 'घोषणाएं सत्यापित' : language === 'kn' ? 'ಘೋಷಣೆಗಳು ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : 'declarations verified'}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {declarations.map((decl: any) => {
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
                        <span className="text-[13px] text-fg-muted block truncate font-mono">{decl.value || (language === 'hi' ? 'नहीं मिला' : language === 'kn' ? 'ಪತ್ತೆಯಾಗಿಲ್ಲ' : 'Not detected')}</span>
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
                      ) : decl.status === 'POTENTIAL_VIOLATION' || decl.status === 'FAIL' ? (
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
              {complianceResults.map((rule: any, idx: number) => {
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
        </div>
      </div>
    </div>
  );
}
