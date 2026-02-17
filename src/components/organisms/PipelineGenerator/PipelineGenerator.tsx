'use client';

import { useState, useEffect } from 'react';
import { KirbyGeneratorPanel } from './panels/KirbyGeneratorPanel';
import { HammurabiGeneratorPanel } from './panels/HammurabiGeneratorPanel';
import { SmartCleanerGeneratorPanel } from './panels/SmartCleanerGeneratorPanel';
import { SchemaUploadSection } from './components/SchemaUploadSection';
import { PipelineGeneratorProps } from './types';
import { usePipelineGeneratorService, GeneratedArtifactsResponse } from '@/services/PipelineGenerator';
import {
  CubeIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export const PipelineGenerator = ({ objectId }: PipelineGeneratorProps) => {
  const [rawSchema, setRawSchema] = useState<File | null>(null);
  const [masterSchema, setMasterSchema] = useState<File | null>(null);
  const [componentType, setComponentType] = useState<'tabla' | 'tablon'>('tabla');
  const [completedGenerators, setCompletedGenerators] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('kirby');
  const [savedArtifacts, setSavedArtifacts] = useState<GeneratedArtifactsResponse['artifacts'] | null>(null);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);

  const pipelineService = usePipelineGeneratorService();

  // Cargar artefactos guardados cuando hay objectId
  useEffect(() => {
    const loadSavedArtifacts = async () => {
      if (!objectId) return;

      setLoadingArtifacts(true);
      try {
        const response = await pipelineService.getGeneratedArtifacts(objectId);
        setSavedArtifacts(response.artifacts);

        // Marcar como completados los generadores que tienen artefactos
        const completed: string[] = [];
        if (response.artifacts.kirby) completed.push('kirby');
        if (response.artifacts.hammurabi) completed.push('hammurabi');
        if (response.artifacts.smartcleaner) completed.push('smartcleaner');
        setCompletedGenerators(completed);
      } catch (error) {
        // No hay artefactos guardados, es normal
        console.log('No hay artefactos guardados para este objeto');
      } finally {
        setLoadingArtifacts(false);
      }
    };

    loadSavedArtifacts();
  }, [objectId]);

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
    { id: 'smartcleaner', name: '🟣 SmartCleaner', icon: TrashIcon, color: 'purple' }
  ];

  return (
    <div className="space-y-4">
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
            {loadingArtifacts && (
              <div className="p-6 text-center text-gray-500">
                Cargando artefactos guardados...
              </div>
            )}

            {!loadingArtifacts && activeTab === 'kirby' && (
              <KirbyGeneratorPanel
                objectId={objectId}
                rawSchema={rawSchema}
                masterSchema={masterSchema}
                componentType={componentType}
                canGenerate={canGenerate()}
                onGenerationComplete={() => handleGeneratorComplete('kirby')}
                initialData={savedArtifacts?.kirby}
              />
            )}

            {!loadingArtifacts && activeTab === 'hammurabi' && (
              <HammurabiGeneratorPanel
                objectId={objectId}
                rawSchema={rawSchema}
                masterSchema={masterSchema}
                componentType={componentType}
                canGenerate={canGenerate()}
                onGenerationComplete={() => handleGeneratorComplete('hammurabi')}
                initialData={savedArtifacts?.hammurabi}
              />
            )}

            {!loadingArtifacts && activeTab === 'smartcleaner' && (
              <SmartCleanerGeneratorPanel
                objectId={objectId}
                rawSchema={rawSchema}
                masterSchema={masterSchema}
                componentType={componentType}
                canGenerate={canGenerate()}
                onGenerationComplete={() => handleGeneratorComplete('smartcleaner')}
                initialData={savedArtifacts?.smartcleaner}
              />
            )}
          </div>
        </div>
    </div>
  );
};