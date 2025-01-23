'use client';

import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { TabGroup } from '@/components/molecules/TabGroup';
import { TabList } from '@/components/molecules/TabList';
import { Tab } from '@/components/atoms/Tab';
import { TabPanel } from '@/components/atoms/TabPanel';
import { ObjectDetailContentProps } from './types';
import { RefinementFlow } from '@/components/organisms/RefinementFlow';
import { DataGovernmentFlowAR } from '@/components/organisms/DataGovernmentFlowAR';
import { DataGovernmentFlowCO } from '@/components/organisms/DataGovernmentFlowCO';
import { useAuth } from '@/lib/context/AuthContext';
import { IngestaComponentFlow } from '@/components/organisms/IngestaComponentFlow';

export const ObjectDetailContent = ({ objectId, objectName }: ObjectDetailContentProps) => {
  const { country } = useAuth();

  const DataGovernmentFlow = country === 'AR' ? DataGovernmentFlowAR : DataGovernmentFlowCO;

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

      {country === 'AR' ? (
        <TabGroup>
          <TabList>
            <Tab>Refinamiento</Tab>
            <Tab>Gobierno del dato</Tab>
            <Tab>Componentes de ingesta</Tab>
          </TabList>
          <TabPanel>
            <div className="p-4">
              <RefinementFlow objectId={objectId} />
            </div>
          </TabPanel>
          <TabPanel>
            <div className="p-4">
              <DataGovernmentFlow objectId={objectId} />
            </div>
          </TabPanel>
          <TabPanel>
            <div className="p-4">
              <IngestaComponentFlow objectId={objectId} />
            </div>
          </TabPanel>
        </TabGroup>
      ) : (
        <TabGroup>
          <TabList>
            <Tab>Gobierno del dato</Tab>
            <Tab>Componentes de ingesta</Tab>
          </TabList>
          <TabPanel>
            <div className="p-4">
              <DataGovernmentFlow objectId={objectId} />
            </div>
          </TabPanel>
          <TabPanel>
            <div className="p-4">
              <IngestaComponentFlow objectId={objectId} />
            </div>
          </TabPanel>
        </TabGroup>
      )}
    </motion.div>
  );
}; 