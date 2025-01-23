import { 
  GenerateDictionaryJsonRequest,
  GenerateDictionaryBaseRequest,
  GenerateDictionaryBaseResponse
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
  } catch (error: unknown) {
    console.error('Error al generar diccionario JSON:', error);
    throw error;
  }
}

async function generateDictionaryBase(data: GenerateDictionaryBaseRequest, user: string, country: string): Promise<GenerateDictionaryBaseResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/dictionary-generator/base`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Diccionario JSON no encontrado');
    }
    console.error('Error al generar diccionario base:', error);
    throw error;
  }
}

export {
  generateDictionaryJson,
  generateDictionaryBase
}; 