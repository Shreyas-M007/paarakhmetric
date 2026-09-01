import { LayoutGrid, List, BarChart, User } from 'lucide-react';

interface TabBarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { id: 'history', label: 'Inspections', Icon: List },
  { id: 'reports', label: 'Reports', Icon: BarChart },
  { id: 'profile', label: 'Profile', Icon: User },
];

export default function TabBar({ currentPage, onPageChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around pt-3 px-4 bg-canvas/90 backdrop-blur-xl border-t border-divider"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 20px))' }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const active = currentPage === id;
        return (
          <button
            key={id}
            onClick={() => onPageChange(id)}
            className={`flex flex-1 flex-col items-center gap-1 p-1 rounded transition-colors ${active ? 'text-accent' : 'text-fg-muted hover:text-fg'}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="w-6 h-6" />
            <span className="text-[11px] font-medium tracking-wide uppercase">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
