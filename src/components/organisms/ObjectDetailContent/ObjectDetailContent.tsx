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
import { SchemaGenerationFlow } from '@/components/organisms/SchemaGenerationFlow';

export const ObjectDetailContent = ({ objectId, objectName }: ObjectDetailContentProps) => {
  const { country } = useAuth();

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

      <h2 className="text-[#00A3FF] text-xl font-medium">
        Objeto: {objectName}
      </h2>

      {(country === 'CO' || country === 'PE') ? (
        <TabGroup>
          <TabList>
            <Tab>Gobierno del dato</Tab>
            <Tab>Generación de Schemas</Tab>
          </TabList>
          <TabPanel>
            <div className="p-4">
              <DataGovernmentFlow objectId={objectId} country={country as 'CO' | 'PE'} />
            </div>
          </TabPanel>
          <TabPanel>
            <div className="p-4">
              <SchemaGenerationFlow objectId={objectId} />
            </div>
          </TabPanel>
        </TabGroup>
      ) : (
        <div className="p-4 text-center text-gray-500">
          País no soportado: {country}
        </div>
      )}
    </motion.div>
  );
}; 