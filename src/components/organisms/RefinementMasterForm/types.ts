import { RefinementMasterCreate, RefinementMasterUpdateWithId } from '@/services/Refinement/types';

export interface RefinementMasterFormProps {
  isOpen: boolean;
  onClose: () => void;
  objectId: string;
  initialData?: RefinementMasterCreate | RefinementMasterUpdateWithId;
} 