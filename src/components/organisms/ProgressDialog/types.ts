export interface ProgressDialogProps {
  title: string;
  steps: Array<{
    label: string;
    duration: number;
  }>;
  onComplete: () => void;
} 