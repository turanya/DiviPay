import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = "px-6 py-2.5 rounded-full font-bold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100";
  
  const variantClasses = {
    primary: 'bg-[#20C997] hover:bg-[#1BAB82] text-white focus:ring-[#20C997]/50',
    secondary: 'bg-white/10 hover:bg-white/20 text-white focus:ring-white/30 border border-white/20'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;