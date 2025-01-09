import { RefinementOriginCreate, RefinementOriginUpdateWithId } from '@/services/Refinement/types';

export interface RefinementOriginFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: RefinementOriginCreate | RefinementOriginUpdateWithId;
  objectId: string;
} 