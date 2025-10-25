'use client';
import { ReactNode, useState } from "react";
import { Sidebar } from '@/components/organisms/Sidebar';
import { Header } from '@/components/organisms/Header';
import { HomeIcon, BeakerIcon, TableCellsIcon, UserGroupIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';

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

  // Solo mostrar Admin para usuarios con rol ADMIN completo (no ADMIN-READONLY)

  // Crear lista de navItems base
  const baseNavItems = [
    { icon: HomeIcon, label: 'Inicio', href: '/' },
    { icon: BeakerIcon, label: 'Proyectos', href: '/project' },
    { icon: TableCellsIcon, label: 'Objetos', href: '/object' }
  ];

  // Agregar elementos específicos por país
  let navItems = [...baseNavItems];

  if (country === 'CO') {
    navItems = [
      ...baseNavItems, // Inicio, Proyectos, Objetos
      { icon: ArrowPathRoundedSquareIcon, label: 'Ingestas', href: '/ingestion' }
    ];
  }

  // Agregar Admin solo para usuarios con rol ADMIN
  if (isAdmin) {
    navItems.push({ icon: UserGroupIcon, label: 'Admin', href: '/admin' });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        navItems={navItems}
      />
      <main className={`flex-1 transition-all duration-300 ${isExpanded ? 'pl-[180px]' : 'pl-[60px]'
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