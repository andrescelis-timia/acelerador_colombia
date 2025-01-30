import { GenerateRawFilesRequest, AIGeneratorRawFilesResponse, GenerateMasterFilesRequest, AIGeneratorMasterFilesResponse } from './types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function generateRawFiles(
  data: GenerateRawFilesRequest,
  user: string,
  country: string
): Promise<AIGeneratorRawFilesResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/ingesta-components-generator/raw-files`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    throw new Error('Error al generar archivos raw: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function generateMasterFiles(
  data: GenerateMasterFilesRequest, 
  user: string, 
  country: string
): Promise<AIGeneratorMasterFilesResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/ingesta-components-generator/master-files`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    throw new Error('Error al generar archivos master: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export {
  generateRawFiles,
  generateMasterFiles
}; 