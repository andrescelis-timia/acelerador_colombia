'use client';

import { UserInfo } from '@/components/molecules/UserInfo';
import { UserMenu } from '@/components/molecules/UserMenu';
import { HeaderProps } from './types';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

export const Header = ({ email }: HeaderProps) => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-12 py-3 flex justify-between items-center">
        <UserInfo email={email} />
        <UserMenu email={email} onSignOut={handleSignOut} />
      </div>
    </header>
  );
}; 