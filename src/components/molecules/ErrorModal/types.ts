export interface ErrorModalProps {
  message: string | null;
  onClose: () => void;
  title?: string;
  isOpen?: boolean;
} 