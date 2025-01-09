'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ObjectDetailContent } from '@/components/organisms/ObjectDetailContent';

export default function ObjectDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const objectId = params.id as string;
  const objectName = searchParams.get('name');

  return (
    <ObjectDetailContent 
      objectId={objectId}
      objectName={objectName || ''}
    />
  );
} 