# DataGovernmentFlow Component

## Descripción
Componente principal para el flujo de gobierno de datos que maneja la generación de diccionarios de datos en tres etapas: procesamiento de pre-diccionario, generación de diccionarios base y generación de diccionarios L1T.

## Características Principales

### 🔄 Flujo de Trabajo
1. **Procesar Pre-diccionario**: Carga y procesa archivos de muestra (txt, csv)
2. **Generar Diccionarios**: Crea diccionarios base (Raw y Master) 
3. **Generar Diccionario L1T**: Genera diccionarios L1T (solo si está habilitado)

### 🎨 Diseño Visual
- Layout horizontal con tres cajas conectadas
- Líneas de conexión visual entre etapas
- Estados visuales dinámicos (activo/inactivo)

### 🌍 Configuración por País
Utiliza el sistema `getCountryConfig(country)` que permite:
- Configuraciones específicas por país (CO, PE, etc.)
- Pasos de progreso personalizables
- Etiquetas de proceso localizadas
- Funcionalidades opcionales por país

## Props

```typescript
interface DataGovernmentFlowProps {
  objectId: string;    // ID del objeto a procesar
  country: string;     // Código del país (CO, PE, etc.)
}
```

## Estados Principales

### Datos
- `dictionaryJsonHeader`: Cabecera del diccionario JSON
- `dictionaryJsonDetails`: Detalles del diccionario JSON
- `preDictionary`: Datos del pre-diccionario
- `ingestaOutput`: Salida de la ingesta
- `objectData`: Datos del objeto

### Archivos
- `sampleFile`: Archivo de muestra cargado
- `dictionaryFile`: Archivo JSON de diccionario
- `dictionaryFileContent`: Contenido del archivo JSON

### UI States
- `loading`: Estado de carga
- `activeForm`: Formulario activo
- `showSampleProgress`: Progreso de muestra
- `showDictionaryProgress`: Progreso de diccionario
- `showL1TProgress`: Progreso L1T
- `successMessage`: Mensaje de éxito
- `errorMessage`: Mensaje de error

## Funciones Principales

### Fetch Functions
- `fetchData()`: Carga datos del diccionario JSON
- `fetchPreDictionary()`: Carga datos del pre-diccionario
- `fetchDictionaryOutput()`: Carga salida de ingesta
- `fetchObjectData()`: Carga datos del objeto

### File Handlers
- `handleSampleFileSelect()`: Selección de archivo de muestra
- `handleDictionaryFileSelect()`: Selección de archivo JSON
- `handleDownload()`: Descarga del diccionario JSON

### Process Handlers
- `handleGenerateDictionaryJson()`: Genera diccionario desde muestra
- `handleDictionaryGeneration()`: Genera diccionarios base
- `handleGenerateL1T()`: Genera diccionario L1T

### Utility Functions
- `calculateProgress()`: Calcula progreso de campos completados
- `detectDelimiter()`: Detecta delimitador de archivos CSV/TXT
- `cleanDataForDownload()`: Limpia datos para descarga
- `getControls()`: Genera controles para cada etapa

## Configuración por País

### Estructura de Config
```typescript
{
  usePreDictionary: boolean;     // Habilita pre-diccionario
  useIngestaOutput: boolean;     // Habilita salida de ingesta
  processLabels: {               // Etiquetas de proceso
    sample: string;
    dictionary: string;
    l1t: string;
  };
  stepsConfig: {                 // Configuración de pasos
    sample: Step[];
    dictionary: Step[];
    l1t: Step[];
  }
}
```

### Países Soportados
- **CO (Colombia)**: Configuración completa con exclusión de campos de partición
- **PE (Perú)**: Configuración estándar
- **Default**: Configuración base para otros países

## Componentes Utilizados

### Internos
- `BoxFlowCard`: Tarjeta de flujo con controles
- `BoxFlowControls`: Controles de iconos y botones
- `PopupLinks`: Popup para mostrar enlaces
- `ProgressDialog`: Diálogo de progreso
- `PreDictionaryInputForm`: Formulario de pre-diccionario
- `ErrorModal`: Modal de errores

### Externos
- `@heroicons/react/24/outline`: Iconos (Play, Eye, Download, Upload)

## Servicios Integrados

### Dictionary Services
- `getDictionaryJsonHeader()`: Obtiene cabecera
- `getDictionaryJsonDetailsByHeaderId()`: Obtiene detalles
- `generateDictionaryJson()`: Genera desde muestra
- `generateDictionaryBase()`: Genera diccionarios base
- `generateDictionaryL1T()`: Genera diccionario L1T

### Other Services
- `getPreDictionaryInputByObjectId()`: Pre-diccionario
- `getIngestaOutputByObjectId()`: Salida de ingesta
- `getById()`: Datos del objeto

## Flujo de Datos

### 1. Inicialización
```
useEffect → fetchData + fetchPreDictionary + fetchDictionaryOutput + fetchObjectData
```

### 2. Procesamiento de Muestra
```
Cargar archivo → Detectar delimitador → Generar JSON → Actualizar estado
```

### 3. Generación de Diccionarios
```
Validar datos → Procesar header/details → Generar base → Mostrar enlaces
```

### 4. Generación L1T
```
Verificar flag_l1t → Validar prerequisites → Generar L1T → Mostrar enlaces
```

## Estados de Validación

### Etapa 1 (Sample)
- ✅ Archivo cargado
- ✅ Pre-diccionario completo (9/9 campos)
- ❌ Deshabilitado si faltan requisitos

### Etapa 2 (Dictionary)
- ✅ Diccionario JSON disponible O archivo JSON cargado
- ❌ Deshabilitado si no hay datos

### Etapa 3 (L1T)
- ✅ flag_l1t habilitado
- ✅ Enlaces de diccionario master disponibles
- ❌ Deshabilitado si no cumple requisitos

## Manejo de Errores

### Tipos de Error
- Archivos no válidos
- Campos faltantes en JSON
- Errores de API
- Validaciones de negocio

### Estrategia
- Mensajes específicos por tipo de error
- Modal de error centralizado
- Limpieza automática de errores
- Fallbacks para casos edge

## Personalización

### Estilos
- Clases CSS modulares
- Colores por estado (azul/verde/gris)
- Responsive design
- Animaciones de transición

### Configuración
- Duraciones de progreso ajustables
- Etiquetas personalizables
- Pasos configurables por país
- Funcionalidades opcionales

## Debugging

### Estados Útiles
```javascript
console.log('Dictionary Header:', dictionaryJsonHeader);
console.log('Pre-dictionary Progress:', calculateProgress(preDictionary));
console.log('L1T Enabled:', objectData?.flag_l1t);
console.log('Config:', config);
```

### Puntos de Breakpoint
- `handleGenerateDictionaryJson()`: Procesamiento de muestra
- `handleDictionaryGeneration()`: Generación de diccionarios
- `getControls()`: Lógica de controles
- `calculateProgress()`: Cálculo de progreso

## Mejores Prácticas

### Performance
- Callbacks memoizados con `useCallback`
- Efectos optimizados con dependencias específicas
- Carga condicional basada en configuración

### UX
- Tooltips informativos
- Estados de carga claros
- Mensajes de éxito/error
- Validaciones en tiempo real

### Mantenimiento
- Configuración centralizada por país
- Funciones modulares y reutilizables
- Tipos TypeScript estrictos
- Documentación inline

## Troubleshooting

### Problemas Comunes

1. **Progreso no actualiza**
   - Verificar `calculateProgress()` 
   - Revisar campos excluidos por país

2. **L1T no aparece**
   - Verificar `objectData.flag_l1t`
   - Confirmar enlaces de master disponibles

3. **Archivos no se cargan**
   - Verificar tipos de archivo aceptados
   - Revisar `handleSampleFileSelect()`

4. **Errores de configuración**
   - Verificar `getCountryConfig(country)`
   - Confirmar país válido

## Historial de Cambios

### v2.0 (Actual)
- ✅ Sistema de configuración por país
- ✅ Nuevo diseño horizontal conectado
- ✅ Componentes BoxFlowCard/BoxFlowControls
- ✅ Validaciones mejoradas
- ✅ Manejo de errores robusto

### v1.0 (Legacy)
- Configuración hardcodeada
- Diseño vertical
- Funcionalidad básica