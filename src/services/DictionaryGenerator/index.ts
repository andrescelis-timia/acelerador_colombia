import { GenerateDictionaryRequest, GenerateDictionaryResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function generateDictionary(data: GenerateDictionaryRequest): Promise<GenerateDictionaryResponse> {
  try {
    const response = await fetch(`${API_URL}/dictionary-generator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al generar diccionario');
    return await response.json();
  } catch (error) {
    console.error('Error al generar diccionario:', error);
    throw error;
  }
}

export {
  generateDictionary
}; 