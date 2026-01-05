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
  const [completedGenerators, setCompletedGenerators] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('kirby');

  const handleSchemaUpload = (type: 'raw' | 'master', file: File | null) => {
    if (type === 'raw') {
      setRawSchema(file);
    } else {
      setMasterSchema(file);
    }
  };

  const canGenerate = () => {
    if (componentType === 'tabla') {
      return rawSchema !== null && masterSchema !== null;
    } else {
      return masterSchema !== null;
    }
  };

  const handleGeneratorComplete = (generatorId: string) => {
    if (!completedGenerators.includes(generatorId)) {
      setCompletedGenerators(prev => [...prev, generatorId]);
    }
  };

  const tabs = [
    { id: 'kirby', name: '🔵 Kirby', icon: CubeIcon, color: 'blue' },
    { id: 'hammurabi', name: '🟡 Hammurabi', icon: ShieldCheckIcon, color: 'orange' },
    { id: 'smartcleaner', name: '🟣 SmartCleaner', icon: TrashIcon, color: 'purple' },
    { id: 'controlm', name: '🎯 Control-M', icon: Cog6ToothIcon, color: 'green' }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center">
          <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pipeline Generator</h1>
            <p className="text-sm text-gray-600">Generación automática de componentes de ingesta</p>
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
        completedGenerators={completedGenerators}
      />

      {/* Generators */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                
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
            {activeTab === 'kirby' && (
              <KirbyGeneratorPanel
                rawSchema={rawSchema}
                masterSchema={masterSchema}
                componentType={componentType}
                canGenerate={canGenerate()}
                onGenerationComplete={() => handleGeneratorComplete('kirby')}
              />
            )}

            {activeTab === 'hammurabi' && (
              <HammurabiGeneratorPanel
                rawSchema={rawSchema}
                masterSchema={masterSchema}
                componentType={componentType}
                canGenerate={canGenerate()}
                onGenerationComplete={() => handleGeneratorComplete('hammurabi')}
              />
            )}

            {activeTab === 'smartcleaner' && (
              <SmartCleanerGeneratorPanel
                rawSchema={rawSchema}
                masterSchema={masterSchema}
                componentType={componentType}
                canGenerate={canGenerate()}
                onGenerationComplete={() => handleGeneratorComplete('smartcleaner')}
              />
            )}

            {activeTab === 'controlm' && (
              <ControlMGeneratorPanel
                canGenerate={canGenerate()}
                onGenerationComplete={() => handleGeneratorComplete('controlm')}
              />
            )}
          </div>
        </div>
    </div>
  );
};