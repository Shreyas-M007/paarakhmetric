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
    { id: 'reports', label: language === 'hi' ? 'रिपोर्ट्स' : language === 'kn' ? 'ವರದಿಗಳು' : 'Reports', Icon: BarChart },
    { id: 'profile', label: language === 'hi' ? 'प्रोफ़ाइल' : language === 'kn' ? 'ಪ್ರೊಫೈಲ್' : 'Profile', Icon: User },
  ];

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

