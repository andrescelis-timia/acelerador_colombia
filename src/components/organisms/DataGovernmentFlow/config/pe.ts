import { CountryConfig } from '../types';

export const PE_CONFIG: CountryConfig = {
  usePreDictionary: true,
  useIngestaOutput: false, // Perú no usa IngestaOutput por ahora
  stepsConfig: {
    sample: [
      { label: 'Procesando muestra de datos peruanos', duration: 600 },
      { label: 'Validando estructura de datos', duration: 600 },
      { label: 'Aplicando configuraciones específicas de Perú', duration: 600 }
    ],
    dictionary: [
      { label: 'Inicializando servicios para Perú', duration: 15000 },
      { label: 'Cargando configuraciones específicas del país', duration: 15000 },
      { label: 'Aplicando reglas y formatos peruanos', duration: 15000 },
      { label: 'Creando estructura de diccionario raw para Perú', duration: 15000 },
      { label: 'Creando estructura de diccionario master para Perú', duration: 15000 },
      { label: 'Procesando metadatos con IA especializada', duration: 15000 },
      { label: 'Validando campos según normativas peruanas', duration: 15000 },
      { label: 'Generando diccionarios finales para Perú', duration: 17000 }
    ],
    l1t: [
      { label: 'Extrayendo datos Master para L1T Perú', duration: 9000 },
      { label: 'Procesando transformaciones específicas de Perú', duration: 9000 },
      { label: 'Generando diccionario L1T para Perú', duration: 9000 }
    ]
  },
  processLabels: {
    sample: 'Procesando Muestra - Perú',
    dictionary: 'Generando Diccionario - Perú',
    l1t: 'Generando Diccionario L1T - Perú'
  }
};