import { type ReactNode } from 'react';
import TabBar from './TabBar';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <main className="flex-1 w-full px-5 pt-6 pb-[calc(80px+env(safe-area-inset-bottom,20px))] overflow-y-auto">
        {children}
      </main>
      <TabBar currentPage={currentPage} onPageChange={onPageChange} />
    </div>
  );
}
