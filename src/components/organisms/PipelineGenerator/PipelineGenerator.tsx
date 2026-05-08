'use client';

import { useState, useEffect } from 'react';
import { KirbyGeneratorPanel } from './panels/KirbyGeneratorPanel';
import { HammurabiGeneratorPanel } from './panels/HammurabiGeneratorPanel';
import { SmartCleanerGeneratorPanel } from './panels/SmartCleanerGeneratorPanel';
import { SchemaUploadSection } from './components/SchemaUploadSection';
import { PipelineGeneratorProps } from './types';
import { usePipelineGeneratorService, GeneratedArtifactsResponse } from '@/services/PipelineGenerator';
import { CubeIcon, ShieldCheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { SampleAnalysis } from '@/components/organisms/SampleAnalysis';

export const PipelineGenerator = ({ objectId, readOnly }: PipelineGeneratorProps) => {
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

        // Restaurar esquemas desde artefacto
        const schemasData = response.artifacts.schemas?.artifacts_data;
        if (schemasData) {
          if (schemasData.component_type) {
            setComponentType(schemasData.component_type);
          }
          if (schemasData.master_schema_data) {
            const masterBlob = new Blob([JSON.stringify(schemasData.master_schema_data)], { type: 'application/json' });
            setMasterSchema(new File([masterBlob], schemasData.master_file_name || 'master.schema'));
          }
          if (schemasData.raw_schema_data) {
            const rawBlob = new Blob([JSON.stringify(schemasData.raw_schema_data)], { type: 'application/json' });
            setRawSchema(new File([rawBlob], schemasData.raw_file_name || 'raw.schema'));
          }
        }
      } catch {
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

  const handleGeneratorComplete = async (generatorId: string) => {
    if (!completedGenerators.includes(generatorId)) {
      setCompletedGenerators(prev => [...prev, generatorId]);
    }
    // Refrescar artefactos guardados para que al cambiar de tab se muestren los datos actualizados
    if (objectId) {
      try {
        const response = await pipelineService.getGeneratedArtifacts(objectId);
        setSavedArtifacts(response.artifacts);
      } catch {
        // Silencioso - el estado local del panel actual sigue siendo válido
      }
    }
  };

  const tabs = [
    { id: 'kirby', name: 'Kirby', icon: CubeIcon, accent: 'text-blue-500' },
    { id: 'hammurabi', name: 'Hammurabi', icon: ShieldCheckIcon, accent: 'text-amber-500' },
    { id: 'smartcleaner', name: 'SmartCleaner', icon: TrashIcon, accent: 'text-purple-500' }
  ];

  return (
    <div className="space-y-4">
      {/* Schema Upload Section */}
      <SchemaUploadSection
        objectId={objectId}
        rawSchema={rawSchema}
        masterSchema={masterSchema}
        componentType={componentType}
        onSchemaUpload={handleSchemaUpload}
        onComponentTypeChange={setComponentType}
      />

      <SampleAnalysis objectId={objectId} initialData={savedArtifacts?.sample} />
      {/* Generators */}
      <div className="bg-white rounded-lg border border-gray-200">
          {/* Tab Navigation */}
          <nav className="flex border-b border-gray-200 px-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isCompleted = completedGenerators.includes(tab.id);

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-colors border-b-2 -mb-px
                    ${isActive
                      ? 'text-timia-accent border-timia-accent'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                  <tab.icon className={`h-5 w-5 ${tab.accent}`} />
                  {tab.name}
                  {isCompleted && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                </button>
              );
            })}
          </nav>

          {/* Tab Content */}
          <div>
            {loadingArtifacts && (
              <div className="p-6 text-center text-gray-500">
                Cargando artefactos guardados...
              </div>
            )}

            {!loadingArtifacts && (
              <>
                <div className={activeTab === 'kirby' ? '' : 'hidden'}>
                  <KirbyGeneratorPanel
                    objectId={objectId}
                    rawSchema={rawSchema}
                    masterSchema={masterSchema}
                    componentType={componentType}
                    canGenerate={canGenerate() && !readOnly}
                    onGenerationComplete={() => handleGeneratorComplete('kirby')}
                    initialData={savedArtifacts?.kirby}
                  />
                </div>
                <div className={activeTab === 'hammurabi' ? '' : 'hidden'}>
                  <HammurabiGeneratorPanel
                    objectId={objectId}
                    rawSchema={rawSchema}
                    masterSchema={masterSchema}
                    componentType={componentType}
                    canGenerate={canGenerate() && !readOnly}
                    onGenerationComplete={() => handleGeneratorComplete('hammurabi')}
                    initialData={savedArtifacts?.hammurabi}
                  />
                </div>
                <div className={activeTab === 'smartcleaner' ? '' : 'hidden'}>
                  <SmartCleanerGeneratorPanel
                    objectId={objectId}
                    rawSchema={rawSchema}
                    masterSchema={masterSchema}
                    componentType={componentType}
                    canGenerate={canGenerate() && !readOnly}
                    onGenerationComplete={() => handleGeneratorComplete('smartcleaner')}
                    initialData={savedArtifacts?.smartcleaner}
                  />
                </div>
              </>
            )}
          </div>
        </div>
    </div>
  );
};