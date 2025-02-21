import { ObjectCreate, ObjectUpdateWithId } from '@/services/Object/types';

export interface ObjectFormProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  projectId?: string;
  initialData?: ObjectCreate | ObjectUpdateWithId;
} 