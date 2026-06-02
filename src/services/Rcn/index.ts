import { useAuth } from '@/lib/context/AuthContext';
import type {
  RcnSearchRequest,
  RcnSearchResponse,
  RcnCamposParams,
  RcnQueryRequest,
  RcnQueryResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class RcnService {
  constructor(private user?: string | null, private country?: string) {}

  private headers() {
    if (!this.user) throw new Error('Usuario no autenticado');
    return {
      'Content-Type': 'application/json',
      'X-User': this.user,
      'X-Country': this.country || 'CO',
    };
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/rcn${path}`, {
      ...init,
      headers: {
        ...this.headers(),
        ...(init.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = (data as { detail?: string; error?: string }).detail || (data as { error?: string }).error;
      throw new Error(detail || `HTTP ${response.status}`);
    }
    return data as T;
  }

  search(req: RcnSearchRequest): Promise<RcnSearchResponse> {
    return this.request<RcnSearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  campos(params: RcnCamposParams = {}): Promise<RcnSearchResponse> {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') search.set(k, String(v));
    });
    return this.request<RcnSearchResponse>(`/campos?${search.toString()}`, {
      method: 'GET',
    });
  }

  query(req: RcnQueryRequest): Promise<RcnQueryResponse> {
    return this.request<RcnQueryResponse>('/query', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }
}

export const useRcnService = () => {
  const { user, country } = useAuth();
  return new RcnService(user?.email, country);
};

export type { RcnEntry, RcnSearchRequest, RcnSearchResponse } from './types';
