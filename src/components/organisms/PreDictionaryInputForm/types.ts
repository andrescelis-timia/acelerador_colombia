import { PreDictionaryInputResponse } from '@/services/PreDictionaryInput/types';

export interface PreDictionaryInputFormProps {
  isOpen: boolean;
  onClose: () => void;
  objectId: string;
  initialData?: PreDictionaryInputResponse;
} 