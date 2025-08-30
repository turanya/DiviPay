import React from 'react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

const BackArrowIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const Header: React.FC<HeaderProps> = ({ title, onBack }) => {
  return (
    <header className="py-6 flex justify-between items-center w-full">
      <div className="flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-full text-white/80 hover:bg-white/10 transition-colors">
            <BackArrowIcon />
          </button>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Children removed, was used for ThemeToggler and Buttons */}
      </div>
    </header>
  );
};

export default Header;