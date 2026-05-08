'use client';

import { useState } from 'react';
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { SchemaUploadSectionProps, ValidationError } from '../types';
import { usePipelineGeneratorService } from '@/services/PipelineGenerator';



export const SchemaUploadSection = ({
  objectId,
  rawSchema,
  masterSchema,
  componentType,
  onSchemaUpload,
  onComponentTypeChange,
}: SchemaUploadSectionProps) => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [schemaPreview, setSchemaPreview] = useState<{ title: string; content: string } | null>(null);
  const pipelineGeneratorService = usePipelineGeneratorService();

  const handlePreviewSchema = async (schema: File, type: 'raw' | 'master') => {
    try {
      const text = await schema.text();
      const parsed = JSON.parse(text);
      setSchemaPreview({
        title: `Schema ${type === 'raw' ? 'Raw' : 'Master'} — ${schema.name}`,
        content: JSON.stringify(parsed, null, 2),
      });
    } catch {
      setSchemaPreview({ title: schema.name, content: 'Error al leer el archivo' });
    }
  };

  const persistSchemas = async (currentRaw: File | null, currentMaster: File | null) => {
    if (!objectId || !currentMaster) return;
    try {
      const masterContent = await currentMaster.text();
      const masterData = JSON.parse(masterContent);
      let rawData = undefined;
      if (currentRaw) {
        const rawContent = await currentRaw.text();
        rawData = JSON.parse(rawContent);
      }
      await pipelineGeneratorService.saveSchemas({
        object_id: objectId,
        raw_schema_data: rawData,
        master_schema_data: masterData,
        component_type: componentType,
        raw_file_name: currentRaw?.name,
        master_file_name: currentMaster.name,
      });
    } catch {
      // non-critical
    }
  };

  const handleFileUpload = async (type: 'raw' | 'master', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Limpiar errores previos
    setValidationErrors([]);

    if (!file.name.endsWith('.schema')) {
      setValidationErrors([{ message: 'Por favor selecciona un archivo .schema válido', severity: 'error' }]);
      return;
    }

    // Primero guardamos el archivo inmediatamente
    onSchemaUpload(type, file);

    // Luego validamos de manera opcional (no bloqueante)
    try {
      const validation = await pipelineGeneratorService.validateSchema(file, type);

      const errors: ValidationError[] = [
        ...validation.errors.map(error => ({
          message: error,
          severity: 'error' as const
        })),
        ...validation.warnings.map(warning => ({
          message: warning,
          severity: 'warning' as const
        }))
      ];

      setValidationErrors(errors);

      // Persistir esquemas si la validacion no tuvo errores
      if (!validation.errors.length) {
        const newRaw = type === 'raw' ? file : rawSchema;
        const newMaster = type === 'master' ? file : masterSchema;
        persistSchemas(newRaw, newMaster);
      }
    } catch (error) {
      // Error de validación (no crítico)
      setValidationErrors([{
        message: `Archivo cargado. Validación opcional falló: ${error instanceof Error ? error.message : 'Error de conexión'}`,
        severity: 'warning'
      }]);
      // Aún así persistir — la validación es opcional
      const newRaw = type === 'raw' ? file : rawSchema;
      const newMaster = type === 'master' ? file : masterSchema;
      persistSchemas(newRaw, newMaster);
    }
  };

  const handleRemoveFile = (type: 'raw' | 'master') => {
    onSchemaUpload(type, null);
    setValidationErrors([]);
  };


  return (
    <>
    <div className="space-y-4">
      {/* Component Type and Schema Upload Combined */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Configuración y Subida de Schemas</h3>

        {/* Component Type Selection */}
        <div className="mb-4 pb-3 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Componente</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="componentType"
                value="tabla"
                checked={componentType === 'tabla'}
                onChange={(e) => onComponentTypeChange(e.target.value as 'tabla' | 'tablon' | 'tabla_no_raw')}
                className="h-4 w-4 text-timia-accent border-gray-300 focus:ring-timia-accent/50"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Tabla (Raw + Master)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="componentType"
                value="tablon"
                checked={componentType === 'tablon'}
                onChange={(e) => onComponentTypeChange(e.target.value as 'tabla' | 'tablon' | 'tabla_no_raw')}
                className="h-4 w-4 text-timia-accent border-gray-300 focus:ring-timia-accent/50"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Tablón (Solo Master)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="componentType"
                value="tabla_no_raw"
                checked={componentType === 'tabla_no_raw'}
                onChange={(e) => onComponentTypeChange(e.target.value as 'tabla' | 'tablon' | 'tabla_no_raw')}
                className="h-4 w-4 text-timia-accent border-gray-300 focus:ring-timia-accent/50"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Tabla (Staging - Master)
              </span>
            </label>
          </div>
        </div>

        {/* Schema Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {componentType === 'tabla' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Schema Raw</label>
              {!rawSchema ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                  <ArrowUpTrayIcon className="mx-auto h-6 w-6 text-gray-400" />
                  <div className="mt-2">
                    <label htmlFor="file-raw" className="cursor-pointer">
                      <span className="block text-xs font-medium text-gray-900">
                        Subir archivo .schema
                      </span>
                      <input
                        id="file-raw"
                        name="file-raw"
                        type="file"
                        accept=".schema"
                        className="sr-only"
                        onChange={(e) => handleFileUpload('raw', e)}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                      <div className="ml-2">
                        <p className="text-xs font-medium text-gray-900">{rawSchema.name}</p>
                        <p className="text-xs text-gray-500">{(rawSchema.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handlePreviewSchema(rawSchema, 'raw')} className="p-1 text-gray-400 hover:text-timia-accent rounded transition-colors" title="Ver schema">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleRemoveFile('raw')} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors" title="Eliminar schema">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schema Master</label>
            {!masterSchema ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <ArrowUpTrayIcon className="mx-auto h-6 w-6 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="file-master" className="cursor-pointer">
                    <span className="block text-xs font-medium text-gray-900">
                      Subir archivo .schema
                    </span>
                    <input
                      id="file-master"
                      name="file-master"
                      type="file"
                      accept=".schema"
                      className="sr-only"
                      onChange={(e) => handleFileUpload('master', e)}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                    <div className="ml-2">
                      <p className="text-xs font-medium text-gray-900">{masterSchema.name}</p>
                      <p className="text-xs text-gray-500">{(masterSchema.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePreviewSchema(masterSchema, 'master')} className="p-1 text-gray-400 hover:text-timia-accent rounded transition-colors" title="Ver schema">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleRemoveFile('master')} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors" title="Eliminar schema">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Validaciones</h3>
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <div key={index} className={`flex items-start space-x-2 p-2 rounded-lg ${error.severity === 'error' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                {error.severity === 'error' ? (
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <InformationCircleIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                )}
                <div className={`text-sm font-medium ${error.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                  {error.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

      {schemaPreview && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSchemaPreview(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{schemaPreview.title}</h2>
              <button onClick={() => setSchemaPreview(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-auto p-4">
              <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">{schemaPreview.content}</pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
};