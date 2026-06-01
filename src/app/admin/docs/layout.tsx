'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthStateDisplay } from '@/components/molecules/AuthStateDisplay';
import { DocsSidebar, DocsBreadcrumb } from '@/components/organisms/DocsSidebar';

export default function DocsLayout({ children }: { children: ReactNode }) {
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-140px)] bg-white border border-gray-200 rounded-lg overflow-hidden">
      <DocsSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DocsBreadcrumb />
        <main className="flex-1 overflow-y-auto px-6 py-5">{children}</main>
      </div>
    </div>
  );
}
