import { User } from 'lucide-react';

interface ProfileAvatarProps {
  src?: string | null;
  fullName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-xl',
  '2xl': 'w-32 h-32 text-2xl',
};

export function ProfileAvatar({ 
  src, fullName, size = 'md', className = '',
  showOnlineStatus = false, isOnline = false 
}: ProfileAvatarProps) {
  const initials = fullName
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={`relative ${sizeMap[size]} ${className} flex-shrink-0`}>
      {src ? (
        <img
          src={src} alt={fullName}
          className={`${sizeMap[size]} rounded-full object-cover 
                     border-2 border-cyan-500/30 ring-2 ring-cyan-500/10`}
        />
      ) : (
        <div className={`${sizeMap[size]} rounded-full 
                       bg-gradient-to-br from-cyan-500/30 to-violet-500/30 
                       border-2 border-cyan-500/30
                       flex items-center justify-center 
                       text-cyan-100 font-light`}>
          {initials || <User className="w-1/2 h-1/2" strokeWidth={1.5} />}
        </div>
      )}
      
      {showOnlineStatus && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full 
                        border-2 border-[#000814]
                        ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
      )}
    </div>
  );
}
