import { LayoutGrid, List, BarChart, User } from 'lucide-react';
import { Language, translations } from '../i18n';

interface TabBarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  language?: Language;
}

export default function TabBar({ currentPage, onPageChange, language = 'en' }: TabBarProps) {
  const t = translations[language] || translations.en;

  const tabs = [
    { id: 'dashboard', label: t.dashboard || 'Dashboard', Icon: LayoutGrid },
    { id: 'history', label: t.inspectionHistory || 'Inspections', Icon: List },
    { id: 'reports', label: t.reports || 'Reports', Icon: BarChart },
    { id: 'profile', label: t.profile || 'Profile', Icon: User },
  ];


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around pt-3 px-4 bg-canvas/90 backdrop-blur-xl border-t border-divider md:max-w-xl md:left-1/2 md:-translate-x-1/2 md:bottom-5 md:rounded-2xl md:border md:shadow-2xl md:pt-2 md:pb-2 transition-all duration-300"
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

