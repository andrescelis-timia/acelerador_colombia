'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { findDiagramBySlug } from '@/lib/docs/catalog';
import { SvgView } from '@/components/organisms/DocsViewer';

export default function DiagramaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const entry = findDiagramBySlug(slug);

  if (!entry) {
    notFound();
  }

  return <SvgView file={entry.file} title={entry.title} />;
}
