import {
  GenerateDictionaryJsonRequest,
  GenerateDictionaryBaseRequest,
  GenerationJob,
  GenerationJobAccepted,
  GenerateDictionaryL1TRequest,
  GenerateDictionaryL1TResponse,
  GenerateDictionaryLiteCoRequest
} from './types';
import { DictionaryJsonHeaderResponse } from '../DictionaryJsonHeader/types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function generateDictionaryJson(data: GenerateDictionaryJsonRequest, user: string, country: string): Promise<DictionaryJsonHeaderResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/dictionary-generator/json`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    throw new Error('Error al generar diccionario JSON: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

/**
 * Lanza la generacion del diccionario base. Responde de inmediato con un
 * job_id: el trabajo real corre en background y su resultado se consulta con
 * `pollGenerationJob`.
 *
 * Antes esta llamada esperaba a que terminara, pero en tablas grandes son ~5
 * minutos y CloudFront corta a los 60s — la respuesta se perdia aunque el
 * diccionario quedara guardado.
 */
async function generateDictionaryBase(data: GenerateDictionaryBaseRequest, user: string, country: string): Promise<GenerationJobAccepted> {
  const fetcher = createFetcher(user, country);

  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/dictionary-generator/base`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Diccionario JSON no encontrado');
    }

    throw new Error('Error al generar diccionario base: ' +
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

/** Consulta puntual del estado de un job. */
async function getGenerationJob(jobId: string, user: string, country: string): Promise<GenerationJob> {
  const fetcher = createFetcher(user, country);
  return await fetcher(`${API_CONFIG.BASE_URL}/generation-jobs/${jobId}`);
}

/**
 * Ultimo job de un objeto. Permite reengancharse a una generacion en curso
 * despues de recargar la pagina, sin haber guardado el job_id.
 */
async function getLatestGenerationJob(
  objectId: string,
  jobType: string,
  user: string,
  country: string
): Promise<GenerationJob | null> {
  const fetcher = createFetcher(user, country);
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/generation-jobs/object/${objectId}/latest?job_type=${jobType}`);
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

interface PollOptions {
  /** Se invoca en cada intento; sirve para mostrar el tiempo transcurrido. */
  onTick?: (elapsedSeconds: number) => void;
  /** Corta el polling (p.ej. si el usuario se va de la pantalla). */
  signal?: AbortSignal;
  intervalMs?: number;
  /** Tope de seguridad para no consultar indefinidamente. */
  timeoutMs?: number;
}

/**
 * Consulta el job hasta que termina.
 *
 * Un fallo puntual de red NO aborta el polling: se reintenta, porque el
 * trabajo sigue corriendo en el servidor y perderlo por un corte pasajero
 * seria justo el problema que este patron viene a resolver.
 */
async function pollGenerationJob(
  jobId: string,
  user: string,
  country: string,
  { onTick, signal, intervalMs = 3000, timeoutMs = 30 * 60 * 1000 }: PollOptions = {}
): Promise<GenerationJob> {
  const startedAt = Date.now();

  for (;;) {
    if (signal?.aborted) throw new Error('Consulta cancelada');

    try {
      const job = await getGenerationJob(jobId, user, country);
      if (job.status !== 'running') return job;
    } catch {
      // Reintentar: puede ser un corte pasajero, el job sigue vivo.
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed > timeoutMs) {
      throw new Error(
        'La generacion sigue en curso pero se dejo de consultar. ' +
        'Recarga la pagina en unos minutos para ver el resultado.'
      );
    }

    onTick?.(Math.round(elapsed / 1000));
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}

async function generateDictionaryL1T(
  data: GenerateDictionaryL1TRequest,
  user: string,
  country: string
): Promise<GenerateDictionaryL1TResponse> {
  const fetcher = createFetcher(user, country);

  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/dictionary-generator/l1t`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Dictionary JSON Header no encontrado');
    }

    throw new Error('Error al generar diccionario L1T: ' +
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function generateDictionaryLiteCo(
  data: GenerateDictionaryLiteCoRequest,
  user: string,
  country: string
): Promise<GenerationJobAccepted> {
  const fetcher = createFetcher(user, country);

  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/dictionary-generator/lite-co`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Error desconocido');
  }
}

export {
  generateDictionaryJson,
  generateDictionaryBase,
  getGenerationJob,
  getLatestGenerationJob,
  pollGenerationJob,
  generateDictionaryL1T,
  generateDictionaryLiteCo
}; 