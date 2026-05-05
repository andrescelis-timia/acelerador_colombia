import { UserAvatarProps } from './types';

export const UserAvatar = ({ initial, className = '' }: UserAvatarProps) => {
  return (
    <div className={`h-8 w-8 rounded-full bg-timia-accent text-white flex items-center justify-center transition-smooth ${className}`}>
      <span className="text-sm font-medium">{initial}</span>
    </div>
  );
}; 