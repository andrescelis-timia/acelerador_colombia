'use client';
import { ReactNode, useState } from "react";
import { Sidebar } from '@/components/organisms/Sidebar';
import { Header } from '@/components/organisms/Header';
import { HomeIcon, BeakerIcon, TableCellsIcon, Cog6ToothIcon, PencilSquareIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { useAuth } from '@/lib/context/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [user] = useAuthState(auth);
  const { country } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al cerrar sesión');
    }
  };

  // Crear lista de navItems base
  const baseNavItems = [
    { icon: HomeIcon, label: 'Inicio', href: '/' },
    { icon: BeakerIcon, label: 'Proyectos', href: '/project' },
    { icon: TableCellsIcon, label: 'Objetos', href: '/object' },
    { icon: Cog6ToothIcon, label: 'Configuración', href: '/configuration' }
  ];

  // Agregar elementos específicos por país
  let navItems = [...baseNavItems];
  
  if (country === 'HO') {
    navItems = [
      ...baseNavItems.slice(0, 3), // Inicio, Proyectos, Objetos
      { icon: PencilSquareIcon, label: 'Diseñador', href: '/designer' },
      ...baseNavItems.slice(3) // Configuración
    ];
  } else if (country === 'CO') {
    navItems = [
      ...baseNavItems.slice(0, 3), // Inicio, Proyectos, Objetos
      { icon: ArrowPathRoundedSquareIcon, label: 'Ingestas', href: '/ingestion' },
      ...baseNavItems.slice(3) // Configuración
    ];
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        navItems={navItems} 
      />
      <main className={`flex-1 transition-all duration-300 ${
        isExpanded ? 'pl-[180px]' : 'pl-[60px]'
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