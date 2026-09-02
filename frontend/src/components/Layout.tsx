import { type ReactNode, useState } from 'react';
import TabBar from './TabBar';
import { Globe, ChevronDown } from 'lucide-react';
import { Language } from '../i18n';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  user?: any;
}

const languages: Array<{ code: Language; symbol: string; label: string; sub: string }> = [
  { code: 'en', symbol: 'A', label: 'English', sub: 'English' },
  { code: 'hi', symbol: 'अ', label: 'हिन्दी', sub: 'Hindi' },
  { code: 'kn', symbol: 'ಅ', label: 'ಕನ್ನಡ', sub: 'Kannada' },
  { code: 'ta', symbol: 'அ', label: 'தமிழ்', sub: 'Tamil' },
  { code: 'te', symbol: 'అ', label: 'తెలుగు', sub: 'Telugu' },
  { code: 'mr', symbol: 'म', label: 'मराठी', sub: 'Marathi' },
  { code: 'bn', symbol: 'অ', label: 'বাংলা', sub: 'Bengali' },
];

const langSymbolMap: Record<Language, string> = {
  en: 'A',
  hi: 'अ',
  kn: 'ಅ',
  ta: 'அ',
  te: 'అ',
  mr: 'म',
  bn: 'অ'
};

export default function Layout({ children, currentPage, onPageChange, language, setLanguage, user }: LayoutProps) {
  const [langOpen, setLangOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Top Bar with Officer Badge and Language Switcher */}
      <header className="w-full px-5 pt-4 pb-2 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-fg font-body">
              {user?.name || user?.username || "Officer"}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold uppercase">
              {user?.designation || (user?.role === 'controller' ? 'Collector' : user?.role === 'supervisor' ? 'Senior Inspector' : 'Officer')}
            </span>
          </div>
        </div>


        {/* Language selector popup */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-divider bg-surface text-fg text-xs font-bold transition-all hover:bg-surface-elevated active:scale-95 shadow-sm"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span className="w-5 h-5 rounded-md bg-accent text-on-accent flex items-center justify-center text-xs font-bold font-display">
              {langSymbolMap[language] || 'A'}
            </span>
            <ChevronDown className="w-3 h-3 text-fg-muted" />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-surface-elevated rounded-xl border border-divider py-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-fg-muted tracking-wider border-b border-divider/50">
                Select Language / भाषा चुनें
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                    language === lang.code ? 'bg-accent/15 text-accent font-bold' : 'text-fg-muted hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-surface border border-divider/40 flex items-center justify-center font-bold text-fg text-xs font-display">
                      {lang.symbol}
                    </span>
                    <div>
                      <div className="text-fg font-semibold">{lang.label}</div>
                      <div className="text-[10px] text-fg-muted">{lang.sub}</div>
                    </div>
                  </div>
                  {language === lang.code && (
                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>


      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-[calc(84px+env(safe-area-inset-bottom,20px))] overflow-y-auto">
        {children}
      </main>
      <TabBar currentPage={currentPage} onPageChange={onPageChange} language={language} />
    </div>
  );
}


