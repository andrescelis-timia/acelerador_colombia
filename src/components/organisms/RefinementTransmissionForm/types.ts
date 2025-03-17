import { RefinementTransmissionCreate, RefinementTransmissionUpdateWithId } from '@/services/Refinement/types';

export interface RefinementTransmissionFormProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  objectId?: string;
  initialData?: RefinementTransmissionCreate | RefinementTransmissionUpdateWithId;
} 