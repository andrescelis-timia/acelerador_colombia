import {
  GenerateDictionaryJsonRequest,
  GenerateDictionaryBaseRequest,
  GenerateDictionaryBaseResponse,
  GenerateDictionaryL1TRequest,
  GenerateDictionaryL1TResponse,
  GenerateDictionaryLiteCoRequest,
  GenerateDictionaryLiteCoResponse
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

async function generateDictionaryBase(data: GenerateDictionaryBaseRequest, user: string, country: string): Promise<GenerateDictionaryBaseResponse> {
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
): Promise<GenerateDictionaryLiteCoResponse> {
  const fetcher = createFetcher(user, country);

  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/dictionary-generator/lite-co`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    throw new Error('Error al generar diccionario lite: ' +
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export {
  generateDictionaryJson,
  generateDictionaryBase,
  generateDictionaryL1T,
  generateDictionaryLiteCo
}; 