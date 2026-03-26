import { createFetcher } from '@/lib/api/fetcher';
import type { DashboardStats } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const getDashboardStats = async (user: string, country: string): Promise<DashboardStats> => {
  const fetcher = createFetcher(user, country);
  return await fetcher(`${API_URL}/dashboard/stats`);
};
