import { ObjectCreate, ObjectUpdateWithId } from '@/services/Object/types';

export interface ObjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  initialData?: ObjectCreate | ObjectUpdateWithId;
} 