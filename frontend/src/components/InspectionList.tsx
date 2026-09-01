import { Package, Droplet, Cookie, Milk, SprayCan, Candy } from 'lucide-react';

export interface Inspection {
  id: string;
  title: string;
  meta: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW';
  timeInfo: string;
  iconType?: string;
}

interface InspectionListProps {
  title?: string;
  inspections: Inspection[];
  onRowClick: (id: string) => void;
}

const getIcon = (type?: string) => {
  switch(type) {
    case 'Droplet': return <Droplet className="w-[18px] h-[18px] text-fg-muted" />;
    case 'Cookie': return <Cookie className="w-[18px] h-[18px] text-fg-muted" />;
    case 'Milk': return <Milk className="w-[18px] h-[18px] text-fg-muted" />;
    case 'SprayCan': return <SprayCan className="w-[18px] h-[18px] text-fg-muted" />;
    case 'Candy': return <Candy className="w-[18px] h-[18px] text-fg-muted" />;
    default: return <Package className="w-[18px] h-[18px] text-fg-muted" />;
  }
};

export default function InspectionList({ title = 'Recent inspections', inspections, onRowClick }: InspectionListProps) {
  return (
    <section className="flex flex-col">
      {title && <div className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-body mb-4">{title}</div>}
      <div className="flex flex-col">
        {inspections.map(insp => {
          let statClass = 'text-fg-muted';
          let statText = 'Review';
          
          if (insp.status === 'COMPLIANT') {
            statClass = 'text-success';
            statText = 'Pass';
          } else if (insp.status === 'NON_COMPLIANT') {
            statClass = 'text-error';
            statText = 'Fail';
          } else if (insp.status === 'REVIEW') {
            statClass = 'text-accent-2';
            statText = 'Review';
          }

          return (
            <button 
              key={insp.id}
              onClick={() => onRowClick(insp.id)}
              className="flex items-center justify-between gap-3 py-4 w-full text-left bg-transparent border-t border-divider first:border-t-0 hover:bg-[linear-gradient(rgba(255,255,255,0.03),rgba(255,255,255,0.03))] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg focus-visible:-outline-offset-2"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[color-mix(in_srgb,var(--gesso-fg)_6%,transparent)]">
                  {getIcon(insp.iconType)}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[15px] font-semibold text-fg whitespace-nowrap overflow-hidden text-ellipsis">{insp.title}</span>
                  <span className="text-xs text-fg-muted whitespace-nowrap overflow-hidden text-ellipsis">{insp.meta}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className={`font-display text-[20px] font-bold leading-[22px] ${statClass}`}>{statText}</span>
                <span className="text-[11px] text-fg-muted">#{insp.id} · {insp.timeInfo}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
