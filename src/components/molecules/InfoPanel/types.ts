import { ReactNode } from 'react';

export interface InfoPanelProps {
  title: string;
  children: ReactNode;
  variant?: 'info' | 'warning' | 'success' | 'neutral';
  className?: string;
}