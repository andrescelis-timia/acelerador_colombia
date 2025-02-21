import { PreDictionaryInputResponse } from '@/services/PreDictionaryInput/types';

export interface PreDictionaryInputFormProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  objectId: string;
  initialData?: PreDictionaryInputResponse;
} 