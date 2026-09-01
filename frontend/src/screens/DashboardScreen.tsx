import { useState } from 'react';
import { Search, ShieldCheck, Camera, UploadCloud, BookOpen } from 'lucide-react';
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
}

export default function DashboardScreen({
  stats,
  inspections,
  onRowClick,
  filterOption,
  setFilterOption,
  onSearchClick,
  onStartScan,
  onBatchUploadClick,
  language = 'en'
}: DashboardScreenProps) {
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-9 h-9 text-accent" />
          <div className="flex flex-col">
            <h1 className="font-display text-[28px] leading-[32px] font-bold tracking-tight m-0">{t.appName}</h1>
            <span className="text-[12px] font-semibold text-fg-muted uppercase tracking-wider">{t.appSubtitle}</span>
          </div>
        </div>
        <button 
          onClick={onSearchClick}
          className="w-10 h-10 rounded-md bg-surface text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95"
          title={t.searchInspectionLog || "Search Inspections"}
        >
          <Search className="w-5 h-5" />
        </button>
      </section>

      {/* Quick Action Bar (Scan, Batch, Rules) */}
      <section className="grid grid-cols-3 gap-2">
        <button
          onClick={onStartScan}
          className="bg-accent text-on-accent p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold text-xs active:scale-95 transition-transform shadow-lg shadow-accent/20"
        >
          <Camera className="w-5 h-5" />
          <span>{t.scanProduct || "New Scan"}</span>
        </button>

        <button
          onClick={onBatchUploadClick}
          className="bg-surface-elevated text-fg border border-divider/80 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold text-xs active:scale-95 transition-transform hover:bg-surface"
        >
          <UploadCloud className="w-5 h-5 text-accent" />
          <span>{t.batchUpload || "Batch Ingest"}</span>
        </button>

        <button
          onClick={() => setIsRulesModalOpen(true)}
          className="bg-surface-elevated text-fg border border-divider/80 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold text-xs active:scale-95 transition-transform hover:bg-surface"
        >
          <BookOpen className="w-5 h-5 text-accent" />
          <span>{t.rulesBrowser || "LMPC Rules"}</span>
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

      {/* Filter Bar */}
      <FilterBar 
        options={filterOptions}
        selectedId={filterOption}
        onSelect={setFilterOption}
      />

      {/* Recent Inspections List */}
      <InspectionList 
        title={filterOption === 'FLAGGED' ? t.violationsFound : filterOption === 'COMPLIANT' ? t.compliant : (language === 'hi' ? 'हालिया निरीक्षण' : language === 'kn' ? 'ಇತ್ತೀಚಿನ ತಪಾಸಣೆಗಳು' : 'Recent inspections')}
        inspections={filteredInspections.slice(0, 6)} 
        onRowClick={onRowClick} 
      />

      {/* Rules and Pack Size Calculator Modal */}
      <RulesModal 
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        language={language}
      />
    </div>
  );
}


