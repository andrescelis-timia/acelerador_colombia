export interface BoxFlowCardProps {
  title: string;
  schema?: string;
  onFileClick?: () => void;
  selectedFile?: File | null;
  isStatic?: boolean;
  controls?: React.ReactNode;
  className?: string;
} 