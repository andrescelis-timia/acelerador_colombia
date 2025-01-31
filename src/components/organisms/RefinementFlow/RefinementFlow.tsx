import { useEffect, useState, useCallback } from 'react';
import { BoxFlowCard } from '@/components/molecules/BoxFlowCard';
import { BoxFlowControls } from '@/components/molecules/BoxFlowControls';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { RefinementFlowProps } from './types';
import { getRefinementByObjectId } from '@/services/Refinement';
import { RefinementResponse } from '@/services/Refinement/types';
import { RefinementOriginForm } from '@/components/organisms/RefinementOriginForm';
import { RefinementTransmissionForm } from '@/components/organisms/RefinementTransmissionForm';
import { RefinementDatioForm } from '@/components/organisms/RefinementDatioForm';
import { RefinementDefinitionForm } from '@/components/organisms/RefinementDefinitionForm';
import { RefinementStagingForm } from '@/components/organisms/RefinementStagingForm';
import { RefinementRawForm } from '@/components/organisms/RefinementRawForm';
import { RefinementMasterForm } from '@/components/organisms/RefinementMasterForm';
import { flowStepsConfig } from './config';
import { getAllPossibleFields } from './fields';
import { useAuth } from '@/lib/context/AuthContext';

export const RefinementFlow = ({ objectId }: RefinementFlowProps) => {
  const { user, country } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculateProgress = useCallback((data: unknown | null, suffix: string): string => {
    if (!data || typeof data !== 'object') {
      const totalFields = getAllPossibleFields(suffix);
      return `0/${totalFields}`;
    }
    
    const fields = Object.entries(data as Record<string, unknown>).filter(([key]) => key.endsWith(`_${suffix}`));
    const totalFields = fields.length;
    const filledFields = fields.filter(([, value]) => 
      value !== null && value !== undefined && value !== ''
    ).length;
    
    return `${filledFields}/${totalFields}`;
  }, []);

  const getUpdatedFlowSteps = useCallback((refinementData: RefinementResponse | null) => 
    flowStepsConfig.map(step => ({
      ...step,
      progress: calculateProgress(
        refinementData?.[step.id as keyof RefinementResponse],
        step.id
      )
    }))
  , [calculateProgress]);

  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [flowSteps, setFlowSteps] = useState(() => getUpdatedFlowSteps(null));
  const [refinement, setRefinement] = useState<RefinementResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRefinement = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const data = await getRefinementByObjectId(objectId, user.email, country);
      setRefinement(data);
      setFlowSteps(getUpdatedFlowSteps(data));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al obtener datos de refinamiento');
    } finally {
      setLoading(false);
    }
  }, [objectId, user?.email, country, getUpdatedFlowSteps]);

  useEffect(() => {
    fetchRefinement();
  }, [fetchRefinement]);

  const handleCloseForm = useCallback(() => {
    setActiveForm(null);
    fetchRefinement();
  }, [fetchRefinement]);

  const handleOpenForm = (formId: string) => {
    if (!user?.email) {
      setErrorMessage('Usuario no autenticado');
      return;
    }
    setActiveForm(formId);
  };

  const getControls = (stepId: string) => (
    <BoxFlowControls
      centerContent={
        <button
          onClick={() => handleOpenForm(stepId)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {flowSteps.find(step => step.id === stepId)?.progress}
        </button>
      }
    />
  );

  if (loading) return null;

  return (
    <>
      <div className="relative p-8 overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Primera fila - Flujo principal */}
          <div className="flex items-center justify-start gap-12 mb-16">
            <div className="relative z-10">
              <BoxFlowCard
                title="Origin"
                isStatic={true}
                className="border-2 border-[#94B5F0]"
                controls={getControls('origin')}
              />
            </div>
            <div className="relative">
              <div className="absolute h-[2px] bg-[#94B5F0] w-12 top-1/2 -translate-y-1/2 -left-12" />
              <div className="relative z-10">
                <BoxFlowCard
                  title="Transmission"
                  isStatic={true}
                  className="border-2 border-[#94B5F0]"
                  controls={getControls('transmission')}
                />
              </div>
            </div>
            <div className="relative">
              <div className="absolute h-[2px] bg-[#94B5F0] w-12 top-1/2 -translate-y-1/2 -left-12" />
              <div className="relative z-10">
                <BoxFlowCard
                  title="Datio"
                  isStatic={true}
                  className="border-2 border-[#94B5F0]"
                  controls={getControls('datio')}
                />
              </div>
            </div>
            <div className="relative">
              <div className="absolute h-[2px] bg-[#94B5F0] w-12 top-1/2 -translate-y-1/2 -left-12" />
              <div className="relative z-10">
                <BoxFlowCard
                  title="Definition"
                  isStatic={true}
                  className="border-2 border-[#94B5F0]"
                  controls={getControls('definition')}
                />
              </div>
              <div className="absolute h-24 w-[2px] bg-[#94B5F0] left-1/2 top-full" />
            </div>
          </div>

          {/* Segunda fila */}
          <div className="flex items-center" style={{ paddingLeft: '250px' }}>
            <div className="relative z-10">
              <BoxFlowCard
                title="Master"
                isStatic={true}
                className="border-2 border-[#94B5F0]"
                controls={getControls('master')}
              />
            </div>
            <div className="relative" style={{ marginLeft: '50px' }}>
              <div className="absolute h-[2px] bg-[#94B5F0] w-12 top-1/2 -translate-y-1/2 -left-12" />
              <div className="relative z-10">
                <BoxFlowCard
                  title="Raw"
                  isStatic={true}
                  className="border-2 border-[#94B5F0]"
                  controls={getControls('raw')}
                />
              </div>
            </div>
            <div className="relative" style={{ marginLeft: '50px' }}>
              <div className="absolute h-[2px] bg-[#94B5F0] w-12 top-1/2 -translate-y-1/2 -left-12" />
              <div className="relative z-10">
                <BoxFlowCard
                  title="Staging"
                  isStatic={true}
                  className="border-2 border-[#94B5F0]"
                  controls={getControls('staging')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {!loading && (
        <>
          <RefinementOriginForm
            isOpen={activeForm === 'origin'}
            onClose={handleCloseForm}
            objectId={objectId}
            initialData={refinement?.origin ? {
              ...refinement.origin,
              id_refinement: refinement.id_refinement
            } : undefined}
          />
          <RefinementTransmissionForm
            isOpen={activeForm === 'transmission'}
            onClose={handleCloseForm}
            objectId={objectId}
            initialData={refinement?.transmission ? {
              ...refinement.transmission,
              id_refinement: refinement.id_refinement
            } : undefined}
          />
          <RefinementDatioForm
            isOpen={activeForm === 'datio'}
            onClose={handleCloseForm}
            objectId={objectId}
            initialData={refinement?.datio ? {
              ...refinement.datio,
              id_refinement: refinement.id_refinement
            } : undefined}
          />
          <RefinementDefinitionForm
            isOpen={activeForm === 'definition'}
            onClose={handleCloseForm}
            objectId={objectId}
            initialData={refinement?.definition ? {
              ...refinement.definition,
              id_refinement: refinement.id_refinement
            } : undefined}
          />
          <RefinementStagingForm
            isOpen={activeForm === 'staging'}
            onClose={handleCloseForm}
            objectId={objectId}
            initialData={refinement?.staging ? {
              ...refinement.staging,
              id_refinement: refinement.id_refinement
            } : undefined}
          />
          <RefinementRawForm
            isOpen={activeForm === 'raw'}
            onClose={handleCloseForm}
            objectId={objectId}
            initialData={refinement?.raw ? {
              ...refinement.raw,
              id_refinement: refinement.id_refinement
            } : undefined}
          />
          <RefinementMasterForm
            isOpen={activeForm === 'master'}
            onClose={handleCloseForm}
            objectId={objectId}
            initialData={refinement?.master ? {
              ...refinement.master,
              id_refinement: refinement.id_refinement
            } : undefined}
          />
        </>
      )}

      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}; 