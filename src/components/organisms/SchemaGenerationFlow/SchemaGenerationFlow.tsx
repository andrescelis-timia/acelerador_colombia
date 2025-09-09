'use client';

import { useState, useCallback } from 'react';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { ProgressDialog } from '@/components/organisms/ProgressDialog';
import { 
  PlayIcon,  
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/context/AuthContext';
import { API_CONFIG } from '@/lib/api/config';
import {SchemaField, SchemaGenerationFlowProps, GenerationStatus, SchemaGenerationResponse } from './types';

export function SchemaGenerationFlow({ objectId }: SchemaGenerationFlowProps) {
  const { user, country } = useAuth();
  const [status, setStatus] = useState<GenerationStatus>({
    isGenerating: false,
    isGenerated: false,
    error: null,
    generatedSchemas: null
  });

  const generateSchemas = useCallback(async () => {
    if (!user?.email) {
      setStatus(prev => ({ ...prev, error: 'Usuario no autenticado' }));
      return;
    }

    setStatus(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null, 
      isGenerated: false 
    }));

    try {
      // Ejecutar la API call y esperar mínimo 5 segundos para mostrar el progreso
      const [response] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/schema-generator/object/${objectId}/schemas`, {
          method: 'GET',
          headers: {
            'X-User': user.email,
            'X-Country': country,
            'Content-Type': 'application/json'
          }
        }),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result: SchemaGenerationResponse = await response.json();
      
      setStatus(prev => ({ 
        ...prev, 
        isGenerating: false, 
        isGenerated: true, 
        generatedSchemas: result 
      }));

    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }));
    }
  }, [objectId, user?.email, country]);

  const formatSchemaJson = useCallback((schema: Record<string, unknown>) => {
    // Reordenar manualmente el schema para garantizar el orden correcto
    const orderedSchema: Record<string, unknown> = {};
    
    // Orden específico para schemas
    const keyOrder = [
      'namespace', 'name', 'doc', 'database', 'storageZone', 'storageType', 
      'securityLevel', 'physicalPath', 'objectVersion', 'partitions', 'type', 'fields'
    ];
    
    // Agregar claves en el orden correcto
    keyOrder.forEach(key => {
      if (schema.hasOwnProperty(key)) {
        orderedSchema[key] = schema[key];
      }
    });
    
    // Agregar cualquier clave adicional que no esté en el orden definido
    Object.keys(schema).forEach(key => {
      if (!keyOrder.includes(key)) {
        orderedSchema[key] = schema[key];
      }
    });
    
    // Formatear con indentación normal
    let formatted = JSON.stringify(orderedSchema, null, 2);
    
    // Comprimir arrays específicos a una sola línea
    // Comprimir partitions
    formatted = formatted.replace(/"partitions":\s*\[\s*([^\]]*?)\s*\]/g, (match, content) => {
      const compactContent = content.replace(/\s+/g, ' ').replace(/,\s*/g, ', ').trim();
      return `"partitions": [${compactContent}]`;
    });
    
    // Comprimir type en fields
    formatted = formatted.replace(/"type":\s*\[\s*([^\]]*?)\s*\]/g, (match, content) => {
      const compactContent = content.replace(/\s+/g, ' ').replace(/,\s*/g, ', ').trim();
      return `"type": [${compactContent}]`;
    });
    
    return formatted;
  }, []);

  const downloadSchema = useCallback((schemaType: 'raw' | 'master' | 'l1t') => {
    if (!status.generatedSchemas) return;

    const schema = status.generatedSchemas.schemas[schemaType];
    if (!schema) return;

    // 1. Condición para excluir los campos de encriptación.
    const isEncrypted = schema.securityLevel === 'L1T';
    const isRaw = schema.storageZone === 'Rawdata';
    
    // 2. Crear una copia limpia del esquema para el proceso de ordenamiento.
    const cleanSchema = { ...schema };
    
    const cleanFields = (schema.fields as SchemaField[]).map(field => {
      const newField = { ...field };
      
      // Limpiar campos de encriptación si no aplica 'L1T'
      if (!isEncrypted) {
        const fieldsToExcludeFromFields = ['encrypted', 'encryptionType', 'encryptionMethod'];
        fieldsToExcludeFromFields.forEach(key => {
          if (!newField[key]) {
            delete newField[key];
          }
        });
      }

      // 4. Limpiar el atributo 'format' si el tipo no es de fecha o timestamp.
      const fieldType = Array.isArray(newField.type) ? newField.type[0] : newField.type;
      if (fieldType !== 'date' && fieldType !== 'timestamp' && 'format' in newField) {
          delete newField.format;
      }
      
      return newField;
    });
    
    cleanSchema.fields = cleanFields;
    if (isRaw) {
      delete cleanSchema.securityLevel;
    }

    const formattedJson = formatSchemaJson(cleanSchema);
    const blob = new Blob([formattedJson], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${schema.name}.schema`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [status.generatedSchemas, formatSchemaJson]);


  return (
    <div className="space-y-6">
      {/* Panel principal */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generación de Schemas</h3>
          <p className="text-sm text-gray-600">Genera archivos .schema (RAW, MASTER, L1T) desde diccionarios base</p>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={generateSchemas}
            disabled={status.isGenerating}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#00A3FF] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.isGenerating ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <PlayIcon className="h-6 w-6 mr-2" />
            )}
            {status.isGenerating ? 'Generando...' : 'Generar Schemas'}
          </button>
        </div>
      </div>


      {/* Panel de descargas */}
      {status.generatedSchemas && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Descargar Schemas</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => downloadSchema('raw')}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">RAW</div>
                <div className="text-xs text-gray-500">HDFS-Avro</div>
              </div>
              <ArrowDownTrayIcon className="h-4 w-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => downloadSchema('master')}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">MASTER</div>
                <div className="text-xs text-gray-500">HDFS-Parquet</div>
              </div>
              <ArrowDownTrayIcon className="h-4 w-4 text-gray-400" />
            </button>
            
            {status.generatedSchemas.has_l1t && status.generatedSchemas.schemas.l1t && (
              <button
                onClick={() => downloadSchema('l1t')}
                className="flex items-center justify-between p-3 border border-orange-200 rounded-md bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">L1T</div>
                  <div className="text-xs text-orange-600">Encriptado</div>
                </div>
                <ArrowDownTrayIcon className="h-4 w-4 text-orange-400" />
              </button>
            )}
          </div>
        </div>
      )}


      {/* Progress Dialog */}
      {status.isGenerating && (
        <ProgressDialog
          title="Generando Schemas"
          steps={[
            { label: "Extrayendo metadatos del objeto", duration: 1500 },
            { label: "Generando schema RAW", duration: 700 },
            { label: "Generando schema MASTER", duration: 700 },
            { label: "Generando schema L1T (si aplica)", duration: 700 }
          ]}
          onComplete={() => {
            // El estado ya se actualiza en el useCallback
          }}
        />
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={!!status.error}
        onClose={() => setStatus(prev => ({ ...prev, error: null }))}
        title="Error al generar schemas"
        message={status.error || ''}
      />
    </div>
  );
}