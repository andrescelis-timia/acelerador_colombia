export interface DataGovernmentFlowProps {
  objectId: string;
  country: 'CO' | 'PE';
  readOnly?: boolean;
}

export interface CountryConfig {
  usePreDictionary: boolean;
  useIngestaOutput: boolean;
  stepsConfig: StepsConfig;
  processLabels: ProcessLabels;
}

export interface StepsConfig {
  sample: Array<{ label: string; duration: number }>;
  dictionary: Array<{ label: string; duration: number }>;
  l1t: Array<{ label: string; duration: number }>;
  lite?: Array<{ label: string; duration: number }>;
}

export interface ProcessLabels {
  sample: string;
  dictionary: string;
  l1t: string;
  lite?: string;
}

export interface FileDictionaryJsonHeader {
  pais: string;
  origen: string;
  aplicativo_producto: string;
  nombre_origen: string;
  descripción_contenido_tabla_origen: string;
  claves_primarias_tabla: string;
  nombre_tabla_en_datio: string;
  claves_primarias_datio: string;
  tabla_en_raw: string;
  tabla_en_master: string;
  information_group_level_2: string;
  campos_particion_raw: string;
  campos_agregar_raw: string;
  path_input_raw: string;
  path_output_raw: string;
  path_input_master: string;
  path_output_master: string;
  campos_particion_master: string;
  campos_agregar_master: string;
  Cant_Registros_periodo_ingesta: string;
  campos: FileDictionaryJsonDetail[];
}

export interface FileDictionaryJsonDetail {
  nombre_campo: string;
  logical_format: string;
  formato_fecha: string;
  calculado: string;
  clave_origen: string;
  clave_datio: string;
  descripcion: string;
  observacion: string;
  obligatorio: string;
  tipo_dato: string;
  catalogo: string;
}