import { RefinementTransmissionCreate, RefinementTransmissionUpdateWithId } from '@/services/Refinement/types';

export interface RefinementTransmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  objectId: string;
  initialData?: RefinementTransmissionCreate | RefinementTransmissionUpdateWithId;
} 