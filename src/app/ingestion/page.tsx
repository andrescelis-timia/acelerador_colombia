'use client';

import { IngestionContent } from '@/components/organisms/IngestionContent';
import { useAuth } from '@/lib/context/AuthContext';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { useState } from 'react';

export default function IngestionPage() {
  const { user, country, loading } = useAuth();
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