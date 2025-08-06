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

export const SchemaUploadSection = ({
  rawSchema,
  masterSchema,
  componentType,
  onSchemaUpload,
  onComponentTypeChange,
  selectedGenerators,
  onGeneratorsChange
}: SchemaUploadSectionProps) => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const pipelineGeneratorService = usePipelineGeneratorService();

  const validateSchemaFile = async (file: File, expectedType: 'raw' | 'master'): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    try {
      const content = await file.text();
      const schema = JSON.parse(content);
      
      // Validaciones básicas
      if (!schema.name) {
        errors.push({ field: 'name', message: 'El schema debe tener un nombre', severity: 'error' });
      }
      
      if (!schema.namespace) {
        errors.push({ field: 'namespace', message: 'El schema debe tener un namespace', severity: 'error' });
      }
      
      if (!schema.database) {
        errors.push({ field: 'database', message: 'El schema debe especificar la database', severity: 'error' });
      } else if (schema.database !== expectedType) {
        errors.push({ 
          field: 'database', 
          message: `Se esperaba database="${expectedType}" pero se encontró "${schema.database}"`, 
          severity: 'error' 
        });
      }
      
      if (!schema.fields || !Array.isArray(schema.fields) || schema.fields.length === 0) {
        errors.push({ field: 'fields', message: 'El schema debe tener al menos un campo', severity: 'error' });
      }
      
      if (!schema.partitions || !Array.isArray(schema.partitions) || schema.partitions.length === 0) {
        errors.push({ field: 'partitions', message: 'El schema debe tener al menos una partición', severity: 'warning' });
      }
      
      // Validación específica para L1T
      if (schema.securityLevel === 'L2') {
        errors.push({ 
          field: 'securityLevel', 
          message: 'Schema con securityLevel L2 - se generará L1T automáticamente', 
          severity: 'warning' 
        });
      }
      
    } catch (parseError) {
      errors.push({ field: 'file', message: 'Error al parsear el archivo JSON', severity: 'error' });
    }
    
    return errors;
  };

  const handleFileUpload = async (type: 'raw' | 'master', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.schema')) {
      setValidationErrors([{ field: 'file', message: 'Por favor selecciona un archivo .schema válido', severity: 'error' }]);
      return;
    }

    try {
      const validation = await pipelineGeneratorService.validateSchema(file, type);
      
      console.log('Validation result:', validation);
      
      const errors: ValidationError[] = [
        ...validation.errors.map(error => ({ 
          field: 'validation', 
          message: error, 
          severity: 'error' as const 
        })),
        ...validation.warnings.map(warning => ({ 
          field: 'validation', 
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
        field: 'service', 
        message: `Error validando schema: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        severity: 'error' 
      }]);
    }
  };

  const handleRemoveFile = (type: 'raw' | 'master') => {
    onSchemaUpload(type, null);
    setValidationErrors([]);
  };

  const toggleGenerator = (generator: string) => {
    if (selectedGenerators.includes(generator)) {
      onGeneratorsChange(selectedGenerators.filter(g => g !== generator));
    } else {
      onGeneratorsChange([...selectedGenerators, generator]);
    }
  };

  const FileUploadCard = ({ type, file, title }: { type: 'raw' | 'master', file: File | null, title: string }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor={`file-${type}`} className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
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
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
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
    <div className="space-y-6">
      {/* Component Type Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Componente</h3>
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

      {/* Schema Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {componentType === 'tabla' && (
          <FileUploadCard
            type="raw"
            file={rawSchema}
            title="Schema Raw"
          />
        )}
        <FileUploadCard
          type="master"
          file={masterSchema}
          title="Schema Master"
        />
      </div>

      {/* Generator Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generadores a Ejecutar</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'kirby', name: '🔵 Kirby', description: 'Ingesta CSV → Avro → Parquet' },
            { id: 'hammurabi', name: '🟡 Hammurabi', description: 'Reglas de calidad de datos' },
            { id: 'smartcleaner', name: '🟣 SmartCleaner', description: 'Limpieza con retención' },
            { id: 'controlm', name: '🎯 Control-M', description: 'Mallas de orquestación' }
          ].map((generator) => (
            <label key={generator.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedGenerators.includes(generator.id)}
                onChange={() => toggleGenerator(generator.id)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{generator.name}</div>
                <div className="text-xs text-gray-500">{generator.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Validaciones</h3>
          <div className="space-y-3">
            {validationErrors.map((error, index) => (
              <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                error.severity === 'error' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {error.severity === 'error' ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                ) : (
                  <InformationCircleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                )}
                <div>
                  <div className={`text-sm font-medium ${
                    error.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {error.field}
                  </div>
                  <div className={`text-sm ${
                    error.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {error.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};