import { ReactNode } from 'react';

export interface IconConfig {
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  visible?: boolean;
  className?: string;
  badge?: ReactNode;
  tooltip?: string;
  readOnlyWrapper?: boolean;
}

export interface BoxFlowControlsProps {
  leftIcons?: IconConfig[];
  rightIcons?: IconConfig[];
  centerContent?: ReactNode;
  className?: string;
} 