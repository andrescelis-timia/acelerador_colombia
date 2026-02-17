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
      { label: 'Inicializando acceso a APIs, bases de datos y almacenamiento en la nube', duration: 7500 },
      { label: 'Verificando y aplicando reglas y formatos específicos del país', duration: 7500 },
      { label: 'Creando estructura base del diccionario para tablas raw', duration: 7500 },
      { label: 'Creando estructura base del diccionario para tablas master', duration: 7500 },
      { label: 'Creando diccionarios de datos detallados y mapeos de campos', duration: 7500 },
      { label: 'Creando y guardando archivos CSV finales con todos los metadatos y mapeos', duration: 7500 }
    ],
    l1t: [
      { label: 'Extrayendo diccionario Master de objects y fields', duration: 10000 },
      { label: 'Procesando datos de L1T', duration: 10000 },
      { label: 'Generando dictionario L1T de objects y fields', duration: 10000 }
    ],
    lite: [
      { label: 'Leyendo campos del pre-diccionario', duration: 3000 },
      { label: 'Buscando campos en repositorio de nombres canónicos', duration: 5000 },
      { label: 'Generando nombres físicos y lógicos con IA', duration: 8000 },
      { label: 'Agregando campos de partición según periodicidad', duration: 2000 },
      { label: 'Escribiendo resultados en Google Sheets', duration: 4000 }
    ]
  },
  processLabels: {
    sample: 'Procesando Muestra',
    dictionary: 'Generando Diccionario',
    l1t: 'Generando Diccionario L1T',
    lite: 'Generando Diccionario'
  }
};