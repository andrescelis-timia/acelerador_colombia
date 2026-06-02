'use client';

import { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthStateDisplay } from '@/components/molecules/AuthStateDisplay';

export default function RcnLayout({ children }: { children: ReactNode }) {
  const { authState } = useAuthGuard();

  if (authState !== 'authenticated') {
    return <AuthStateDisplay state={authState as 'loading' | 'loggingOut' | 'unauthenticated'} />;
  }

  return <div className="h-[calc(100vh-140px)]">{children}</div>;
}
