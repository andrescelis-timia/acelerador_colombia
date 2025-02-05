import { GenerateRawFilesRequest, AIGeneratorRawFilesResponse, GenerateMasterFilesRequest, AIGeneratorMasterFilesResponse, GenerateL1TMasterFilesRequest, AIGeneratorComponentL1TMasterFilesResponse } from './types';
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

async function generateL1TMasterFiles(
  data: GenerateL1TMasterFilesRequest,
  user: string,
  country: string
): Promise<AIGeneratorComponentL1TMasterFilesResponse> {
  const fetcher = createFetcher(user, country);
  
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/ingesta-components-generator/l1t-master-files`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Dictionary JSON Header no encontrado');
    }
    
    throw new Error('Error al generar archivos L1T master: ' + 
      (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

export {
  generateRawFiles,
  generateMasterFiles,
  generateL1TMasterFiles
}; 