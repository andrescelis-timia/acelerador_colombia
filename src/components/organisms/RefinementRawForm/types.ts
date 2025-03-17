import { RefinementRawCreate, RefinementRawUpdateWithId } from '@/services/Refinement/types';

export interface RefinementRawFormProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  objectId?: string;
  initialData?: RefinementRawCreate | RefinementRawUpdateWithId;
} 