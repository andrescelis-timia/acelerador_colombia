'use client';

import { useState } from 'react';
import { 
  ArrowUpTrayIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { SchemaUploadSectionProps, ValidationError } from '../types';
import { usePipelineGeneratorService } from '@/services/PipelineGenerator';
import { PipelineProgressBar } from '@/components/molecules/PipelineProgressBar';

export const SchemaUploadSection = ({
  rawSchema,
  masterSchema,
  componentType,
  onSchemaUpload,
  onComponentTypeChange,
  completedGenerators = []
}: SchemaUploadSectionProps) => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const pipelineGeneratorService = usePipelineGeneratorService();


  const handleFileUpload = async (type: 'raw' | 'master', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.schema')) {
      setValidationErrors([{ message: 'Por favor selecciona un archivo .schema válido', severity: 'error' }]);
      return;
    }

    try {
      const validation = await pipelineGeneratorService.validateSchema(file, type);
      
      console.log('Validation result:', validation);
      
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

      if (validation.is_valid) {
        console.log('Schema válido, subiendo archivo:', file.name);
        onSchemaUpload(type, file);
      } else {
        console.log('Schema inválido:', validation.errors);
      }
      
    } catch (error) {
      setValidationErrors([{ 
        message: `Error validando schema: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        severity: 'error' 
      }]);
    }
  };

  const handleRemoveFile = (type: 'raw' | 'master') => {
    onSchemaUpload(type, null);
    setValidationErrors([]);
  };


  const FileUploadCard = ({ type, file, title }: { type: 'raw' | 'master', file: File | null, title: string }) => (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
          <ArrowUpTrayIcon className="mx-auto h-8 w-8 text-gray-400" />
          <div className="mt-2">
            <label htmlFor={`file-${type}`} className="cursor-pointer">
              <span className="block text-sm font-medium text-gray-900">
                Haz clic para subir archivo .schema
              </span>
              <input
                id={`file-${type}`}
                name={`file-${type}`}
                type="file"
                accept=".schema"
                className="sr-only"
                onChange={(e) => handleFileUpload(type, e)}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">Solo archivos .schema</p>
          </div>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveFile(type)}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Component Type and Schema Upload Combined */}
      <div className="bg-white rounded-lg shadow-md p-4">
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
                onChange={(e) => onComponentTypeChange(e.target.value as 'tabla' | 'tablon')}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
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
                onChange={(e) => onComponentTypeChange(e.target.value as 'tabla' | 'tablon')}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Tablón (Solo Master)
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFile('raw')}
                      className="p-1"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </Button>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFile('master')}
                    className="p-1"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Progress */}
      <PipelineProgressBar completedGenerators={completedGenerators} />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Validaciones</h3>
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <div key={index} className={`flex items-start space-x-2 p-2 rounded-lg ${
                error.severity === 'error' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {error.severity === 'error' ? (
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <InformationCircleIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                )}
                <div className={`text-sm font-medium ${
                  error.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {error.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};