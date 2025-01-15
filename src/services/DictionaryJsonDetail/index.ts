import { DictionaryJsonDetailResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getDictionaryJsonDetailsByHeaderId(headerId: string): Promise<DictionaryJsonDetailResponse[]> {
  try {
    const response = await fetch(`${API_URL}/dictionary-json-details/header/${headerId}`);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Error al obtener detalles del diccionario: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error al obtener detalles del diccionario:', error);
    throw error;
  }
}

export {
  getDictionaryJsonDetailsByHeaderId
}; 