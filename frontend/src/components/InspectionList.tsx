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
  gridMode?: boolean;
}

const getIcon = (type?: string) => {
  switch(type) {
    case 'Droplet': return <Droplet className="w-[18px] h-[18px] text-accent" />;
    case 'Cookie': return <Cookie className="w-[18px] h-[18px] text-accent" />;
    case 'Milk': return <Milk className="w-[18px] h-[18px] text-accent" />;
    case 'SprayCan': return <SprayCan className="w-[18px] h-[18px] text-accent" />;
    case 'Candy': return <Candy className="w-[18px] h-[18px] text-accent" />;
    default: return <Package className="w-[18px] h-[18px] text-accent" />;
  }
};

export default function InspectionList({ title = 'Recent inspections', inspections, onRowClick, gridMode = false }: InspectionListProps) {
  return (
    <section className="flex flex-col w-full">
      {title && <div className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-bold mb-3">{title}</div>}
      <div className={gridMode ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col"}>
        {inspections.map(insp => {
          let statText = 'Review';
          let badgeBorder = 'border-divider';
          
          if (insp.status === 'COMPLIANT') {
            statText = 'Pass';
            badgeBorder = 'border-success/30 bg-success/10 text-success';
          } else if (insp.status === 'NON_COMPLIANT') {
            statText = 'Fail';
            badgeBorder = 'border-error/30 bg-error/10 text-error';
          } else if (insp.status === 'REVIEW') {
            statText = 'Review';
            badgeBorder = 'border-warning/30 bg-warning/10 text-warning';
          }


          return (
            <button 
              key={insp.id}
              onClick={() => onRowClick(insp.id)}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl text-left bg-surface-elevated/40 border border-divider/60 hover:bg-surface-elevated hover:border-accent/40 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-fg cursor-pointer mb-2 last:mb-0 group shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-surface border border-divider/60 group-hover:border-accent/50 transition-colors">
                  {getIcon(insp.iconType)}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[14px] font-semibold text-fg whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-accent transition-colors">{insp.title}</span>
                  <span className="text-xs text-fg-muted whitespace-nowrap overflow-hidden text-ellipsis">{insp.meta}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono border ${badgeBorder}`}>{statText}</span>
                <span className="text-[10px] text-fg-muted font-mono">#{insp.id} · {insp.timeInfo}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
