'use client';

import { useState } from 'react';
import { KirbyGeneratorPanel } from './panels/KirbyGeneratorPanel';
import { HammurabiGeneratorPanel } from './panels/HammurabiGeneratorPanel';
import { SmartCleanerGeneratorPanel } from './panels/SmartCleanerGeneratorPanel';
import { ControlMGeneratorPanel } from './panels/ControlMGeneratorPanel';
import { SchemaUploadSection } from './components/SchemaUploadSection';
import { PipelineGeneratorProps } from './types';
import { 
  CubeIcon, 
  ShieldCheckIcon, 
  TrashIcon, 
  Cog6ToothIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

export const PipelineGenerator = ({ }: PipelineGeneratorProps) => {
  const [rawSchema, setRawSchema] = useState<File | null>(null);
  const [masterSchema, setMasterSchema] = useState<File | null>(null);
  const [componentType, setComponentType] = useState<'tabla' | 'tablon'>('tabla');
  const [selectedGenerators, setSelectedGenerators] = useState<string[]>(['kirby', 'hammurabi', 'smartcleaner']);
  const [activeTab, setActiveTab] = useState<string>('kirby');

  const handleSchemaUpload = (type: 'raw' | 'master', file: File | null) => {
    if (type === 'raw') {
      setRawSchema(file);
    } else {
      setMasterSchema(file);
    }
  };

  const canGenerate = (generator: string) => {
    switch (generator) {
      case 'kirby':
        return componentType === 'tabla' ? (rawSchema && masterSchema) : masterSchema;
      case 'hammurabi':
        return componentType === 'tabla' ? (rawSchema && masterSchema) : masterSchema;
      case 'smartcleaner':
        return componentType === 'tabla' ? (rawSchema && masterSchema) : masterSchema;
      case 'controlm':
        return rawSchema && masterSchema; // Control-M siempre requiere ambos
      default:
        return false;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pipeline Generator
        </h1>
        <p className="text-gray-600">
          Sistema unificado de generación de configuraciones y mallas de orquestación
        </p>
      </div>

      {/* Schema Upload Section */}
      <div className="mb-8">
        <SchemaUploadSection
          rawSchema={rawSchema}
          masterSchema={masterSchema}
          componentType={componentType}
          onSchemaUpload={handleSchemaUpload}
          onComponentTypeChange={setComponentType}
          selectedGenerators={selectedGenerators}
          onGeneratorsChange={setSelectedGenerators}
        />
      </div>

      {/* Generators Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <TabGroup defaultIndex={0}>
          <div className="border-b border-gray-200">
            <TabList className="flex">
              <Tab
                className="flex items-center px-4 py-3 font-medium text-sm border-b-2 border-transparent hover:border-blue-300"
                selectedClassName="text-blue-600 border-blue-500"
              >
                <CubeIcon className="h-5 w-5 mr-2" />
                🔵 Kirby
              </Tab>
              <Tab
                className="flex items-center px-4 py-3 font-medium text-sm border-b-2 border-transparent hover:border-orange-300"
                selectedClassName="text-orange-600 border-orange-500"
              >
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                🟡 Hammurabi
              </Tab>
              <Tab
                className="flex items-center px-4 py-3 font-medium text-sm border-b-2 border-transparent hover:border-purple-300"
                selectedClassName="text-purple-600 border-purple-500"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                🟣 SmartCleaner
              </Tab>
              <Tab
                className="flex items-center px-4 py-3 font-medium text-sm border-b-2 border-transparent hover:border-green-300"
                selectedClassName="text-green-600 border-green-500"
              >
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                🎯 Control-M
              </Tab>
            </TabList>
          </div>

          <TabPanel>
            <KirbyGeneratorPanel
              rawSchema={rawSchema}
              masterSchema={masterSchema}
              componentType={componentType}
              canGenerate={canGenerate('kirby')}
              isSelected={selectedGenerators.includes('kirby')}
            />
          </TabPanel>

          <TabPanel>
            <HammurabiGeneratorPanel
              rawSchema={rawSchema}
              masterSchema={masterSchema}
              componentType={componentType}
              canGenerate={canGenerate('hammurabi')}
              isSelected={selectedGenerators.includes('hammurabi')}
            />
          </TabPanel>

          <TabPanel>
            <SmartCleanerGeneratorPanel
              rawSchema={rawSchema}
              masterSchema={masterSchema}
              componentType={componentType}
              canGenerate={canGenerate('smartcleaner')}
              isSelected={selectedGenerators.includes('smartcleaner')}
            />
          </TabPanel>

          <TabPanel>
            <ControlMGeneratorPanel
              rawSchema={rawSchema}
              masterSchema={masterSchema}
              canGenerate={canGenerate('controlm')}
              isSelected={selectedGenerators.includes('controlm')}
            />
          </TabPanel>
        </TabGroup>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <DocumentTextIcon className="h-6 w-6 text-blue-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Flujo de Procesamiento Completo
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <div><strong>1. Kirby:</strong> CSV → Avro → Parquet (Raw, Master, L1T)</div>
              <div><strong>2. Hammurabi:</strong> Reglas de calidad (2.1, 2.2, 2.3, 3.1, 3.2, 4.2)</div>
              <div><strong>3. SmartCleaner:</strong> Limpieza con retención inteligente</div>
              <div><strong>4. Control-M:</strong> Mallas de orquestación automáticas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};