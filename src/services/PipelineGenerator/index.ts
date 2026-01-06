import { useAuth } from '@/lib/context/AuthContext';
import {
  ProcessSchemaRequest,
  ProcessSchemaResponse,
  GenerateKirbyRequest,
  GenerateKirbyResponse,
  GenerateHammurabiRequest,
  GenerateHammurabiResponse,
  GenerateSmartCleanerRequest,
  GenerateSmartCleanerResponse,
  GenerateControlMRequest,
  GenerateControlMResponse,
  PipelineGeneratorException,
  GeneratorType
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class PipelineGeneratorService {
  constructor(private user?: string | null, private country?: string) {}
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.user || !this.country) {
      throw new Error('Usuario y país son requeridos');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pipeline-generator${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-User': this.user,
          'X-Country': this.country,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new PipelineGeneratorException(
          `HTTP_${response.status}`,
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof PipelineGeneratorException) {
        throw error;
      }
      
      throw new PipelineGeneratorException(
        'NETWORK_ERROR',
        `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  private async makeFormDataRequest<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    if (!this.user || !this.country) {
      throw new Error('Usuario y país son requeridos');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pipeline-generator${endpoint}`, {
        method: 'POST',
        headers: {
          'X-User': this.user,
          'X-Country': this.country,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new PipelineGeneratorException(
          `HTTP_${response.status}`,
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof PipelineGeneratorException) {
        throw error;
      }
      
      throw new PipelineGeneratorException(
        'NETWORK_ERROR',
        `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  // ========================
  // PROCESAMIENTO DE SCHEMAS
  // ========================

  async processSchema(request: ProcessSchemaRequest): Promise<ProcessSchemaResponse> {
    const formData = new FormData();
    formData.append('schema_file', request.schemaFile);

    return this.makeFormDataRequest<ProcessSchemaResponse>('/schema/process', formData);
  }

  async validateSchema(schemaFile: File, expectedType: 'raw' | 'master'): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const formData = new FormData();
    formData.append('schema_file', schemaFile);
    formData.append('expected_type', expectedType);

    return this.makeFormDataRequest('/schema/validate', formData);
  }

  // ========================
  // GENERADORES INDIVIDUALES
  // ========================

  async generateKirby(request: GenerateKirbyRequest): Promise<GenerateKirbyResponse> {
    return this.makeRequest<GenerateKirbyResponse>('/generators/kirby', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateHammurabi(request: GenerateHammurabiRequest): Promise<GenerateHammurabiResponse> {
    return this.makeRequest<GenerateHammurabiResponse>('/generators/hammurabi', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateSmartCleaner(request: GenerateSmartCleanerRequest): Promise<GenerateSmartCleanerResponse> {
    return this.makeRequest<GenerateSmartCleanerResponse>('/generators/smartcleaner', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateControlM(request: GenerateControlMRequest): Promise<GenerateControlMResponse> {
    const formData = new FormData();
    
    // Agregar archivos XML si existen
    if (request.xml1) {
      formData.append('xml1', request.xml1);
    }
    if (request.xml2) {
      formData.append('xml2', request.xml2);
    }
    
    // Agregar datos JSON
    formData.append('jobs_list', JSON.stringify(request.jobsList));
    formData.append('component_type', request.componentType);
    formData.append('datax_config', JSON.stringify(request.dataxConfig));

    return this.makeFormDataRequest<GenerateControlMResponse>('/generators/controlm', formData);
  }

  // ========================
  // UTILIDADES
  // ========================

  async downloadFile(downloadUrl: string, fileName: string): Promise<void> {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new PipelineGeneratorException(
        'DOWNLOAD_ERROR',
        `Error al descargar ${fileName}: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  // ========================
  // HELPERS PARA COMPONENTES
  // ========================

  generateProgressSteps(generator: GeneratorType): string[] {
    const baseSteps = [
      'Validando schemas',
      'Analizando estructura de datos',
      'Generando configuraciones'
    ];

    switch (generator) {
      case 'kirby':
        return [
          ...baseSteps,
          'Creando jobs de ingesta',
          'Generando archivos Raw',
          'Generando archivos Master',
          'Configurando L1T (si aplica)'
        ];

      case 'hammurabi':
        return [
          ...baseSteps,
          'Analizando reglas de calidad',
          'Generando reglas 2.x (Completitud)',
          'Generando reglas 3.x (Validación)',
          'Generando reglas 4.x (Duplicados)',
          'Creando configuraciones por fase'
        ];

      case 'smartcleaner':
        return [
          ...baseSteps,
          'Calculando políticas de retención',
          'Configurando limpieza Raw',
          'Configurando limpieza Master',
          'Generando jobs de mantenimiento'
        ];

      case 'controlm':
        return [
          'Validando archivos XML',
          'Procesando lista de jobs',
          'Analizando dependencias',
          'Generando malla Datax Desarrollo',
          'Generando malla Datax Producción',
          'Generando malla Ingesta Desarrollo',
          'Generando malla Ingesta Producción',
          'Validando secuencias'
        ];

      default:
        return baseSteps;
    }
  }
}

// Factory function para crear instancias con auth
export const createPipelineGeneratorService = (user: string | null, country: string) => {
  return new PipelineGeneratorService(user, country);
};

// Hook para usar con AuthContext
export const usePipelineGeneratorService = () => {
  const { user, country } = useAuth();
  return createPipelineGeneratorService(user?.email || null, country);
};

// Named exports para uso específico
export { PipelineGeneratorService };
export * from './types';