export interface BoxFlowCardProps {
  title: string | React.ReactNode;
  schema?: string;
  onFileClick?: () => void;
  selectedFile?: File | null;
  isStatic?: boolean;
  controls?: React.ReactNode;
  className?: string;
} 