'use client';

import { DesignerToolContent } from '@/components/organisms/DesignerToolContent';
import { useAuth } from '@/lib/context/AuthContext';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { useState } from 'react';

export default function DesignerPage() {
  const { user, country, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user?.email) {
    return <div>Usuario no autenticado</div>;
  }

  if (country !== 'HO') {
    return <div>Esta funcionalidad solo está disponible para Honduras</div>;
  }

  return (
    <>
      <DesignerToolContent />
      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
} 