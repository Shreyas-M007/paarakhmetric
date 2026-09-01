
interface MapHeroProps {
  imageUrl?: string;
  metricValue: string;
  metricSub: string;
  legendLabel: string;
  legendPass: number;
  legendFail: number;
  legendReview: number;
}

export default function MapHero({ 
  imageUrl = 'https://rpreisbpsxrjwqsfeggf.supabase.co/storage/v1/object/public/direction-images/directions/f779208e-df24-47d1-9fce-a1ca8062de97/e06f95ebf96b.jpg',
  metricValue,
  metricSub,
  legendLabel,
  legendPass,
  legendFail,
  legendReview
}: MapHeroProps) {
  const total = legendPass + legendFail + legendReview;
  const passRate = total > 0 ? Math.round((legendPass / total) * 100) : 0;

  return (
    <section className="relative rounded-xl overflow-hidden min-h-[280px] flex flex-col justify-end">
      <img 
        src={imageUrl} 
        alt="Map background" 
        className="absolute inset-0 w-full h-full object-cover" 
      />
      {/* Scrim gradient */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ background: 'linear-gradient(to top, rgba(10,15,18,0.85) 5%, rgba(11,11,10,0.15) 55%, transparent 80%)' }}
      />
      
      {/* Top row: label + pass pill */}
      <div className="relative z-10 flex justify-between items-start pt-5 px-5">
        <span className="text-[11px] tracking-[0.08em] uppercase text-white/75 font-body">
          {legendLabel}
        </span>
        
        <div className="inline-flex items-center gap-2 bg-accent text-on-accent rounded-full py-2 px-4 whitespace-nowrap w-max">
          <span className="font-display font-bold text-[15px]">{passRate}% pass</span>
        </div>
      </div>
      
      {/* Decorative arc */}
      <svg className="absolute z-10 inset-x-5 top-5 h-[120px] pointer-events-none" viewBox="0 0 353 120" preserveAspectRatio="none">
        <path d="M 10,100 Q 176,10 343,100" fill="none" stroke="var(--gesso-fg)" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="2 6"></path>
        <path d="M 10,100 Q 176,10 343,100" fill="none" stroke="var(--gesso-accent)" strokeWidth="2" strokeLinecap="round" style={{strokeDasharray: 220, strokeDashoffset: 0}}></path>
      </svg>
      
      {/* Bottom metric */}
      <div className="relative z-10 p-5 flex flex-col gap-3 text-white">
        <div className="font-display text-[64px] leading-[64px] font-bold tracking-[-0.01em]">
          {metricValue}<span className="text-[22px] font-medium opacity-70 font-body">/ {total} audits</span>
        </div>
        <div className="text-[13px] opacity-70 font-body">
          {metricSub}
        </div>
      </div>
    </section>
  );
}
