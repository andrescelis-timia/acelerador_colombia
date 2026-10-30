import { createFetcher } from '@/lib/api/fetcher';
import type {
  GenerationJobAdminList,
  GenerationJobAdminSummary,
  GenerationJobFilters,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const getGenerationJobs = async (
  user: string,
  country: string,
  filters: GenerationJobFilters = {},
): Promise<GenerationJobAdminList> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const fetcher = createFetcher(user, country);
  return await fetcher(`${API_URL}/admin/generation-jobs?${params.toString()}`);
};

export const getGenerationJobsSummary = async (
  user: string,
  country: string,
  dias = 7,
): Promise<GenerationJobAdminSummary> => {
  const fetcher = createFetcher(user, country);
  return await fetcher(`${API_URL}/admin/generation-jobs/summary?dias=${dias}`);
};
