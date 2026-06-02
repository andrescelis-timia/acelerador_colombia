'use client';
import { ReactNode, useState } from "react";
import { Sidebar } from '@/components/organisms/Sidebar';
import { Header } from '@/components/organisms/Header';
import { HomeIcon, BeakerIcon, TableCellsIcon, UserGroupIcon, ArrowPathRoundedSquareIcon, BookOpenIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { ErrorModal } from '@/components/molecules/ErrorModal';
import { useAuth } from '@/lib/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, country, logout } = useAuth();
  const { isAdmin } = useUserRole();
  const [isExpanded, setIsExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cerrar sesión');
    }
  };

  // Items visibles para cualquier usuario autenticado
  const baseNavItems = [
    { icon: HomeIcon, label: 'Inicio', href: '/' },
    { icon: BeakerIcon, label: 'Proyectos', href: '/project' },
    { icon: TableCellsIcon, label: 'Objetos', href: '/object', matchPrefixes: ['/object-detail'] },
    { icon: MagnifyingGlassIcon, label: 'RCN', href: '/rcn' }
  ];

  const navItems = [...baseNavItems];

  if (country === 'CO') {
    navItems.push({ icon: ArrowPathRoundedSquareIcon, label: 'Ingestas', href: '/ingestion' });
  }

  if (isAdmin) {
    navItems.push({ icon: UserGroupIcon, label: 'Admin', href: '/admin' });
    navItems.push({ icon: BookOpenIcon, label: 'Documentación', href: '/admin/docs' });
  }

  return (
    <div className="flex min-h-screen bg-[#F5F6FA]">
      <Sidebar
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        navItems={navItems}
      />
      <main className={`flex-1 overflow-x-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'pl-[180px]' : 'pl-[64px]'
        }`}>
        <div className="max-w-7xl mx-auto">
          <Header
            email={user?.email || ''}
            onSignOut={handleSignOut}
          />
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>
      <ErrorModal
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </div>
  );
}; 