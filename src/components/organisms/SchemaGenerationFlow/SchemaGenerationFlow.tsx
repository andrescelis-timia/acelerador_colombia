'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import {
  PlayIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/lib/context/AuthContext';
import { API_CONFIG } from '@/lib/api/config';
import { Button } from '@/components/atoms/Button';
import { getById as getObjectById, updateData as updateObjectData } from '@/services/Object';
import type { ObjectUpdateWithId } from '@/services/Object/types';
import {SchemaField, SchemaGenerationFlowProps, GenerationStatus, SchemaGenerationResponse } from './types';

const URL_PATTERN = /^https?:\/\/[\w\-.]+\.[a-zA-Z]{2,}[/\w\-._~:/?#@!$&'()*+,;=]*$/;

export function SchemaGenerationFlow({ objectId }: SchemaGenerationFlowProps) {
  const { user, country } = useAuth();
  const [sourceMode, setSourceMode] = useState<'db' | 'external'>('db');
  const [externalUrl, setExternalUrl] = useState('');
  const [status, setStatus] = useState<GenerationStatus>({
    isGenerating: false,
    isGenerated: false,
    error: null,
    generatedSchemas: null
  });
  const [objectData, setObjectData] = useState<ObjectUpdateWithId | null>(null);
  const [flagL1t, setFlagL1t] = useState(false);
  const [savingFlag, setSavingFlag] = useState(false);

  const externalUrlValid = URL_PATTERN.test(externalUrl.trim());

  useEffect(() => {
    if (!objectId || !user?.email) return;
    getObjectById(objectId, user.email, country)
      .then(obj => {
        if (!obj) return;
        setObjectData(obj);
        setFlagL1t(!!obj.flag_l1t);
      })
      .catch(() => {});
  }, [objectId, user?.email, country]);

  const handleToggleL1T = useCallback(async (checked: boolean) => {
    if (!user?.email || !objectData) return;
    setFlagL1t(checked);
    setSavingFlag(true);
    try {
      await updateObjectData({ ...objectData, flag_l1t: checked } as ObjectUpdateWithId, user.email, country);
      setObjectData({ ...objectData, flag_l1t: checked });
    } catch {
      // revertir el toggle si falla la persistencia
      setFlagL1t(!checked);
    } finally {
      setSavingFlag(false);
    }
  }, [user?.email, country, objectData]);

  const generateSchemas = useCallback(async () => {
    if (!user?.email) {
      setStatus(prev => ({ ...prev, error: 'Usuario no autenticado' }));
      return;
    }
    if (sourceMode === 'external' && !externalUrlValid) {
      setStatus(prev => ({ ...prev, error: 'URL externa invalida' }));
      return;
    }

    setStatus(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      isGenerated: false
    }));

    try {
      const endpoint = `${API_CONFIG.BASE_URL}/schema-generator/object/${objectId}/schemas`;
      const body = sourceMode === 'external' ? { external_url: externalUrl.trim() } : {};

      const [response] = await Promise.all([
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'X-User': user.email,
            'X-Country': country,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
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
  }, [objectId, user?.email, country, sourceMode, externalUrl, externalUrlValid]);

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
      if (newField.format === null) {
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


  const generateDisabled =
    status.isGenerating ||
    (sourceMode === 'external' && !externalUrlValid);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-900">Generación de Schemas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Genera archivos <span className="font-medium text-gray-700">.schema</span> (RAW, MASTER{flagL1t ? ', L1T' : ''}) a partir del diccionario del objeto o de un URL externo.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={generateSchemas}
              disabled={generateDisabled}
              className="flex items-center"
              variant="primary"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              {status.isGenerating ? 'Generando...' : 'Generar'}
            </Button>

            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSourceMode('db')}
                disabled={status.isGenerating}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  sourceMode === 'db'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Desde BD
              </button>
              <button
                onClick={() => setSourceMode('external')}
                disabled={status.isGenerating}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  sourceMode === 'external'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                URL externa
              </button>
            </div>

            {status.generatedSchemas && !status.isGenerating && (
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                {Object.values(status.generatedSchemas.schemas).filter(Boolean).length} schemas
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={flagL1t}
              onChange={(e) => handleToggleL1T(e.target.checked)}
              disabled={savingFlag || status.isGenerating}
              className="h-4 w-4 text-timia-accent rounded border-gray-300 focus:ring-timia-accent/50"
            />
            <span>Tiene L1T</span>
            {savingFlag && <span className="text-xs text-gray-400">guardando</span>}
          </label>
        </div>

        {sourceMode === 'external' && (
          <div className="mb-3">
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              disabled={status.isGenerating}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                externalUrl && !externalUrlValid
                  ? 'border-red-300 focus:ring-red-400'
                  : 'border-gray-300 focus:ring-timia-accent/50'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              {externalUrl && !externalUrlValid
                ? 'URL invalida'
                : 'Generacion one-shot: no persiste el diccionario.'}
            </p>
          </div>
        )}

        {status.generatedSchemas && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Descargar</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => downloadSchema('raw')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">RAW</span>
                <span className="text-xs text-gray-500">Avro</span>
              </button>

              <button
                onClick={() => downloadSchema('master')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">MASTER</span>
                <span className="text-xs text-gray-500">Parquet</span>
              </button>

              {status.generatedSchemas.has_l1t && status.generatedSchemas.schemas.l1t && (
                <button
                  onClick={() => downloadSchema('l1t')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-orange-200 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 text-orange-400" />
                  <span className="font-medium text-gray-900">L1T</span>
                  <span className="text-xs text-orange-600">Encriptado</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>


      {status.isGenerating && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-timia-accent" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Generando schemas...</span>
          </div>
        </div>,
        document.body
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