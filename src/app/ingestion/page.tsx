'use client';

import { IngestionContent } from '@/components/organisms/IngestionContent';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { useState } from 'react';
import { withAuthGuard } from '@/components/hoc/withAuthGuard';

function IngestionPageContent() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

export default withAuthGuard(IngestionPageContent, {
  requiredCountry: 'CO',
  countryErrorMessage: 'Esta funcionalidad solo está disponible para Colombia'
});