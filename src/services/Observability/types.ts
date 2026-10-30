export type GenerationJobStatus = 'running' | 'completed' | 'failed';

export type Marca = 'RCN' | 'REVISAR' | 'REVISAR IA' | 'CAMPO LIBRE';

export interface GenerationJobAdminItem {
  job_id: string;
  fecha: string | null;
  usuario: string | null;
  pais: string | null;
  client_ip: string | null;
  objeto: string | null;
  proyecto: string | null;
  sheet_url: string | null;
  periodicidad: string | null;
  modo: 'new' | 'update' | null;
  campos_regenerados: number | null;
  status: GenerationJobStatus;
  error: string | null;
  duracion_s: number | null;
  n_campos: number | null;
  campos_leidos: number | null;
  campos_particion: number | null;
  marcas: Partial<Record<Marca, number>>;
  tokens: Partial<Record<'input' | 'output' | 'cache_read' | 'cache_write' | 'total', number>>;
}

export interface GenerationJobAdminList {
  items: GenerationJobAdminItem[];
  total: number;
}

export interface GenerationJobAdminSummary {
  dias: number;
  ejecuciones: number;
  completadas: number;
  fallidas: number;
  en_curso: number;
  campos: number;
  tokens: number;
  tokens_cache_read: number;
}

export interface GenerationJobFilters {
  usuario?: string;
  objeto?: string;
  desde?: string;
  hasta?: string;
  estado?: GenerationJobStatus | '';
  limit?: number;
  offset?: number;
}
