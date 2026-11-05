export type TipoCarga = 'rcn' | 'legacy';

export type EstadoCarga =
  | 'esperando_archivo'
  | 'lanzada'
  | 'en_curso'
  | 'analizada'
  | 'terminada'
  | 'rechazada'
  | 'fallida'
  | 'interrumpida';

export interface ResumenCarga {
  filas_antes?: number;
  filas_csv?: number;
  filas_despues?: number;
  altas?: number;
  cambios_texto?: number;
  cambios_metadatos?: number;
  bajas?: number;
  pares_necesarios?: number;
  pares_reutilizados?: number;
  pares_generados?: number;
  pais?: string;
}

export interface Carga {
  id: string;
  estado: EstadoCarga;
  tipo: TipoCarga;
  pais: string | null;
  archivo: string;
  usuario: string;
  creada: string;
  accion?: 'analizar' | 'aplicar';
  fase?: string;
  progreso?: { hechos: number; total: number };
  resumen?: ResumenCarga;
  error?: string;
  fin?: string;
  duracion_s?: number;
}

export interface NuevaCarga {
  id: string;
  url_subida: string;
}
