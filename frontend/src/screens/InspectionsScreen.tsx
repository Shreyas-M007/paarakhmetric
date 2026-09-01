import { useState } from 'react';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import InspectionList, { Inspection } from '../components/InspectionList';
import { Language, translations } from '../i18n';

interface InspectionsScreenProps {
  inspections: Inspection[];
  onRowClick: (id: string) => void;
  onNewInspection: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterOption: string;
  setFilterOption: (opt: string) => void;
  language?: Language;
}

export default function InspectionsScreen({
  inspections,
  onRowClick,
  onNewInspection,
  searchQuery,
  setSearchQuery,
  filterOption,
  setFilterOption,
  language = 'en'
}: InspectionsScreenProps) {
  const [sortAsc, setSortAsc] = useState(false);
  const t = translations[language] || translations.en;

  const filterOptions = [
    { id: 'ALL', label: t.all || 'All' },
    { id: 'FAIL', label: t.fail || 'Fail' },
    { id: 'REVIEW', label: t.needsReview || 'Review' },
    { id: 'COMPLIANT', label: t.compliant || 'Compliant' },
    { id: 'SORT', label: sortAsc ? 'A → Z' : (language === 'hi' ? 'नवीनतम' : language === 'kn' ? 'ಹೊಸದು' : 'Newest'), icon: <ArrowUpDown className="w-3 h-3" /> },
  ];

  const handleFilterSelect = (opt: string) => {
    if (opt === 'SORT') {
      setSortAsc(!sortAsc);
      setFilterOption('SORT');
    } else {
      setFilterOption(opt);
    }
  };

  // 1. Search Query Filter
  let list = inspections.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.meta.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q)
    );
  });

  // 2. Chip Filter
  if (filterOption === 'FAIL') {
    list = list.filter(i => i.status === 'NON_COMPLIANT');
  } else if (filterOption === 'REVIEW') {
    list = list.filter(i => i.status === 'REVIEW');
  } else if (filterOption === 'COMPLIANT') {
    list = list.filter(i => i.status === 'COMPLIANT');
  }

  // 3. Sorting
  if (filterOption === 'SORT' && sortAsc) {
    list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-[28px] leading-[32px] font-bold tracking-tight m-0">{t.inspectionHistory || "Inspections"}</h1>
          <span className="text-[15px] font-medium text-fg-muted">{inspections.length} {t.recordsFound || "total records logged"}</span>
        </div>
        <button 
          onClick={onNewInspection}
          className="w-10 h-10 rounded-full bg-surface text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95 flex-shrink-0"
          title={t.startFieldInspection || "New Scan"}
        >
          <Plus className="w-5 h-5" />
        </button>
      </section>

      <section className="flex items-center gap-2 bg-surface rounded-full py-3 px-4 text-fg-muted">
        <Search className="w-5 h-5 flex-shrink-0 text-accent" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder || "Search product, barcode, city..."} 
          className="flex-1 bg-transparent border-none text-fg text-[16px] outline-none min-w-0 placeholder:text-fg-muted font-body"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-fg-muted hover:text-fg font-semibold pr-1">
            {language === 'hi' ? 'साफ़ करें' : language === 'kn' ? 'ತೆರವುಗೊಳಿಸಿ' : 'Clear'}
          </button>
        )}
      </section>

      <FilterBar 
        options={filterOptions}
        selectedId={filterOption}
        onSelect={handleFilterSelect}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold font-body">
            {language === 'hi' ? 'लेज़र परिणाम' : language === 'kn' ? 'ಲೆಡ್ಜರ್ ಫಲಿತಾಂಶಗಳು' : 'Ledger Results'}
          </span>
          <span className="text-[14px] text-fg-muted whitespace-nowrap">
            {list.length} {language === 'hi' ? 'दिखाया गया' : language === 'kn' ? 'ತೋರಿಸಲಾಗಿದೆ' : 'shown'}
          </span>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-divider/60 shadow-sm">
          <InspectionList 
            title=""
            inspections={list} 
            onRowClick={onRowClick} 
            gridMode={true}
          />
        </div>
      </div>
    </div>
  );
}
