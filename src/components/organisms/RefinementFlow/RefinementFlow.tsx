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
import { gridLayout, flowStepsConfig } from './config';
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

  if (loading) return null;

  return (
    <>
      <div className="relative p-8">
        <div className="grid grid-cols-3 gap-x-12 gap-y-8">
          {flowSteps.map((step, index) => (
            <div key={step.id} className="relative col-span-1 row-span-1" style={{
              gridColumn: gridLayout[index].x + 1,
              gridRow: gridLayout[index].y + 1,
            }}>
              <BoxFlowCard
                title={step.title}
                isStatic={true}
                className="w-full border border-gray-400"
                controls={
                  <BoxFlowControls
                    centerContent={
                      <button
                        onClick={() => handleOpenForm(step.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {step.progress}
                      </button>
                    }
                  />
                }
              />
            </div>
          ))}
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