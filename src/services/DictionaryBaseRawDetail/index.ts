import { DictionaryBaseRawDetailResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getDictionaryBaseRawDetailsByHeaderId(headerId: string, user: string, country: string): Promise<DictionaryBaseRawDetailResponse[]> {
  const fetcher = createFetcher(user, country);
  
  try {
    const response = await fetcher(`${API_URL}/dictionary-base-raw-details/header/${headerId}`);
    if (!response) return [];
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return [];
    }
    
    console.error('Error al obtener detalles de diccionario base raw:', error);
    throw error;
  }
}

export {
  getDictionaryBaseRawDetailsByHeaderId
}; 