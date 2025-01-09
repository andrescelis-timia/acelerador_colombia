import { NotificationBadgeProps } from './types';

export const NotificationBadge = ({ className = '' }: NotificationBadgeProps) => {
  return (
    <span className={`absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white ${className}`} />
  );
}; 