'use client';

import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { TabGroup } from '@/components/molecules/TabGroup';
import { TabList } from '@/components/molecules/TabList';
import { Tab } from '@/components/atoms/Tab';
import { TabPanel } from '@/components/atoms/TabPanel';
import { ObjectDetailContentProps } from './types';
import { DataGovernmentFlow } from '@/components/organisms/DataGovernmentFlow';
import { useAuth } from '@/lib/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { SchemaGenerationFlow } from '@/components/organisms/SchemaGenerationFlow';
import { PipelineGenerator } from '@/components/organisms/PipelineGenerator';
import { ControlMFlow } from '@/components/organisms/ControlMFlow';
import { DeployADA } from '@/components/organisms/DeployADA';
import { useProjectRole } from '@/hooks/useProjectRole';

export const ObjectDetailContent = ({ objectId, objectName, projectId }: ObjectDetailContentProps) => {
  const { country, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { isReadOnly } = useProjectRole(projectId ?? null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <button
        onClick={() => window.history.back()}
        className="flex items-center space-x-2 text-[#666666] hover:text-gray-900 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span>Volver a Objetos</span>
      </button>

      <h2 className="text-gray-900 text-xl font-medium flex items-center gap-2">
        Objeto: {objectName}
        {isReadOnly && (
          <span className="text-xs font-normal text-gray-400 flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Solo lectura
          </span>
        )}
      </h2>

      {(loading || roleLoading) ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-timia-accent"></div>
          <span className="ml-2 text-gray-600">Cargando...</span>
        </div>
      ) : !country ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-700">
            No se ha detectado un país válido. Por favor, verifica tu sesión.
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            País actual: &quot;{country}&quot; (vacío o inválido)
          </p>
        </div>
      ) : (country === 'CO' || country === 'PE') ? (
        <>
        <TabGroup>
          <TabList>
            <Tab>Gobierno del dato</Tab>
            {isAdmin && <Tab>Generación de Schemas</Tab>}
            <Tab>Pipeline Generator</Tab>
            {isAdmin && <Tab>Despliegues ADA</Tab>}
            <Tab>Control-M</Tab>
          </TabList>
          <TabPanel>
            <div className={`p-4 ${isReadOnly ? 'pointer-events-none opacity-60' : ''}`}>
              <DataGovernmentFlow objectId={objectId} country={country as 'CO' | 'PE'} />
            </div>
          </TabPanel>
          {isAdmin && (
            <TabPanel>
              <div className={`p-4 ${isReadOnly ? 'pointer-events-none opacity-60' : ''}`}>
                <SchemaGenerationFlow objectId={objectId} />
              </div>
            </TabPanel>
          )}
          <TabPanel>
            <div className={`p-4 ${isReadOnly ? 'pointer-events-none opacity-60' : ''}`}>
              <PipelineGenerator objectId={objectId} readOnly={isReadOnly} />
            </div>
          </TabPanel>
          {isAdmin && (
            <TabPanel>
              <div className={`p-4 ${isReadOnly ? 'pointer-events-none opacity-60' : ''}`}>
                <DeployADA objectId={objectId} />
              </div>
            </TabPanel>
          )}
          <TabPanel>
            <div className={`p-4 ${isReadOnly ? 'pointer-events-none opacity-60' : ''}`}>
              <ControlMFlow objectId={objectId} />
            </div>
          </TabPanel>
        </TabGroup>
        </>
      ) : (
        <div className="p-4 text-center text-gray-500">
          País no soportado: {country}
        </div>
      )}
    </motion.div>
  );
}; 