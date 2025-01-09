import { MainLayout } from '@/components/templates/main-layout/MainLayout';
import { ContentLayout } from '@/components/templates/content-layout/ContentLayout';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Plataforma de Ingestas',
  description: 'Plataforma de Ingestas BBVA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <MainLayout>
            <ContentLayout>
              {children}
            </ContentLayout>
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
