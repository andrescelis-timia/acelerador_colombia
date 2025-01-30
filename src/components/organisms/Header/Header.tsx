'use client';

import { useState } from 'react';
import { UserInfo } from '@/components/molecules/UserInfo';
import { UserMenu } from '@/components/molecules/UserMenu';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { HeaderProps } from './types';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

export const Header = ({ email }: HeaderProps) => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cerrar sesión');
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-12 py-3 flex justify-between items-center">
          <UserInfo email={email} />
          <UserMenu email={email} onSignOut={handleSignOut} />
        </div>
      </header>

      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}; 