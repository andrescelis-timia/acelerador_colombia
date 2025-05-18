import { GenerateTableRequest, GenerateTableResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function generateTable(data: GenerateTableRequest, user: string, country: string): Promise<GenerateTableResponse | null> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_CONFIG.BASE_URL}/mer/create-table`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response) return null;
    return response;
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw new Error('Error al generar la tabla: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export {
  generateTable
}; 