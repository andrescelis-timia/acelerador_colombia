import { createFetcher } from '@/lib/api/fetcher';
import type { Carga, NuevaCarga, TipoCarga } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const BASE = `${API_URL}/admin/rcn-cargas`;

export const getCargas = async (user: string, country: string): Promise<Carga[]> => {
  const fetcher = createFetcher(user, country);
  return await fetcher(BASE);
};

export const crearCarga = async (
  user: string,
  country: string,
  tipo: TipoCarga,
  archivo: string,
  pais?: string,
): Promise<NuevaCarga> => {
  const fetcher = createFetcher(user, country);
  return await fetcher(BASE, {
    method: 'POST',
    body: JSON.stringify({ tipo, archivo, pais }),
  });
};

export const analizarCarga = async (user: string, country: string, id: string): Promise<Carga> => {
  const fetcher = createFetcher(user, country);
  return await fetcher(`${BASE}/${id}/analizar`, { method: 'POST' });
};

export const aplicarCarga = async (user: string, country: string, id: string): Promise<Carga> => {
  const fetcher = createFetcher(user, country);
  return await fetcher(`${BASE}/${id}/aplicar`, { method: 'POST' });
};

/** El CSV va directo a S3: pesa más de 100 MB. XHR porque fetch no da progreso de subida. */
export const subirArchivo = (url: string, archivo: File, alAvanzar: (porcentaje: number) => void) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) alAvanzar(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`No se pudo subir el fichero (HTTP ${xhr.status})`));
    xhr.onerror = () => reject(new Error('No se pudo subir el fichero'));
    xhr.send(archivo);
  });
