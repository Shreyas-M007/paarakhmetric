import { Search, ShieldCheck } from 'lucide-react';
import StatGrid from '../components/StatGrid';
import FilterBar from '../components/FilterBar';
import InspectionList, { Inspection } from '../components/InspectionList';
import MapHero from '../components/MapHero';

interface DashboardScreenProps {
  stats: any;
  inspections: Inspection[];
  onRowClick: (id: string) => void;
  filterOption: string;
  setFilterOption: (opt: string) => void;
  onSearchClick?: () => void;
}

export default function DashboardScreen({
  stats,
  inspections,
  onRowClick,
  filterOption,
  setFilterOption,
  onSearchClick
}: DashboardScreenProps) {
  const filterOptions = [
    { id: 'ALL', label: 'All' },
    { id: 'FLAGGED', label: 'Flagged' },
    { id: 'COMPLIANT', label: 'Compliant' },
    { id: 'THIS_WEEK', label: 'This week' },
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
      <section className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-9 h-9 text-accent" />
          <h1 className="font-display text-[28px] leading-[32px] font-bold tracking-tight m-0">PaarakhMetric</h1>
        </div>
        <button 
          onClick={onSearchClick}
          className="w-10 h-10 rounded-md bg-surface text-fg flex items-center justify-center transition-colors hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:outline-offset-2 active:scale-95"
          title="Search Inspections"
        >
          <Search className="w-5 h-5" />
        </button>
      </section>

      <MapHero 
        metricValue={compliant.toString()}
        metricSub={`${nonCompliant} flagged non-compliant across sites this week`}
        legendLabel="Today's audit sweep"
        legendPass={compliant}
        legendFail={nonCompliant}
        legendReview={review}
      />

      <StatGrid 
        columns={3}
        items={[
          { id: 'compliant', label: 'Compliant', value: compliant, variant: 'pass' },
          { id: 'non-compliant', label: 'Non-compliant', value: nonCompliant, variant: 'fail' },
          { id: 'review', label: 'Review', value: review, variant: 'review' }
        ]} 
      />

      <FilterBar 
        options={filterOptions}
        selectedId={filterOption}
        onSelect={setFilterOption}
      />

      <InspectionList 
        title={filterOption === 'FLAGGED' ? 'Flagged Violations' : filterOption === 'COMPLIANT' ? 'Compliant Products' : 'Recent inspections'}
        inspections={filteredInspections.slice(0, 6)} 
        onRowClick={onRowClick} 
      />
    </div>
  );
}
