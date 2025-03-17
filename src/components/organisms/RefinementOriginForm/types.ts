import { RefinementOriginCreate, RefinementOriginUpdateWithId } from '@/services/Refinement/types';

export interface RefinementOriginFormProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  objectId?: string;
  initialData?: RefinementOriginCreate | RefinementOriginUpdateWithId;
} 