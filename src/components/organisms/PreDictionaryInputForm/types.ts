import { CreatePreDictionaryInput, PreDictionaryInputResponse, UpdatePreDictionaryInput } from '@/services/PreDictionaryInput/types';

export interface PreDictionaryInputFormProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  objectId?: string;
  initialData?: PreDictionaryInputResponse;
  draftData: CreatePreDictionaryInput | null;
  onDraftChange: (data: CreatePreDictionaryInput | null) => void;
} 