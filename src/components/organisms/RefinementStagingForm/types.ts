import { RefinementStagingCreate, RefinementStagingUpdateWithId } from '@/services/Refinement/types';

export interface RefinementStagingFormProps {
  isOpen: boolean;
  onClose: () => void;
  objectId: string;
  initialData?: RefinementStagingCreate | RefinementStagingUpdateWithId;
} 