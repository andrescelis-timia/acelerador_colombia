import { BellIcon } from "@heroicons/react/24/outline";
import { IconButton } from '@/components/atoms/IconButton';
import { NotificationBadge } from '@/components/atoms/NotificationBadge';
import { NotificationButtonProps } from './types';

export const NotificationButton = ({ onClick }: NotificationButtonProps) => {
  return (
    <div className="relative">
      <IconButton 
        icon={<BellIcon className="h-6 w-6" />}
        onClick={onClick}
      />
      <NotificationBadge />
    </div>
  );
}; 