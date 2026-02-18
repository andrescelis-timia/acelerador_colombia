import { PipelineStatus } from '@/services/Object/types';

export interface PipelineStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  objectName: string;
  status: PipelineStatus;
}
