import { Package, Droplet, Cookie, Milk, SprayCan, Candy } from 'lucide-react';
import { Language, getStatusTranslation } from '../i18n';

export interface Inspection {
  id: string;
  title: string;
  meta: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW';
  timeInfo: string;
  iconType?: string;
  image_url?: string;
  images?: any[];
  officer?: string;
  scanned_by?: string;
  officer_badge?: string;
}



interface InspectionListProps {
  title?: string;
  inspections: Inspection[];
  onRowClick: (id: string) => void;
  gridMode?: boolean;
  language?: Language;
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

export default function InspectionList({ 
  title = 'Recent inspections', 
  inspections, 
  onRowClick, 
  gridMode = false,
  language = 'en'
}: InspectionListProps) {
  return (
    <section className="flex flex-col w-full">
      {title && <div className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-bold mb-3">{title}</div>}
      {inspections.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-fg-muted bg-surface-elevated/20 rounded-xl border border-dashed border-divider">
          <p className="text-xs font-semibold text-fg mb-1">
            {language === 'hi' ? 'कोई निरीक्षण रिकॉर्ड नहीं मिला' : language === 'kn' ? 'ಯಾವುದೇ ತಪಾಸಣಾ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No inspection records found'}
          </p>
          <p className="text-[11px] text-fg-muted">
            {language === 'hi' ? 'नया स्कैन शुरू करने के लिए कैमरा या गैलरी का उपयोग करें।' : language === 'kn' ? 'ಹೊಸ ತಪಾಸಣೆಗಾಗಿ ಕ್ಯಾಮೆರಾ ಅಥವಾ ಗ್ಯಾಲರಿ ಬಳಸಿ.' : 'Perform a new product scan to record audits in the ledger.'}
          </p>
        </div>
      ) : (
        <div className={gridMode ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col"}>

        {inspections.map(insp => {
          let badgeBorder = 'border-divider';
          const statText = getStatusTranslation(insp.status, language);
          
          if (insp.status === 'COMPLIANT') {
            badgeBorder = 'border-success/30 bg-success/10 text-success';
          } else if (insp.status === 'NON_COMPLIANT') {
            badgeBorder = 'border-error/30 bg-error/10 text-error';
          } else {
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
                  <div className="flex items-center gap-1.5 text-xs text-fg-muted whitespace-nowrap overflow-hidden text-ellipsis">
                    <span>{insp.meta}</span>
                    <span className="text-divider">•</span>
                    <span className="text-accent/90 font-medium truncate">
                      👤 {insp.scanned_by || insp.officer || 'Officer'}
                    </span>
                  </div>
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
      )}
    </section>

  );
}
