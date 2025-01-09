import { RefinementDatioCreate, RefinementDatioUpdateWithId } from '@/services/Refinement/types';

export interface RefinementDatioFormProps {
  isOpen: boolean;
  onClose: () => void;
  objectId: string;
  initialData?: RefinementDatioCreate | RefinementDatioUpdateWithId;
} 