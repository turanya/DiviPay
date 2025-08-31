import React from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onOpenProfileModal: () => void;  // CHANGED: was onOpenProfile
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  currentPage, 
  onNavigate,
  onLogout, 
  onOpenProfileModal
}) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar 
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onOpenProfileModal={onOpenProfileModal}
      />
      <main className="flex-1 ml-16 sm:ml-20 p-6">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
