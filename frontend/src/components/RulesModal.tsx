import { useState } from 'react';
import { X, BookOpen, Scale, Search, ShieldCheck } from 'lucide-react';
import { Language } from '../i18n';


interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

const STATUTORY_RULES = [
  {
    id: "Rule 6(1)(a)",
    name: "Name & Address of Manufacturer / Packer / Importer",
    desc: "Every package shall bear the name and complete address of the manufacturer, or where manufacturer is not the packer, the name and address of the manufacturer and packer.",
    penalty: "Section 36(1) fine up to ₹25,000 for first offence."
  },
  {
    id: "Rule 6(1)(b)",
    name: "Generic / Common Name of Commodity",
    desc: "The generic or common name of the commodity contained in the package must be prominently declared on the Principal Display Panel (PDP).",
    penalty: "Rule 6 violation; compoundable penalty."
  },
  {
    id: "Rule 6(1)(c)",
    name: "Net Quantity Declaration in Standard SI Units",
    desc: "Net quantity in terms of standard unit of weight (kg, g, mg), measure (l, ml) or number shall be declared. Non-standard units (like 'gms', 'kilos', '5kg non-std') are non-compliant.",
    penalty: "Rule 12 & Rule 24 compliance check."
  },
  {
    id: "Rule 6(1)(d)",
    name: "Month and Year of Manufacture / Packing / Import",
    desc: "The month and year in which the commodity is manufactured or pre-packed or imported shall be declared (e.g. '08/2026' or 'Aug 2026').",
    penalty: "Rule 6(1)(d) violation."
  },
  {
    id: "Rule 6(1)(e)",
    name: "Maximum Retail Price (MRP) with All Taxes",
    desc: "MRP must be clearly declared as 'MRP Rs. XX.XX (inclusive of all taxes)' or 'Maximum Retail Price ₹XX.XX (incl. of all taxes)'. No rounding up or dual MRP allowed.",
    penalty: "Prosecution under Section 36 for charging above MRP."
  },
  {
    id: "Rule 6(1)(n)",
    name: "Consumer Grievance Redressal Helpline & Email",
    desc: "Name, address, telephone number and email address of the person or office who can be contacted by the consumer in case of complaints.",
    penalty: "Mandatory declaration under LMPC Amendment Rules."
  },
  {
    id: "Rule 7",
    name: "Principal Display Panel (PDP) Dimensions & Area",
    desc: "The area of the PDP shall not be less than 40% of height × width for rectangular packages, or 40% of height × circumference for cylindrical containers.",
    penalty: "Rule 7 clearance mandate."
  },
  {
    id: "Rule 8 & 9",
    name: "Minimum Font Height & Numeral Clearances",
    desc: "Minimum numeral font height: Net Qty <= 50g: 1.5mm; 50g-200g: 2.0mm; 200g-1kg: 4.0mm; > 1kg: 6.0mm. Free space clearance must be maintained.",
    penalty: "Rule 8 statutory font size standards."
  },
  {
    id: "Rule 12 (Sched II)",
    name: "Standard Pack Sizes Schedule",
    desc: "Commodities specified in Second Schedule (e.g. Baby food, biscuits, bread, cereals, coffee, edible oil, rice, salt, tea, wheat flour) must only be packed in prescribed quantities (e.g. 50g, 100g, 200g, 500g, 1kg, 2kg, 5kg).",
    penalty: "Prohibited from non-standard packaging."
  }
];

const STANDARD_PACK_SCHEDULE: Record<string, string[]> = {
  "Food Grains, Rice & Wheat Flour": ["100g", "200g", "500g", "1kg", "2kg", "5kg", "10kg", "20kg", "50kg"],
  "Edible Oils, Vanaspati & Ghee": ["50ml", "100ml", "200ml", "500ml", "1 L", "2 L", "3 L", "5 L", "15 L"],
  "Biscuits & Cookies": ["25g", "50g", "75g", "100g", "150g", "200g", "250g", "300g", "500g"],
  "Tea & Coffee": ["25g", "50g", "100g", "250g", "500g", "1kg"],
  "Baby Foods & Milk Powders": ["200g", "400g", "500g", "1kg"]
};

export default function RulesModal({ isOpen, onClose, language = 'en' }: RulesModalProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'schedule' | 'calculator'>('rules');
  const [search, setSearch] = useState('');
  
  // Calculator state
  const [calcQty, setCalcQty] = useState('');
  const [calcUnit, setCalcUnit] = useState('g');

  if (!isOpen) return null;


  const filteredRules = STATUTORY_RULES.filter(r => 
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.desc.toLowerCase().includes(search.toLowerCase())
  );

  // Font height calculation according to Rule 8
  const getMinFontHeight = (qtyNum: number, unit: string) => {
    let grams = qtyNum;
    if (unit === 'kg' || unit === 'L') grams = qtyNum * 1000;
    if (unit === 'mg' || unit === 'ml') grams = qtyNum / 1000;

    if (grams <= 50) return { height: '1.5 mm', pdpHeight: '1.0 mm' };
    if (grams <= 200) return { height: '2.0 mm', pdpHeight: '1.5 mm' };
    if (grams <= 1000) return { height: '4.0 mm', pdpHeight: '2.0 mm' };
    return { height: '6.0 mm', pdpHeight: '3.0 mm' };
  };

  const calcFont = getMinFontHeight(parseFloat(calcQty) || 100, calcUnit);

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-divider rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider bg-surface-elevated">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-fg m-0 font-display">
              {language === 'hi' ? 'वैधानिक नियम पुस्तिका और मानक पैक आकार' : language === 'kn' ? 'ಶಾಸನಬದ್ಧ ನಿಯಮಗಳ ಪುಸ್ತಕ ಮತ್ತು ಪ್ಯಾಕ್ ಗಾತ್ರ' : 'Legal Metrology (LMPC) Rules Explorer'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface text-fg-muted hover:text-fg flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-divider px-6 bg-surface">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'rules' ? 'border-accent text-accent' : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            {language === 'hi' ? 'वैधानिक नियम (17 नियम)' : language === 'kn' ? 'ಶಾಸನಬದ್ಧ ನಿಯಮಗಳು' : 'Statutory Rules (17 Rules)'}
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'schedule' ? 'border-accent text-accent' : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            {language === 'hi' ? 'मानक पैक आकार (अनुसूची II)' : language === 'kn' ? 'ಪ್ರಮಾಣಿತ ಪ್ಯಾಕ್ ಗಾತ್ರ' : 'Standard Pack Sizes (Sched II)'}
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'calculator' ? 'border-accent text-accent' : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            {language === 'hi' ? 'फ़ॉन्ट आकार और पीडीपी कैलकुलेटर' : language === 'kn' ? 'ಫಾಂಟ್ ಗಾತ್ರ ಕ್ಯಾಲ್ಕುಲೇಟರ್' : 'Font & PDP Calculator (Rule 8)'}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {activeTab === 'rules' && (
            <>
              {/* Search filter */}
              <div className="flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2 border border-divider">
                <Search className="w-4 h-4 text-accent flex-shrink-0" />
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={language === 'hi' ? 'नियम खोजें (उदा. MRP, शुद्ध मात्रा, फ़ॉन्ट)...' : 'Search rules (e.g. MRP, Net Qty, Font)...'} 
                  className="bg-transparent border-none text-xs text-fg outline-none flex-1 font-body"
                />
              </div>

              <div className="flex flex-col gap-3">
                {filteredRules.map((rule) => (
                  <div key={rule.id} className="bg-surface-elevated p-4 rounded-xl border border-divider/60 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-accent font-mono">{rule.id}</span>
                      <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Mandatory
                      </span>
                    </div>
                    <div className="text-sm font-bold text-fg">{rule.name}</div>
                    <div className="text-xs text-fg-muted leading-relaxed">{rule.desc}</div>
                    <div className="text-[11px] text-error font-medium bg-error/10 px-2.5 py-1 rounded-md mt-1">
                      ⚠️ {rule.penalty}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'schedule' && (
            <div className="flex flex-col gap-4">
              <div className="bg-accent/10 border border-accent/30 p-3 rounded-xl text-xs text-accent font-medium leading-relaxed">
                ℹ️ Under Legal Metrology Rule 12, commodities listed in Schedule II must only be packed in standard specified sizes. Non-standard pack sizes are statutory violations.
              </div>

              {Object.entries(STANDARD_PACK_SCHEDULE).map(([category, sizes]) => (
                <div key={category} className="bg-surface-elevated p-4 rounded-xl border border-divider/60 flex flex-col gap-2">
                  <div className="text-sm font-bold text-fg flex items-center gap-2">
                    <Scale className="w-4 h-4 text-accent" /> {category}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sizes.map(size => (
                      <span key={size} className="px-2.5 py-1 rounded-md bg-surface border border-divider text-xs font-mono text-fg font-semibold">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="flex flex-col gap-5">
              <div className="bg-surface-elevated p-4 rounded-xl border border-divider flex flex-col gap-3">
                <span className="text-xs font-bold text-fg uppercase tracking-wider">Rule 8 Minimum Numeral Font Height Calculator</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-fg-muted block mb-1">Declared Net Quantity Value</label>
                    <input 
                      type="number"
                      value={calcQty}
                      onChange={e => setCalcQty(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full bg-surface border border-divider rounded-lg px-3 py-2 text-sm text-fg outline-none focus:border-accent font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-fg-muted block mb-1">Unit of Measure</label>
                    <select 
                      value={calcUnit}
                      onChange={e => setCalcUnit(e.target.value)}
                      className="w-full bg-surface border border-divider rounded-lg px-3 py-2 text-sm text-fg outline-none focus:border-accent font-body"
                    >
                      <option value="g">Grams (g)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="ml">Millilitres (ml)</option>
                      <option value="L">Litres (L)</option>
                      <option value="mg">Milligrams (mg)</option>
                    </select>
                  </div>
                </div>

                {/* Calculation Verdict */}
                <div className="bg-surface p-4 rounded-xl border border-divider flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-fg-muted">Statutory Minimum Numeral Height:</span>
                    <span className="text-base font-bold text-accent font-mono">{calcFont.height}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-fg-muted">Letters & Other Declarations Height:</span>
                    <span className="text-sm font-semibold text-fg font-mono">{calcFont.pdpHeight}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-divider bg-surface-elevated flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-accent text-on-accent text-xs font-bold active:scale-95 transition-transform"
          >
            {language === 'hi' ? 'बंद करें' : language === 'kn' ? 'ಮುಚ್ಚಿ' : 'Close Explorer'}
          </button>
        </div>
      </div>
    </div>
  );
}
