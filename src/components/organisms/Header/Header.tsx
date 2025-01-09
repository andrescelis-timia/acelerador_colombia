'use client';

import { UserInfo } from '@/components/molecules/UserInfo';
import { UserMenu } from '@/components/molecules/UserMenu';
import { HeaderProps } from './types';

export const Header = ({ email, onSignOut }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-12 py-3 flex justify-between items-center">
        <UserInfo email={email} />
        <UserMenu email={email} onSignOut={onSignOut} />
      </div>
    </header>
  );
}; 