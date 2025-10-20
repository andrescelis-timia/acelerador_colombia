import { CountryConfig } from '../types';

export const CO_CONFIG: CountryConfig = {
  usePreDictionary: true,
  useIngestaOutput: true,
  stepsConfig: {
    sample: [
      { label: 'Procesando muestra', duration: 500 },
      { label: 'Validando datos', duration: 500 },
      { label: 'Finalizando', duration: 500 }
    ],
    dictionary: [
      { label: 'Inicializando acceso a APIs, bases de datos y almacenamiento en la nube', duration: 16500 },
      { label: 'Cargando archivos de entrada y configuraciones desde la nube', duration: 16500 },
      { label: 'Verificando y aplicando reglas y formatos específicos del país', duration: 16500 },
      { label: 'Creando estructura base del diccionario para tablas raw', duration: 16500 },
      { label: 'Creando estructura base del diccionario para tablas master', duration: 16500 },
      { label: 'Ejecutando IA para analizar y enriquecer metadatos, nombres y descripciones de campos', duration: 16500 },
      { label: 'Aplicando formatos estándar y validaciones a todos los campos', duration: 16500 },
      { label: 'Creando diccionarios de datos detallados y mapeos de campos', duration: 16500 },
      { label: 'Creando y guardando archivos CSV finales con todos los metadatos y mapeos', duration: 18000 }
    ],
    l1t: [
      { label: 'Extrayendo diccionario Master de objects y fields', duration: 10000 },
      { label: 'Procesando datos de L1T', duration: 10000 },
      { label: 'Generando dictionario L1T de objects y fields', duration: 10000 }
    ]
  },
  processLabels: {
    sample: 'Procesando Muestra',
    dictionary: 'Generando Diccionario',
    l1t: 'Generando Diccionario L1T'
  }
};