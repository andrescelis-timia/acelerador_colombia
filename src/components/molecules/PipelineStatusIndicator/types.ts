export type PipelineStageStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export interface PipelineStageState {
  status: PipelineStageStatus;
  message?: string;
  updatedAt?: string;
}

export interface PipelineStatus {
  gobierno: PipelineStageState;
  kirby: PipelineStageState;
  hammurabi: PipelineStageState;
  smartcleaner: PipelineStageState;
  controlm: PipelineStageState;
}

export interface PipelineStatusIndicatorProps {
  status: PipelineStatus;
  onClick?: () => void;
  size?: 'sm' | 'md';
}
