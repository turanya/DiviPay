import React from 'react';

interface AvatarProps {
  name: string;
  avatarUrl: string;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ name, avatarUrl, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white/20 shadow-md`}
      />
      <span className="text-white/80 text-xs text-center truncate max-w-[60px]">{name}</span>
    </div>
  );
};

export default Avatar;