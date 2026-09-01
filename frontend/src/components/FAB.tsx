import { Plus, ScanLine } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  icon?: 'plus' | 'scan';
}

export default function FAB({ onClick, icon = 'plus' }: FABProps) {
  return (
    <button 
      onClick={onClick}
      className="fixed right-4 bottom-24 z-[150] w-14 h-14 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-sm hover:brightness-105 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2"
      aria-label="Primary action"
    >
      {icon === 'plus' ? <Plus className="w-6 h-6" /> : <ScanLine className="w-6 h-6" />}
    </button>
  );
}
