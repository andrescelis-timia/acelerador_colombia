import { RefinementDefinitionCreate, RefinementDefinitionUpdateWithId } from '@/services/Refinement/types';

export interface RefinementDefinitionFormProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  objectId?: string;
  initialData?: RefinementDefinitionCreate | RefinementDefinitionUpdateWithId;
} 