import { UserAvatar } from '@/components/atoms/UserAvatar';
import { NotificationButton } from '@/components/molecules/NotificationButton';
import { UserMenuProps } from './types';

export const UserMenu = ({ email, onSignOut }: UserMenuProps) => {
  return (
    <div className="flex items-center space-x-4">
      <button 
        onClick={onSignOut}
        className="px-4 py-2 text-gray-400 hover:text-white transition-smooth text-sm"
      >
        Cerrar Sesión
      </button>
      <NotificationButton />
      <UserAvatar initial={email.charAt(0).toUpperCase()} />
    </div>
  );
}; 