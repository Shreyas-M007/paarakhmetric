import { useState } from 'react';
import { Search, ShieldCheck, Camera, UploadCloud, BookOpen, Globe, ChevronDown } from 'lucide-react';
import StatGrid from '../components/StatGrid';
import FilterBar from '../components/FilterBar';
import InspectionList, { Inspection } from '../components/InspectionList';
import MapHero from '../components/MapHero';
import RulesModal from '../components/RulesModal';
import { Language, translations } from '../i18n';

interface DashboardScreenProps {
  stats: any;
  inspections: Inspection[];
  onRowClick: (id: string) => void;
  filterOption: string;
  setFilterOption: (opt: string) => void;
  onSearchClick?: () => void;
  onStartScan?: () => void;
  onBatchUploadClick?: () => void;
  language?: Language;
  setLanguage?: (lang: Language) => void;
}

const languages: Array<{ code: Language; symbol: string; label: string; sub: string }> = [
  { code: 'en', symbol: 'A', label: 'English', sub: 'English' },
  { code: 'hi', symbol: 'अ', label: 'हिन्दी', sub: 'Hindi' },
  { code: 'kn', symbol: 'ಅ', label: 'ಕನ್ನಡ', sub: 'Kannada' },
  { code: 'ta', symbol: 'அ', label: 'தமிழ்', sub: 'Tamil' },
  { code: 'te', symbol: 'అ', label: 'తెలుగు', sub: 'Telugu' },
  { code: 'mr', symbol: 'म', label: 'मराठी', sub: 'Marathi' },
  { code: 'bn', symbol: 'অ', label: 'বাংলা', sub: 'Bengali' },
];

const langSymbolMap: Record<Language, string> = {
  en: 'A',
  hi: 'अ',
  kn: 'ಅ',
  ta: 'அ',
  te: 'అ',
  mr: 'म',
  bn: 'অ'
};

export default function DashboardScreen({
  stats,
  inspections,
  onRowClick,
  filterOption,
  setFilterOption,
  onSearchClick,
  onStartScan,
  onBatchUploadClick,
  language = 'en',
  setLanguage
}: DashboardScreenProps) {
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const t = translations[language] || translations.en;

  const filterOptions = [
    { id: 'ALL', label: t.all || 'All' },
    { id: 'FLAGGED', label: t.violationsFound || 'Flagged' },
    { id: 'COMPLIANT', label: t.compliant || 'Compliant' },
    { id: 'THIS_WEEK', label: language === 'hi' ? 'इस सप्ताह' : language === 'kn' ? 'ಈ ವಾರ' : 'This week' },
  ];

  const compliant = stats.compliant || 0;
  const nonCompliant = stats.nonCompliant || 0;
  const review = stats.review || 0;

  // Filter list based on selected chip
  const filteredInspections = inspections.filter(item => {
    if (filterOption === 'FLAGGED') return item.status === 'NON_COMPLIANT' || item.status === 'REVIEW';
    if (filterOption === 'COMPLIANT') return item.status === 'COMPLIANT';
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header with Title and Quick Actions (Search + Language Toggle) */}
      <section className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-9 h-9 text-accent flex-shrink-0" />
          <div className="flex flex-col">
            <h1 className="font-display text-[26px] sm:text-[28px] leading-[32px] font-bold tracking-tight m-0">{t.appName}</h1>
            <span className="text-[12px] font-semibold text-fg-muted uppercase tracking-wider">{t.appSubtitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dashboard Language Switcher Toggle */}
          <div className="relative">
            <button 
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-divider text-fg text-xs font-bold transition-all hover:bg-surface-elevated active:scale-95 shadow-sm"
              title="Change Language / भाषा बदलें"
            >
              <Globe className="w-4 h-4 text-accent" />
              <span className="w-5 h-5 rounded-md bg-accent text-on-accent flex items-center justify-center text-xs font-bold font-display">
                {langSymbolMap[language] || 'A'}
              </span>
              <span className="hidden sm:inline text-xs font-semibold">{languages.find(l => l.code === language)?.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-fg-muted" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-surface-elevated rounded-xl border border-divider py-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-fg-muted tracking-wider border-b border-divider/50">
                  Select Language / भाषा चुनें
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (setLanguage) setLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                      language === lang.code ? 'bg-accent/15 text-accent font-bold' : 'text-fg-muted hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-surface border border-divider/40 flex items-center justify-center font-bold text-fg text-xs font-display">
                        {lang.symbol}
                      </span>
                      <div>
                        <div className="text-fg font-semibold">{lang.label}</div>
                        <div className="text-[10px] text-fg-muted">{lang.sub}</div>
                      </div>
                    </div>
                    {language === lang.code && (
                      <span className="w-2 h-2 rounded-full bg-accent"></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={onSearchClick}
            className="w-10 h-10 rounded-xl bg-surface border border-divider text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95"
            title={t.searchInspectionLog || "Search Inspections"}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Desktop / Laptop Responsive Multi-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Actions, Map Hero & Stat Grid (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Quick Action Bar (Scan, Batch, Rules) */}
          <section className="grid grid-cols-3 gap-2.5">
            <button
              onClick={onStartScan}
              className="bg-accent text-on-accent p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold text-xs active:scale-95 transition-transform shadow-lg shadow-accent/20 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span className="text-center">{t.scanProduct || "New Scan"}</span>
            </button>

            <button
              onClick={onBatchUploadClick}
              className="bg-surface-elevated text-fg border border-divider/80 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold text-xs active:scale-95 transition-transform hover:bg-surface cursor-pointer"
            >
              <UploadCloud className="w-5 h-5 text-accent" />
              <span className="text-center">{t.batchUpload || "Batch Ingest"}</span>
            </button>

            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="bg-surface-elevated text-fg border border-divider/80 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold text-xs active:scale-95 transition-transform hover:bg-surface cursor-pointer"
            >
              <BookOpen className="w-5 h-5 text-accent" />
              <span className="text-center">{t.rulesBrowser || "LMPC Rules"}</span>
            </button>
          </section>

          {/* Map / Sweep Hero */}
          <MapHero 
            metricValue={compliant.toString()}
            metricSub={language === 'hi' ? `${nonCompliant} इस सप्ताह गैर-अनुपालन ध्वजांकित` : language === 'kn' ? `${nonCompliant} ಈ ವಾರ ನಿಯಮ ಉಲ್ಲಂಘನೆ ಗುರುತಿಸಲಾಗಿದೆ` : `${nonCompliant} flagged non-compliant across sites this week`}
            legendLabel={language === 'hi' ? "आज का ऑडिट स्वीप" : language === 'kn' ? "ಇಂದಿನ ತಪಾಸಣೆ ಸಾರಾಂಶ" : "Today's audit sweep"}
            legendPass={compliant}
            legendFail={nonCompliant}
            legendReview={review}
          />

          {/* Stat Grid */}
          <StatGrid 
            columns={3}
            items={[
              { id: 'compliant', label: t.compliant, value: compliant, variant: 'pass' },
              { id: 'non-compliant', label: t.violationsFound, value: nonCompliant, variant: 'fail' },
              { id: 'review', label: t.needsReview, value: review, variant: 'review' }
            ]} 
          />
        </div>

        {/* Right Column: Filter Bar & Recent Inspections Ledger (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-surface rounded-2xl p-5 border border-divider/60 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-lg text-fg">
                {filterOption === 'FLAGGED' ? t.violationsFound : filterOption === 'COMPLIANT' ? t.compliant : (language === 'hi' ? 'हालिया निरीक्षण लेज़र' : language === 'kn' ? 'ಇತ್ತೀಚಿನ ತಪಾಸಣೆಗಳ ಲೆಡ್ಜರ್' : 'Recent Inspections Ledger')}
              </span>
              <span className="text-xs text-fg-muted font-mono font-medium">{filteredInspections.length} {t.recordsFound || "records"}</span>
            </div>

            {/* Filter Bar */}
            <FilterBar 
              options={filterOptions}
              selectedId={filterOption}
              onSelect={setFilterOption}
            />

            {/* Recent Inspections List */}
            <InspectionList 
              title=""
              inspections={filteredInspections.slice(0, 8)} 
              onRowClick={onRowClick} 
            />
          </div>
        </div>
      </div>

      {/* Rules and Pack Size Calculator Modal */}
      <RulesModal 
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        language={language}
      />
    </div>
  );
}
