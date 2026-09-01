
export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  variant?: 'pass' | 'fail' | 'review' | 'default';
}

interface StatGridProps {
  title?: string;
  items: StatItem[];
  columns?: 2 | 3 | 4;
}

export default function StatGrid({ title, items, columns = 4 }: StatGridProps) {
  const colClass = columns === 2
    ? 'grid-cols-2'
    : columns === 3
    ? 'grid-cols-3'
    : 'grid-cols-2 sm:grid-cols-4';

  return (
    <section className="flex flex-col gap-3">
      {title && <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold font-body">{title}</span>}
      <div className={`grid gap-4 ${colClass}`}>
        {items.map(item => {
          let valClass = 'text-fg';
          if (item.variant === 'pass') valClass = 'text-success';
          else if (item.variant === 'fail') valClass = 'text-error';
          else if (item.variant === 'review') valClass = 'text-warning';

          return (
            <div key={item.id} className="flex flex-col gap-1 p-3.5 rounded-md bg-surface">
              <span className={`font-display text-[28px] leading-[28px] font-bold ${valClass}`}>
                {item.value}
                {item.unit && <span className="text-base font-medium text-fg-muted ml-1">{item.unit}</span>}
              </span>
              <span className="text-[10px] tracking-[0.08em] uppercase text-fg-muted font-body">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
