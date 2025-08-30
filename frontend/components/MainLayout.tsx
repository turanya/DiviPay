import React from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigateToPage: (page: string) => void;  // CHANGED: was onNavigate
  onLogout: () => void;
  onOpenProfileModal: () => void;  // CHANGED: was onOpenProfile
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  currentPage, 
  onNavigateToPage,  // CHANGED: was onNavigate
  onLogout, 
  onOpenProfileModal  // CHANGED: was onOpenProfile
}) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar 
        currentPage={currentPage}
        onNavigate={onNavigateToPage}  // Pass to Sidebar
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
