import { CountryConfig } from '../types';

export const AR_CONFIG: CountryConfig = {
  usePreDictionary: true,
  useIngestaOutput: false, // Argentina no usa IngestaOutput por ahora
  stepsConfig: {
    sample: [
      { label: 'Procesando muestra de datos argentinos', duration: 600 },
      { label: 'Validando estructura de datos', duration: 600 },
      { label: 'Aplicando configuraciones específicas de Argentina', duration: 600 }
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
      { label: 'Extrayendo datos Master para L1T Argentina', duration: 9000 },
      { label: 'Procesando transformaciones específicas de Argentina', duration: 9000 },
      { label: 'Generando diccionario L1T para Argentina', duration: 9000 }
    ]
  },
  processLabels: {
    sample: 'Procesando Muestra - Argentina',
    dictionary: 'Generando Diccionario - Argentina',
    l1t: 'Generando Diccionario L1T - Argentina'
  }
};