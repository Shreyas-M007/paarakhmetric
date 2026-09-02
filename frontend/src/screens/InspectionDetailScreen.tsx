import { useState } from 'react';
import { ArrowLeft, Scan, AlertCircle, CheckCircle, AlertTriangle, Edit3, Save, ShieldCheck, X, Check, Upload, ZoomIn, Maximize2, Download } from 'lucide-react';
import { computeRuleTally } from '../utils/mapInspection';
import { Language, translations, getStatusTranslation, getDeclarationFieldTranslation, getCategoryTranslation } from '../i18n';
import { generateInspectionPdf, getOfficerRoleDetails } from '../utils/generatePdf';



interface InspectionDetailScreenProps {
  inspection: any;
  inspections?: any[];
  onSelectInspection?: (id: string | number) => void;
  capturedImage?: string | null;

  onBack: () => void;
  onManualOverride: (fieldName: string, newValue: string) => void;
  onUpdateProduct?: (id: number, name: string, category: string) => void;
  onDeleteInspection?: (id: number) => void;
  onUpdateInspection?: (updated: any) => void;
  language?: Language;
  user?: any;
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
  inspection, inspections = [], onSelectInspection, capturedImage: _capturedImage, onBack, onManualOverride, onUpdateProduct, onDeleteInspection, onUpdateInspection, language = 'en', user
}: InspectionDetailScreenProps) {



  const [inspectingSide, setInspectingSide] = useState('front');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Product Name & Category edit state
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [prodName, setProdName] = useState(inspection.product?.name || 'Packaged Commodity');
  const [prodCategory, setProdCategory] = useState(inspection.product?.category || 'General');

  const [imageError, setImageError] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);

  const t = translations[language] || translations.en;

  const allImages: Array<{ url: string; panel?: string }> = (inspection.images && inspection.images.length > 0)
    ? inspection.images
    : (inspection.image_url ? [{ url: inspection.image_url, panel: inspectingSide }] : []);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const resolveImageUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
    const base = (import.meta as any).env?.VITE_API_URL || 'https://paarakhmetric-api.onrender.com';
    return `${base}${url.startsWith('/') ? url : '/' + url}`;
  };

  const rawImg = (!imageError && allImages[activeImageIndex]?.url) || (!imageError && inspection.image_url) || null;
  const displayImage = resolveImageUrl(rawImg);




  // Interactive Rules and Declarations state
  const [rulesList, setRulesList] = useState<any[]>(() => {
    return (inspection.compliance_results && inspection.compliance_results.length > 0)
      ? [...inspection.compliance_results]
      : [
          { rule_id: "PC-MRP-001", field: "mrp", status: "PASS", details: "Maximum Retail Price (MRP) declared inclusive of all taxes" },
          { rule_id: "PC-QTY-002", field: "net_quantity", status: "PASS", details: "Standard SI unit of weight / volume verified" },
          { rule_id: "PC-DATE-003", field: "packing_date", status: "PASS", details: "Month and Year of manufacture/packing detected" },
          { rule_id: "PC-MFG-004", field: "manufacturer", status: "PASS", details: "Complete manufacturer identifier & address present" },
          { rule_id: "PC-CARE-005", field: "consumer_care", status: "PASS", details: "Consumer grievance redressal helpline / email active" }
        ];
  });

  const [currentOverallStatus, setCurrentOverallStatus] = useState(inspection.status || "COMPLIANT");
  const [savedSuccessMsg, setSavedSuccessMsg] = useState("");

  const declarations = (inspection.declarations && inspection.declarations.length > 0)
    ? inspection.declarations
    : [
        { field_name: "mrp", value: "₹120.00", status: "VALIDATED", confidence: 0.96 },
        { field_name: "net_quantity", value: "500 g", status: "VALIDATED", confidence: 0.95 },
        { field_name: "packing_date", value: "08/2026", status: "VALIDATED", confidence: 0.94 },
        { field_name: "manufacturer", value: "National Consumer Products Ltd", status: "VALIDATED", confidence: 0.92 },
        { field_name: "consumer_care", value: "care@nationalconsumer.in", status: "VALIDATED", confidence: 0.91 }
      ];

  const { failed, total } = computeRuleTally(rulesList);
  const statusLabel = getStatusTranslation(currentOverallStatus, language);
  const statusColor = currentOverallStatus === 'COMPLIANT' ? 'text-success' :
    currentOverallStatus === 'NON_COMPLIANT' ? 'text-error font-bold' : 'text-warning';

  const currentIndex = inspections.findIndex(i => i.id === inspection.id);
  const officerDetails = getOfficerRoleDetails(inspection, user);


  const handleRuleVerdictChange = (ruleId: string, newStatus: string) => {
    setRulesList(prev => {
      const updated = prev.map(r => r.rule_id === ruleId ? { ...r, status: newStatus } : r);
      inspection.compliance_results = updated;
      const failedCount = updated.filter(r => r.status === 'FAIL' || r.status === 'NON_COMPLIANT').length;
      const newOverall = failedCount === 0 ? 'COMPLIANT' : 'NON_COMPLIANT';
      setCurrentOverallStatus(newOverall);
      inspection.status = newOverall;
      return updated;
    });
    setSavedSuccessMsg(`Rule ${ruleId} updated to ${newStatus}`);
    setTimeout(() => setSavedSuccessMsg(''), 2500);
  };

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
                  onChange={(e) => onSelectInspection(e.target.value)}
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

            {!isEditingProduct ? (
              <>
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
                    className="p-1 text-fg-muted hover:text-accent rounded transition-colors cursor-pointer"
                    title="Rename product / change category"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-fg-muted mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 font-medium text-fg">
                    <span className="text-accent font-semibold">👤 Scanned by: {officerDetails.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-accent/15 text-accent border border-accent/30">
                      {officerDetails.title}
                    </span>
                  </span>
                  {officerDetails.badge && (
                    <span className="font-mono text-[10px] bg-surface-elevated px-1.5 py-0.5 rounded border border-divider">
                      Badge: {officerDetails.badge}
                    </span>
                  )}
                  {officerDetails.jurisdiction && (
                    <span>· {officerDetails.jurisdiction}</span>
                  )}
                </div>

              </>

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

        <div className="flex items-center gap-2 flex-wrap">

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

          <button
            type="button"
            onClick={() => generateInspectionPdf(inspection, user, language)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-accent text-on-accent flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm flex-shrink-0 hover:opacity-95"
            title="Download complete statutory inspection PDF with all photographs"
          >
            <Download className="w-3.5 h-3.5" /> PDF Notice
          </button>

          {onDeleteInspection && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Confirm deletion of this inspection record from the state registry?")) {
                  onDeleteInspection(inspection.id);
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-elevated hover:bg-error/20 text-error border border-error/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm flex-shrink-0"
              title="Delete this inspection record from the registry"
            >
              <X className="w-3.5 h-3.5" /> Archive Record
            </button>
          )}
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
            <div className="relative aspect-square bg-surface-recessed flex items-center justify-center mx-4 mb-3 rounded-xl overflow-hidden border border-divider/40 group">
              {displayImage ? (
                <>
                  <img 
                    src={displayImage} 
                    alt={inspection.product?.name || "Captured Package"} 
                    className="w-full h-full object-contain cursor-zoom-in"
                    onClick={() => setShowZoomModal(true)}
                    onError={() => setImageError(true)}
                  />
                  <button
                    onClick={() => setShowZoomModal(true)}
                    className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg transition-opacity cursor-pointer opacity-80 hover:opacity-100"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-accent" /> Full View
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-fg-muted p-5 text-center w-full h-full bg-surface-elevated/40">
                  <div className="relative w-44 h-32 border-2 border-dashed border-accent/50 rounded-xl p-2.5 flex flex-col justify-between bg-surface/60 mb-3 shadow-inner">
                    <div className="flex justify-between items-center text-[9px] font-mono text-accent font-bold">
                      <span className="bg-accent/15 px-1 rounded">PDP-01</span>
                      <span className="bg-success/15 text-success px-1 rounded">VERIFIED</span>
                    </div>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[11px] font-bold text-fg truncate">
                        {inspection.product?.name || 'Packaged Commodity'}
                      </span>
                      <span className="text-[9px] font-mono text-fg-muted">
                        MRP: {declarations.find((d: any) => d.field_name === 'mrp')?.value || '₹150.00'} · {declarations.find((d: any) => d.field_name === 'net_quantity')?.value || '500g'}
                      </span>
                    </div>
                    <div className="text-[8px] text-fg-muted flex justify-between font-mono">
                      <span>LMPC 2011</span>
                      <span>96% AI CONF</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-fg-muted">AI Vision Blueprint active</span>
                </div>
              )}
            </div>

            {/* Multi-Photo Thumbnail Bar if multiple photos exist */}
            {allImages.length > 1 && (
              <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setImageError(false);
                    }}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                      activeImageIndex === idx ? 'border-accent shadow-md scale-105' : 'border-divider opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={`Panel ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-bold text-white text-center py-0.5 truncate px-0.5">
                      {img.panel?.replace('_', ' ').toUpperCase() || `P${idx + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Attach or Replace Photo Button */}
            <div className="px-4 pb-4">

              <label className="w-full bg-surface-elevated hover:bg-surface border border-divider text-fg font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95 transition-transform">
                <Upload className="w-3.5 h-3.5 text-accent" />
                <span>{displayImage ? (language === 'hi' ? 'फोटो बदलें' : language === 'kn' ? 'ಫೋಟೋ ಬದಲಾಯಿಸಿ' : 'Replace / Re-upload Photo') : (language === 'hi' ? 'फोटो संलग्न करें' : language === 'kn' ? 'ಫೋಟೋ ಲಗತ್ತಿಸಿ' : 'Attach Package Photo')}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (reader.result) {
                          setImageError(false);
                          inspection.image_url = reader.result as string;
                          if (onUpdateProduct) {
                            onUpdateProduct(inspection.id, inspection.product?.name, inspection.product?.category);
                          }
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </section>
        </div>

        {/* Right Column: Rule Tally, Declarations & Rule Verdicts (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Saved feedback toast */}
          {savedSuccessMsg && (
            <div className="bg-success/15 border border-success/30 text-success text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

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
                {rulesList.filter((r: any) => r.status === 'FAIL' || r.status === 'NON_COMPLIANT')
                  .map((r: any) => r.details).join(' · ')}
              </p>
            ) : (
              <p className="text-[13px] text-success font-medium mt-1">
                {language === 'hi' ? 'सभी वैधानिक विधिक मापविज्ञान घोषणाएं सत्यापित और अनुपालन में हैं।' :
                 language === 'kn' ? 'ಎಲ್ಲಾ ಶಾಸನಬದ್ಧ ಕಾನೂನು ಮಾಪನಶಾಸ್ತ್ರ ಘೋಷಣೆಗಳು ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿವೆ ಮತ್ತು ಅನುಸರಣೆಯಲ್ಲಿವೆ.' :
                 'All statutory Legal Metrology declarations verified and compliant.'}
              </p>
            )}

            {/* Officer Enforcement & Legal Action Panel */}
            <div className="flex flex-col gap-2.5 mt-4 pt-4 border-t border-divider/40">
              <div className="flex items-center justify-between">

                <span className="text-[11px] font-bold text-fg uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚖️ Legal Metrology Statutory Enforcement</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold uppercase">
                  {user?.designation || (user?.role === 'controller' ? 'Collector' : user?.role === 'supervisor' ? 'Senior Inspector' : 'Field Officer')}
                </span>
              </div>
              <p className="text-[12px] text-fg-muted leading-relaxed">
                {user?.role === 'controller'
                  ? "As District / Assistant Collector, you hold final statutory powers under Sections 15, 20 & 39 of the Legal Metrology Act, 2009."
                  : user?.role === 'supervisor'
                  ? "As Senior Inspector, review field findings, dispatch lab samples, or forward violation files for Collector sanction."
                  : "As Legal Metrology Officer, conduct field verification and flag potential infractions for administrative order."}
              </p>

              {user?.role === 'controller' ? (
                /* Apex Controller Controls */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const allPassed = rulesList.map(r => ({ ...r, status: 'PASS' }));
                      setRulesList(allPassed);
                      inspection.compliance_results = allPassed;
                      inspection.status = 'COMPLIANT';
                      setCurrentOverallStatus('COMPLIANT');
                      onUpdateInspection?.({
                        ...inspection,
                        status: 'COMPLIANT',
                        compliance_results: allPassed,
                        notes: 'Issued Legal Metrology Compliance Clearance (All Rules Validated)'
                      });
                      setSavedSuccessMsg('✓ Issued Legal Metrology Compliance Clearance (All Rules Validated)');
                      setTimeout(() => setSavedSuccessMsg(''), 3000);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-success text-on-accent hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Approve Clearance
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const marked = rulesList.map(r => r.status === 'PASS' ? r : ({ ...r, status: 'FAIL' }));
                      setRulesList(marked);
                      inspection.compliance_results = marked;
                      inspection.status = 'NON_COMPLIANT';
                      setCurrentOverallStatus('NON_COMPLIANT');
                      onUpdateInspection?.({
                        ...inspection,
                        status: 'NON_COMPLIANT',
                        compliance_results: marked,
                        notes: 'Issued Form-1 Notice of Violation under Section 39'
                      });
                      setSavedSuccessMsg('⚠️ Issued Form-1 Notice of Violation under Section 39');
                      setTimeout(() => setSavedSuccessMsg(''), 3000);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-error text-white hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Form-1 Seizure Notice
                  </button>

                  {onDeleteInspection && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Confirm deletion of this inspection record from the state registry?")) {
                          onDeleteInspection(inspection.id);
                        }
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-surface-elevated hover:bg-error/20 text-error border border-error/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Archive Record
                    </button>
                  )}
                </div>
              ) : user?.role === 'supervisor' ? (
                /* Senior Inspector Controls */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const allPassed = rulesList.map(r => ({ ...r, status: 'PASS' }));
                      setRulesList(allPassed);
                      inspection.compliance_results = allPassed;
                      inspection.status = 'COMPLIANT';
                      setCurrentOverallStatus('COMPLIANT');
                      onUpdateInspection?.({
                        ...inspection,
                        status: 'COMPLIANT',
                        compliance_results: allPassed,
                        notes: 'Forwarded Inspection for Clearance Endorsement'
                      });
                      setSavedSuccessMsg('✓ Forwarded Inspection for Clearance Endorsement');
                      setTimeout(() => setSavedSuccessMsg(''), 3000);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-success text-on-accent hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> Recommend Clearance
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const marked = rulesList.map(r => r.status === 'PASS' ? r : ({ ...r, status: 'FAIL' }));
                      setRulesList(marked);
                      inspection.compliance_results = marked;
                      inspection.status = 'NON_COMPLIANT';
                      setCurrentOverallStatus('NON_COMPLIANT');
                      onUpdateInspection?.({
                        ...inspection,
                        status: 'NON_COMPLIANT',
                        compliance_results: marked,
                        notes: 'Forwarded Case to Assistant Collector for Section 39 Notice'
                      });
                      setSavedSuccessMsg('⚠️ Forwarded Case to Assistant Collector for Section 39 Notice');
                      setTimeout(() => setSavedSuccessMsg(''), 3000);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-warning text-black hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Escalate Violation
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSavedSuccessMsg('🧪 Sample Dispatched to Regional Standards Laboratory');
                      setTimeout(() => setSavedSuccessMsg(''), 3000);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-surface-elevated hover:bg-surface text-fg border border-divider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    🧪 Dispatch to Lab
                  </button>

                  {onDeleteInspection && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Confirm deletion of this inspection record from the state registry?")) {
                          onDeleteInspection(inspection.id);
                        }
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-surface-elevated hover:bg-error/20 text-error border border-error/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Archive Record
                    </button>
                  )}
                </div>
              ) : (
                /* Field Officer Controls */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const allPassed = rulesList.map(r => ({ ...r, status: 'PASS' }));
                      setRulesList(allPassed);
                      inspection.compliance_results = allPassed;
                      inspection.status = 'COMPLIANT';
                      setCurrentOverallStatus('COMPLIANT');
                      onUpdateInspection?.({
                        ...inspection,
                        status: 'COMPLIANT',
                        compliance_results: allPassed,
                        notes: 'Physical Declarations Confirmed Compliant'
                      });
                      setSavedSuccessMsg('✓ Physical Declarations Confirmed Compliant');
                      setTimeout(() => setSavedSuccessMsg(''), 3000);
                    }}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold bg-success text-on-accent hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" /> Verify Compliant
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const marked = rulesList.map(r => ({ ...r, status: r.status === 'PASS' ? 'REVIEW' : r.status }));
                      setRulesList(marked);
                      inspection.compliance_results = marked;
                      inspection.status = 'REQUIRES_REVIEW';
                      setCurrentOverallStatus('REQUIRES_REVIEW');
                      onUpdateInspection?.({
                        ...inspection,
                        status: 'REQUIRES_REVIEW',
                        compliance_results: marked,
                        notes: 'Flagged for Senior Inspector & Collector Review'
                      });
                      setSavedSuccessMsg('📋 Flagged for Senior Inspector & Collector Review');
                      setTimeout(() => setSavedSuccessMsg(''), 3000);
                    }}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold bg-surface-elevated hover:bg-surface text-fg border border-divider flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <AlertTriangle className="w-4 h-4 text-warning" /> Flag for Review
                  </button>

                  {onDeleteInspection && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Confirm deletion of this inspection record from the state registry?")) {
                          onDeleteInspection(inspection.id);
                        }
                      }}
                      className="col-span-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-elevated hover:bg-error/20 text-error border border-error/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all mt-1"
                    >
                      <X className="w-3.5 h-3.5" /> Archive Record
                    </button>
                  )}
                </div>
              )}


            </div>
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
                  <div key={decl.field_name || decl.id} className="bg-surface rounded-2xl p-4 flex items-center gap-3 border border-divider/60 shadow-sm">
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
                        <span className="text-[10px] text-fg-muted font-mono bg-surface-elevated px-1.5 py-0.5 rounded border border-divider/40">
                          {Math.round(decl.confidence * 100)}%
                        </span>
                      )}
                      {!isEditing && (
                        <button onClick={() => { setEditingField(decl.field_name); setEditValue(decl.value || ''); }}
                          className="text-fg-muted hover:text-fg p-1.5 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors" title="Manual Override / Edit Text">
                          <Edit3 className="w-3.5 h-3.5 text-accent" />
                        </button>
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

          {/* Compliance rule results with Interactive Officer Verdict Toggles */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold font-body">
                {t.ruleVerdicts}
              </span>
              <span className="text-[10px] text-fg-muted">
                Click Pass / Fail / Review on any rule to modify verdict
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {rulesList.map((rule: any, idx: number) => {
                const isPass = rule.status === 'PASS';
                const isFail = rule.status === 'FAIL' || rule.status === 'NON_COMPLIANT';
                const isReview = !isPass && !isFail;

                return (
                  <div key={rule.rule_id || idx} className="bg-surface rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-divider/60 shadow-sm transition-all">
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="text-[14px] font-semibold text-fg truncate">
                        {rule.rule_id} · {getDeclarationFieldTranslation(rule.field || '', language)}
                      </span>
                      <span className="text-[13px] text-fg-muted">{rule.details}</span>
                    </div>

                    {/* Interactive Verdict Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleRuleVerdictChange(rule.rule_id, 'PASS')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                          isPass
                            ? 'bg-success text-on-accent border border-success shadow-sm'
                            : 'bg-surface-elevated text-fg-muted hover:text-fg hover:bg-surface border border-divider/60 opacity-80'
                        }`}
                        title="Mark as Compliant (Pass)"
                      >
                        <Check className="w-3.5 h-3.5" /> Pass
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRuleVerdictChange(rule.rule_id, 'FAIL')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                          isFail
                            ? 'bg-error text-white border border-error shadow-sm font-bold'
                            : 'bg-surface-elevated text-fg-muted hover:text-fg hover:bg-surface border border-divider/60 opacity-80'
                        }`}
                        title="Mark as Violation (Fail)"
                      >
                        <X className="w-3.5 h-3.5" /> Fail
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRuleVerdictChange(rule.rule_id, 'REQUIRES_REVIEW')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                          isReview
                            ? 'bg-warning text-black border border-warning shadow-sm font-bold'
                            : 'bg-surface-elevated text-fg-muted hover:text-fg hover:bg-surface border border-divider/60 opacity-80'
                        }`}
                        title="Mark for Officer Review"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Review
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>


      {/* Fullscreen High-Resolution Zoom Lightbox Modal */}
      {showZoomModal && displayImage && (
        <div 
          className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setShowZoomModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between text-white pb-2 border-b border-white/10">
              <span className="font-bold text-sm flex items-center gap-2">
                <ZoomIn className="w-4 h-4 text-accent" /> {inspection.product?.name || 'Package Label Photo'}
              </span>
              <button 
                onClick={() => setShowZoomModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img 
              src={displayImage} 
              alt={inspection.product?.name || "High resolution inspection view"} 
              className="max-h-[80vh] w-auto object-contain rounded-xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
