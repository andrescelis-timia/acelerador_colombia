'use client';

import { useEffect, useState } from 'react';
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

  // ESC cierra el modal + locks body scroll
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [zoomed]);

  const download = () => {
    if (!svgContent) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = file.split('/').pop() || 'diagrama.svg';
    a.click();
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
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

      {zoomed && (
        <div
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-6 cursor-zoom-out"
        >
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            onClick={e => e.stopPropagation()}
            src={blobUrl}
            alt={title}
            className="max-w-[90vw] max-h-[90vh] object-contain bg-white rounded-lg p-4 cursor-default"
          />
        </div>
      )}
    </>
  );
};
