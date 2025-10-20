'use client';

import { IngestionContent } from '@/components/organisms/IngestionContent';
import { useAuth } from '@/lib/context/AuthContext';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

export default function IngestionPage() {
  const { user, country, loading } = useAuth();
  const { isReadOnly } = useUserRole();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user?.email) {
    return <div>Usuario no autenticado</div>;
  }

  if (country !== 'CO') {
    return <div>Esta funcionalidad solo está disponible para Colombia</div>;
  }

  if (isReadOnly) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">Los usuarios de solo lectura no pueden acceder al generador de pipelines.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <IngestionContent />
      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}