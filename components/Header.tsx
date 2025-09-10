import React from 'react';

export type AppView = 'main' | 'history' | 'settings';

interface HeaderProps {
    activeView: AppView;
    onNavigate: (view: AppView) => void;
}

const NavButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isActive: boolean;
}> = ({ label, icon, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors flex items-center gap-2 ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    }`}
    >
        {icon}
        {label}
    </button>
);


export const Header: React.FC<HeaderProps> = ({ activeView, onNavigate }) => {
  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-200">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-blue-600 tracking-tight cursor-pointer" onClick={() => onNavigate('main')}>
                Trợ lý Da liễu AI
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Chẩn đoán da & Lập phác đồ điều trị nâng cao</p>
        </div>
        <div className="flex items-center gap-3">
             <NavButton
                label="Trang chủ"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                onClick={() => onNavigate('main')}
                isActive={activeView === 'main'}
             />
             <NavButton
                label="Lịch sử Bệnh nhân"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                onClick={() => onNavigate('history')}
                isActive={activeView === 'history'}
             />
             <NavButton
                label="Cài đặt"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                onClick={() => onNavigate('settings')}
                isActive={activeView === 'settings'}
             />
        </div>
      </div>
    </header>
  );
};