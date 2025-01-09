import { UserAvatarProps } from './types';

export const UserAvatar = ({ initial, className = '' }: UserAvatarProps) => {
  return (
    <div className={`h-8 w-8 rounded-full bg-[#0A3977] text-white flex items-center justify-center ${className}`}>
      <span className="text-sm font-medium">{initial}</span>
    </div>
  );
}; 