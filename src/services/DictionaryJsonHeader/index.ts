import { DictionaryJsonHeaderResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getDictionaryJsonHeader(objectId: string): Promise<DictionaryJsonHeaderResponse | null> {
  try {
    const response = await fetch(`${API_URL}/dictionary-json-headers/object/${objectId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error al obtener diccionario JSON header: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error al obtener diccionario JSON header:', error);
    throw error;
  }
}

export {
  getDictionaryJsonHeader
}; 