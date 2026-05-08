import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { RootProvider } from '@/components/templates/root-layout/RootProvider';

import NextTopLoader from 'nextjs-toploader';

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
    <html lang="es" className="dark">
      <body className={inter.className}>
        <NextTopLoader color="#9D012A" showSpinner={false} />
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
