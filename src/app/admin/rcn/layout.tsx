'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthStateDisplay } from '@/components/molecules/AuthStateDisplay';

export default function RcnLayout({ children }: { children: ReactNode }) {
  const { authState } = useAuthGuard();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (authState === 'authenticated' && !roleLoading && !isAdmin) {
      router.replace('/');
    }
  }, [authState, roleLoading, isAdmin, router]);

  if (authState !== 'authenticated') {
    return <AuthStateDisplay state={authState as 'loading' | 'loggingOut' | 'unauthenticated'} />;
  }
  if (roleLoading) {
    return <div className="p-6 text-sm text-gray-500">Cargando permisos…</div>;
  }
  if (!isAdmin) return null;

  return <div className="h-[calc(100vh-140px)]">{children}</div>;
}
