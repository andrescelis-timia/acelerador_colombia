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
  const [selectedGenerators, setSelectedGenerators] = useState<string[]>(['kirby']);
  const [activeTab, setActiveTab] = useState<string>('kirby');

  const handleSchemaUpload = (type: 'raw' | 'master', file: File | null) => {
    if (type === 'raw') {
      setRawSchema(file);
    } else {
      setMasterSchema(file);
    }
  };

  const canGenerate = (generator: string) => {
    if (componentType === 'tabla') {
      return rawSchema !== null && masterSchema !== null;
    } else {
      return masterSchema !== null;
    }
  };

  const tabs = [
    { id: 'kirby', name: '🔵 Kirby', icon: CubeIcon, color: 'blue' },
    { id: 'hammurabi', name: '🟡 Hammurabi', icon: ShieldCheckIcon, color: 'orange' },
    { id: 'smartcleaner', name: '🟣 SmartCleaner', icon: TrashIcon, color: 'purple' },
    { id: 'controlm', name: '🎯 Control-M', icon: Cog6ToothIcon, color: 'green' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Generator</h1>
            <p className="text-gray-600">Generación automática de componentes de ingesta</p>
          </div>
        </div>
      </div>

      {/* Schema Upload Section */}
      <SchemaUploadSection
        rawSchema={rawSchema}
        masterSchema={masterSchema}
        componentType={componentType}
        onSchemaUpload={handleSchemaUpload}
        onComponentTypeChange={setComponentType}
        selectedGenerators={selectedGenerators}
        onGeneratorsChange={setSelectedGenerators}
      />

      {/* Generators */}
      {selectedGenerators.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isSelected = selectedGenerators.includes(tab.id);
                
                if (!isSelected) return null;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors
                      ${isActive 
                        ? 'text-blue-600 border-blue-500'
                        : 'text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-300'
                      }
                    `}
                  >
                    <tab.icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'kirby' && selectedGenerators.includes('kirby') && (
              <KirbyGeneratorPanel
                rawSchema={rawSchema}
                masterSchema={masterSchema}
                componentType={componentType}
                canGenerate={canGenerate('kirby')}
                isSelected={selectedGenerators.includes('kirby')}
              />
            )}

            {activeTab === 'hammurabi' && selectedGenerators.includes('hammurabi') && (
              <HammurabiGeneratorPanel
                rawSchema={rawSchema}
                masterSchema={masterSchema}
                componentType={componentType}
                canGenerate={canGenerate('hammurabi')}
                isSelected={selectedGenerators.includes('hammurabi')}
              />
            )}

            {activeTab === 'smartcleaner' && selectedGenerators.includes('smartcleaner') && (
              <SmartCleanerGeneratorPanel
                rawSchema={rawSchema}
                masterSchema={masterSchema}
                componentType={componentType}
                canGenerate={canGenerate('smartcleaner')}
                isSelected={selectedGenerators.includes('smartcleaner')}
              />
            )}

            {activeTab === 'controlm' && selectedGenerators.includes('controlm') && (
              <ControlMGeneratorPanel
                rawSchema={rawSchema}
                masterSchema={masterSchema}
                componentType={componentType}
                canGenerate={canGenerate('controlm')}
                isSelected={selectedGenerators.includes('controlm')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};