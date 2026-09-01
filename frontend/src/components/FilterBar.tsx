
export interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterBarProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function FilterBar({ options, selectedId, onSelect }: FilterBarProps) {
  return (
    <section className="flex flex-col gap-3">
      <span className="text-[11px] tracking-[0.08em] uppercase text-fg-muted font-semibold font-body">
        Filter by
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist">
        {options.map(opt => (
          <button
            key={opt.id}
            role="tab"
            aria-selected={selectedId === opt.id}
            onClick={() => onSelect(opt.id)}
            className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-3 rounded-full font-body text-[13px] whitespace-nowrap transition-colors border ${
              selectedId === opt.id
                ? 'bg-accent text-on-accent border-divider font-semibold'
                : 'bg-[rgba(255,255,255,0.05)] text-fg-muted border-transparent hover:bg-[rgba(255,255,255,0.08)] font-medium'
            }`}
          >
            {opt.icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{opt.icon}</span>}
            {opt.label}
          </button>
        ))}
      </div>
    </section>
  );
}
