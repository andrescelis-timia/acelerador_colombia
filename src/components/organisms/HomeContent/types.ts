import type { DashboardStats } from '@/services/Dashboard/types';

export interface HomeContentProps {
  stats: DashboardStats | null;
  loading: boolean;
}
