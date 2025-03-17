import { RefinementStagingCreate, RefinementStagingUpdateWithId } from '@/services/Refinement/types';

export interface RefinementStagingFormProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  objectId?: string;
  initialData?: RefinementStagingCreate | RefinementStagingUpdateWithId;
} 