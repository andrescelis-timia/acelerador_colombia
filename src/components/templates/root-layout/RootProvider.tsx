'use client';

import { AuthProvider } from '@/lib/context/AuthContext';
import { RootLayoutClient } from './RootLayoutClient';

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RootLayoutClient>
        {children}
      </RootLayoutClient>
    </AuthProvider>
  );
} 