import { RefinementDefinitionCreate, RefinementDefinitionUpdateWithId } from '@/services/Refinement/types';

export interface RefinementDefinitionFormProps {
  isOpen: boolean;
  onClose: () => void;
  objectId: string;
  initialData?: RefinementDefinitionCreate | RefinementDefinitionUpdateWithId;
} 