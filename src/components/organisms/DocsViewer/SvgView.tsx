'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useAuth } from '@/lib/context/AuthContext';
import { ArrowDownTrayIcon, ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SvgViewProps {
  file: string;
  title: string;
}

export const SvgView = ({ file, title }: SvgViewProps) => {
  const { user, country } = useAuth();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  // Fetch del SVG con auth headers
  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const response = await fetch(`/api/docs/${file}`, {
          headers: { 'X-User': user.email!, 'X-Country': country || 'CO' },
        });
        if (response.status === 403) {
          setError('No tienes permisos para ver este diagrama.');
          return;
        }
        if (!response.ok) {
          setError('No se pudo cargar el diagrama.');
          return;
        }
        setSvgContent(await response.text());
      } catch {
        setError('Error de conexión al cargar el diagrama.');
      }
    };
    load();
  }, [file, user?.email, country]);

  // Convertir SVG a blob URL para usar como <img src>
  useEffect(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [svgContent]);

  // El cierre con Escape y el bloqueo de scroll los aporta <Dialog>.

  const download = () => {
    if (!svgContent) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = file.split('/').pop() || 'diagrama.svg';
    a.click();
  };

  if (error) {
    return (
      <div className="p-6 bg-danger-subtle border border-danger-border rounded-lg text-sm text-danger">
        {error}
      </div>
    );
  }

  if (!blobUrl) {
    return <div className="p-6 text-sm text-gray-500">Cargando…</div>;
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setZoomed(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
            Ampliar
          </button>
          <button
            onClick={download}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Descargar
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-auto flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blobUrl}
            alt={title}
            className="max-w-full h-auto"
          />
        </div>
      </div>

      <Dialog open={zoomed} onClose={() => setZoomed(false)} className="relative z-[9999]">
        <div className="fixed inset-0 bg-black/85" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-6">
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          {/*
            El Panel lleva dimensiones definidas (90vw x 90vh) a proposito:
            la mayoria de los diagramas son SVG con solo `viewBox`, sin
            width/height, asi que no tienen tamano intrinseco. Sin un
            contenedor de dimension conocida el <img> colapsa. Con esto,
            `max-w/h-full` + `object-contain` resuelven y mantienen ratio.
          */}
          <Dialog.Panel className="w-[90vw] h-[90vh] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobUrl}
              alt={title}
              className="max-w-full max-h-full object-contain bg-white rounded-lg p-4"
            />
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};
