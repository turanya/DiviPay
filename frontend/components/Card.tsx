import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const cardClasses = `
    bg-white/5 
    backdrop-blur-xl 
    border border-white/10 
    rounded-2xl 
    shadow-lg 
    transition-all duration-300 
    ${className} 
    ${onClick ? 'cursor-pointer hover:bg-white/10' : ''}
  `;

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;