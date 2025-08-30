import React from 'react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onOpenProfileModal: () => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  page: string;
  currentPage: string;
  onNavigate: (page: string) => void;
}> = ({ label, icon, page, currentPage, onNavigate }) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => onNavigate(page)}
      className={`flex flex-col items-center justify-center w-full h-16 sm:h-20 transition-colors duration-200 group relative ${isActive ? 'text-[#20C997]' : 'text-white/60 hover:text-white'}`}
      aria-label={label}
    >
      {icon}
      <span className="text-[10px] sm:text-xs mt-1">{label}</span>
      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#20C997] rounded-r-full"></div>}
    </button>
  );
};

// SVG Icons
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const GroupsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a3.001 3.001 0 015.688 0M12 12a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const AddExpenseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SettlementIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h.01M12 7h.01M16 7h.01M9 17h6M12 17v-4m0 4H9m3 0h3m-3-4h.01M12 13h.01M12 13v-4m0 0H9m3 0h3m-3 0V7m0 0h.01M12 7V3m0 4h.01M12 7h-.01" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onLogout, onOpenProfileModal }) => {
  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, page: 'dashboard' },
    { label: 'Groups', icon: <GroupsIcon />, page: 'groups' },
    { label: 'Add Expense', icon: <AddExpenseIcon />, page: 'addExpense' },
    { label: 'History', icon: <HistoryIcon />, page: 'history' },
    { label: 'Settlements', icon: <SettlementIcon />, page: 'settlement' },
  ];

  return (
    <div className="fixed top-0 left-0 h-full w-16 sm:w-20 bg-black/20 backdrop-blur-lg border-r border-white/10 flex flex-col justify-between z-40">
      <div>
        <nav className="flex flex-col items-center mt-4 space-y-2">
          {navItems.map(item => <NavItem key={item.page} {...item} currentPage={currentPage} onNavigate={onNavigate} />)}
        </nav>
      </div>
      <div className="flex flex-col items-center mb-4 space-y-4">
        <button
          onClick={onOpenProfileModal}
          className="flex flex-col items-center justify-center w-full h-16 sm:h-20 text-white/60 hover:text-white transition-colors"
          aria-label="Profile"
        >
          <ProfileIcon />
          <span className="text-[10px] sm:text-xs mt-1">Profile</span>
        </button>
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center w-full h-16 sm:h-20 text-white/60 hover:text-red-400 transition-colors"
          aria-label="Logout"
        >
          <LogoutIcon />
          <span className="text-[10px] sm:text-xs mt-1">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;