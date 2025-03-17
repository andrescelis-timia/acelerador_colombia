import { RefinementMasterCreate, RefinementMasterUpdateWithId } from '@/services/Refinement/types';

export interface RefinementMasterFormProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  objectId?: string;
  initialData?: RefinementMasterCreate | RefinementMasterUpdateWithId;
} 