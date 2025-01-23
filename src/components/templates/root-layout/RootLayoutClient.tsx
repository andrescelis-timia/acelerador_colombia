'use client';

import { MainLayout } from '@/components/templates/main-layout/MainLayout';
import { ContentLayout } from '@/components/templates/content-layout/ContentLayout';
import { usePathname } from 'next/navigation';

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return isLoginPage ? children : (
    <MainLayout>
      <ContentLayout>
        {children}
      </ContentLayout>
    </MainLayout>
  );
} 