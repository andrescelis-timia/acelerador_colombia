'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { ValidationMode, SchemaUploadSectionProps, ValidationError } from '../types';
import { usePipelineGeneratorService } from '@/services/PipelineGenerator';
import { FilePreviewModal } from '@/components/molecules/FilePreviewModal';

type ComponentTypeArg = 'tabla' | 'tablon' | 'tabla_no_raw';

const ALIAS_MAX_LENGTH = 20;
const ALIAS_VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * Recorta el alias a máximo 20 chars quitando vocales de derecha a izquierda,
 * una por una. Nunca remueve la primera letra (protege inicio si es vocal).
 * Mismo algoritmo que `shorten_alias` en el backend (path_builder.py).
 */
const COMPONENT_TYPES = [
  { value: 'tabla', label: 'Tabla (Raw + Master)' },
  { value: 'tablon', label: 'Tablón (Solo Master)' },
  { value: 'tabla_no_raw', label: 'Tabla (Staging - Master)' },
] as const;

// El nombre corto va en el radio y el detalle debajo, solo del seleccionado:
// metido dentro de un <option> habria que abrir la lista para leerlo.
const VALIDATION_MODES = [
  { value: 'STRICT_VALIDATION', note: '(por defecto)', hint: 'El job falla si algún registro no cumple.' },
  { value: 'DISCARD_INVALID', note: '', hint: 'Los inválidos no se escriben; el resto sí.' },
  { value: 'TOLERANT', note: '', hint: 'Se escriben todos, cumplan o no.' },
] as const;

const shortenAlias = (alias: string): string => {
  if (!alias || alias.length <= ALIAS_MAX_LENGTH) return alias;
  const chars = alias.split('');
  let i = chars.length - 1;
  while (chars.length > ALIAS_MAX_LENGTH && i > 0) {
    if (ALIAS_VOWELS.has(chars[i].toLowerCase())) {
      chars.splice(i, 1);
    }
    i -= 1;
  }
  return chars.join('');
};

/**
 * Deriva el alias por defecto desde el nombre físico según el component_type,
 * imitando la lógica del backend (`resolve_alias` en path_builder.py):
 *   - tabla:                    parts[2]                     (alias estructurado)
 *   - tablon / tabla_no_raw:    parts[2:].join('')           (concatenación descriptivo)
 */
const deriveAliasFromName = (physicalName: string, componentType: ComponentTypeArg): string => {
  if (!physicalName) return '';
  const parts = physicalName.split('_');
  if (parts.length < 3) return '';
  if (componentType === 'tabla') return parts[2];
  return parts.slice(2).join('');
};

/* ============================================================
 * Diccionario de códigos para validación semántica del alias.
 * Patrón: <origen 1><marker 2 da|ta><aplicativo 2><descriptivo alfanum+>
 * Ej: hdape001 -> h(Host) + da(datos) + pe(Personas) + 001(descriptivo)
 * ============================================================ */

const ORIGEN_LABELS: Record<string, string> = {
  h: 'Host', l: 'LAR', s: 'SAS', p: 'PI', o: 'Omega', u: 'Usuario',
  d: 'SSDD', a: 'AS400', q: 'HDFS-Parquet', c: 'Cobis', k: 'ADA Holding',
  m: 'Murex', y: 'Aplus', x: 'Acselx', g: 'SAP Experience/Payroll', w: 'AWS',
};

const MARKER_LABELS: Record<string, string> = {
  da: 'datos',
  ta: 'taxonomía',
};

const APLICATIVO_LABELS: Record<string, string> = {
  // Internos / ALTAMIRA
  ae: 'Admin. Expedientes', ba: 'Cámara y compensación', bg: 'Cuentas ALTAMIRA',
  bt: 'Banca telefónica', ca: 'Cargos y abonos', cn: 'BBVNET Canales',
  cx: 'Cuentas por cobrar', ed: 'Envíos de dinero', ef: 'Efectivo',
  ey: 'Bank Trade', fp: 'Fondos de pensiones', g2: 'NET-CASH',
  gf: 'Scorating', gi: 'GIP', gp: 'Extranjero ALTAMIRA', gt: 'SWIFT',
  ha: 'Contabilidad general', hr: 'RRHH', hx: 'Hermes',
  ic: 'Distribución seguros', im: 'Tratamiento imágenes', io: 'Biometría',
  jg: 'Cuentas por pagar', ji: 'Digitalización docs', kn: 'Arq. canales',
  ls: 'Leasing', mc: 'Medios de pago', og: 'Domiciliación',
  oz: 'SOA', pe: 'Personas ALTAMIRA', pm: 'TECOM Marketing',
  qg: 'Comisiones', qh: 'Contabilización', qr: 'Quejas y reclamos',
  rc: 'Recaudo nacional', rg: 'Riesgo global', ri: 'Impagados',
  s4: 'Factoring/Confirming', sl: 'MIS clientes', sm: 'Informe diario',
  sp: 'MIS productos', rv: 'Riesgos ALTAMIRA', tc: 'Tablas corporativas',
  tp: 'Fondos de inversión', ug: 'Préstamos ALTAMIRA', v7: 'Impuestos',
  w9: 'SAP Cloud Nómina', xc: 'Comercio exterior', xg: 'Rating empresarial',
  xo: 'SIRO',
  // Externos
  mk: 'Marketing', kp: 'KPIs', dg: 'Diálogo', fi: 'Info financiera',
  ct: 'Catálogos locales', af: 'Activos fijos', sr: 'BCBS239 SREP',
  ad: 'Adobe', wp: 'Web Pymes', vl: 'BBVA Valores', sf: 'Salesforce',
  st: 'Star', pp: 'SAP Payroll', br: 'Bricket', pc: 'Power Curve',
  eg: 'Engine / Sandbox', ko: 'Konecta',
};

const ORIGEN_CODES = new Set(Object.keys(ORIGEN_LABELS));

export interface AliasDecomposition {
  origen: string;
  marker: string;
  aplicativo: string;
  descriptivo: string;
  origenLabel: string;
  markerLabel: string;
  aplicativoLabel: string;
}

/**
 * Descompone un alias si cumple el patrón oficial. Devuelve null si no cumple.
 * Se usa tanto para warnear (si el segmento candidato no cumple) como para
 * mostrar el desglose semántico cuando el alias es reconocido.
 */
const decomposeAlias = (segment: string): AliasDecomposition | null => {
  if (!segment || segment.length < 6) return null;
  const s = segment.toLowerCase();
  const origen = s[0];
  const marker = s.slice(1, 3);
  const aplicativo = s.slice(3, 5);
  const descriptivo = s.slice(5);
  if (
    ORIGEN_CODES.has(origen) &&
    marker in MARKER_LABELS &&
    aplicativo in APLICATIVO_LABELS &&
    /^[a-z0-9]+$/.test(descriptivo)
  ) {
    return {
      origen, marker, aplicativo, descriptivo,
      origenLabel: ORIGEN_LABELS[origen],
      markerLabel: MARKER_LABELS[marker],
      aplicativoLabel: APLICATIVO_LABELS[aplicativo],
    };
  }
  return null;
};

/**
 * Warning: el segmento candidato a alias no cumple el patrón oficial.
 * Sólo aplica a `tabla`. Para `tablon` y `tabla_no_raw` el alias se arma
 * por concatenación del descriptivo (patrón no aplica), así que nunca
 * warneamos aunque el usuario puede override manualmente.
 */
const hasAliasIssue = (physicalName: string, componentType: ComponentTypeArg): boolean => {
  if (!physicalName) return false;
  if (componentType !== 'tabla') return false;
  const parts = physicalName.split('_');
  if (parts.length < 3) return true;
  return decomposeAlias(parts[2]) === null;
};



/**
 * Avisos de validacion de un esquema, bajo su propio cuadro.
 *
 * Antes iban en un panel al final de la seccion y en una unica lista, asi que
 * validar el master borraba los del raw y no se sabia a cual se referia cada
 * mensaje. Aqui cada esquema muestra los suyos.
 */
const AvisosEsquema = ({ avisos }: { avisos: ValidationError[] }) => {
  if (!avisos.length) return null;
  return (
    <div className="mt-2 space-y-1">
      {avisos.map((aviso, i) => (
        <div
          key={i}
          className={`flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] ${
            aviso.severity === 'error'
              ? 'bg-danger-subtle text-red-800'
              : 'bg-yellow-50 text-yellow-800'
          }`}
        >
          {aviso.severity === 'error' ? (
            <ExclamationTriangleIcon className="mt-px h-3.5 w-3.5 flex-shrink-0 text-danger-icon" />
          ) : (
            <InformationCircleIcon className="mt-px h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
          )}
          <span>{aviso.message}</span>
        </div>
      ))}
    </div>
  );
};


export const SchemaUploadSection = ({
  objectId,
  rawSchema,
  masterSchema,
  componentType,
  onSchemaUpload,
  onComponentTypeChange,
  aliasOverride,
  onAliasOverrideChange,
  validationMode,
  onValidationModeChange,
}: SchemaUploadSectionProps) => {
  const [validationErrors, setValidationErrors] = useState<Record<'raw' | 'master', ValidationError[]>>({ raw: [], master: [] });

  const setErroresDe = (type: 'raw' | 'master', errores: ValidationError[]) =>
    setValidationErrors(prev => ({ ...prev, [type]: errores }));
  const [schemaPreview, setSchemaPreview] = useState<{ title: string; content: string } | null>(null);
  const [masterPhysicalName, setMasterPhysicalName] = useState<string>('');
  const [masterSecurityLevel, setMasterSecurityLevel] = useState<string>('');
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasDraft, setAliasDraft] = useState('');
  const pipelineGeneratorService = usePipelineGeneratorService();

  // Leer physical_name del master schema para detectar issue de alias
  useEffect(() => {
    if (!masterSchema) { setMasterPhysicalName(''); setMasterSecurityLevel(''); return; }
    let cancelled = false;
    masterSchema.text().then(txt => {
      try {
        const parsed = JSON.parse(txt);
        if (!cancelled) {
          setMasterPhysicalName(parsed?.name || '');
          setMasterSecurityLevel(parsed?.securityLevel || '');
        }
      } catch {
        if (!cancelled) {
          setMasterPhysicalName('');
          setMasterSecurityLevel('');
        }
      }
    });
    return () => { cancelled = true; };
  }, [masterSchema]);

  const derivedAliasRaw = useMemo(
    () => deriveAliasFromName(masterPhysicalName, componentType),
    [masterPhysicalName, componentType]
  );
  const derivedAlias = useMemo(() => shortenAlias(derivedAliasRaw), [derivedAliasRaw]);
  const derivedWasShortened = derivedAliasRaw.length > ALIAS_MAX_LENGTH;
  const effectiveAlias = aliasOverride?.trim() || derivedAlias;
  const aliasBreakdown = useMemo(() => decomposeAlias(effectiveAlias), [effectiveAlias]);
  const showAliasWarning = useMemo(
    () => Boolean(masterPhysicalName) && hasAliasIssue(masterPhysicalName, componentType) && !aliasOverride,
    [masterPhysicalName, componentType, aliasOverride]
  );

  const startEditingAlias = () => {
    setAliasDraft(aliasOverride || '');
    setIsEditingAlias(true);
  };
  const saveAliasDraft = () => {
    onAliasOverrideChange?.(shortenAlias(aliasDraft.trim()));
    setIsEditingAlias(false);
  };
  const cancelEditingAlias = () => {
    setIsEditingAlias(false);
    setAliasDraft('');
  };
  const clearAlias = () => {
    onAliasOverrideChange?.('');
    setAliasDraft('');
    setIsEditingAlias(false);
  };

  const handlePreviewSchema = async (schema: File, type: 'raw' | 'master') => {
    try {
      const text = await schema.text();
      const parsed = JSON.parse(text);
      setSchemaPreview({
        title: `Schema ${type === 'raw' ? 'Raw' : 'Master'} — ${schema.name}`,
        content: JSON.stringify(parsed, null, 2),
      });
    } catch {
      setSchemaPreview({ title: schema.name, content: 'Error al leer el archivo' });
    }
  };

  const persistSchemas = async (currentRaw: File | null, currentMaster: File | null) => {
    if (!objectId || !currentMaster) return;
    try {
      const masterContent = await currentMaster.text();
      const masterData = JSON.parse(masterContent);
      let rawData = undefined;
      if (currentRaw) {
        const rawContent = await currentRaw.text();
        rawData = JSON.parse(rawContent);
      }
      await pipelineGeneratorService.saveSchemas({
        object_id: objectId,
        raw_schema_data: rawData,
        master_schema_data: masterData,
        component_type: componentType,
        raw_file_name: currentRaw?.name,
        master_file_name: currentMaster.name,
      });
    } catch {
      // non-critical
    }
  };

  const handleFileUpload = async (type: 'raw' | 'master', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Solo los de este esquema: los del otro siguen siendo validos.
    setErroresDe(type, []);

    if (!file.name.endsWith('.schema')) {
      setErroresDe(type, [{ message: 'Por favor selecciona un archivo .schema válido', severity: 'error' }]);
      return;
    }

    // Primero guardamos el archivo inmediatamente
    onSchemaUpload(type, file);

    // Luego validamos de manera opcional (no bloqueante)
    try {
      const validation = await pipelineGeneratorService.validateSchema(file, type);

      const errors: ValidationError[] = [
        ...validation.errors.map(error => ({
          message: error,
          severity: 'error' as const
        })),
        ...validation.warnings.map(warning => ({
          message: warning,
          severity: 'warning' as const
        }))
      ];

      setErroresDe(type, errors);

      // Persistir esquemas si la validacion no tuvo errores
      if (!validation.errors.length) {
        const newRaw = type === 'raw' ? file : rawSchema;
        const newMaster = type === 'master' ? file : masterSchema;
        persistSchemas(newRaw, newMaster);
      }
    } catch (error) {
      // Error de validación (no crítico)
      setErroresDe(type, [{
        message: `Archivo cargado. Validación opcional falló: ${error instanceof Error ? error.message : 'Error de conexión'}`,
        severity: 'warning'
      }]);
      // Aún así persistir — la validación es opcional
      const newRaw = type === 'raw' ? file : rawSchema;
      const newMaster = type === 'master' ? file : masterSchema;
      persistSchemas(newRaw, newMaster);
    }
  };

  const handleRemoveFile = (type: 'raw' | 'master') => {
    onSchemaUpload(type, null);
    setErroresDe(type, []);
  };


  return (
    <>
    <div className="space-y-4">
      {/* Component Type and Schema Upload Combined */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Configuración y Subida de Schemas</h3>

        {/* Las dos decisiones que afectan a toda la generacion, en una sola
            fila: antes iban apiladas y competian entre si, y la ayuda del modo
            de validacion acababa pegada al primer schema. */}
        <div className="mb-3 rounded-lg bg-gray-50/70 px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <span className="block text-sm font-semibold text-gray-800 mb-1.5">Tipo de Componente</span>
            <div className="space-y-1">
              {COMPONENT_TYPES.map(({ value, label }) => (
                <label key={value} className="flex items-center">
                  <input
                    type="radio"
                    name="componentType"
                    value={value}
                    checked={componentType === value}
                    onChange={(e) => onComponentTypeChange(e.target.value as ComponentTypeArg)}
                    className="h-4 w-4 text-timia-accent border-gray-300 focus:ring-timia-accent/50"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="block mb-1.5">
              <span className="text-sm font-semibold text-gray-800">Validación implícita</span>
              <span className="ml-2 text-xs text-gray-500">
                {VALIDATION_MODES.find((m) => m.value === (validationMode ?? 'STRICT_VALIDATION'))?.hint}
              </span>
            </span>
            <div className="space-y-1">
              {VALIDATION_MODES.map(({ value, note }) => (
                <label key={value} className="flex items-center">
                  <input
                    type="radio"
                    name="validationMode"
                    value={value}
                    checked={(validationMode ?? 'STRICT_VALIDATION') === value}
                    onChange={(e) => onValidationModeChange?.(e.target.value as ValidationMode)}
                    className="h-4 w-4 text-timia-accent border-gray-300 focus:ring-timia-accent/50"
                  />
                  <span className="ml-2 text-sm text-gray-700">{value}</span>
                  {note && <span className="ml-1.5 text-xs text-gray-500">{note}</span>}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Schema Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {componentType === 'tabla' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Schema Raw</label>
              {!rawSchema ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                  <ArrowUpTrayIcon className="mx-auto h-6 w-6 text-gray-400" />
                  <div className="mt-2">
                    <label htmlFor="file-raw" className="cursor-pointer">
                      <span className="block text-xs font-medium text-gray-900">
                        Subir archivo .schema
                      </span>
                      <input
                        id="file-raw"
                        name="file-raw"
                        type="file"
                        accept=".schema"
                        className="sr-only"
                        onChange={(e) => handleFileUpload('raw', e)}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                      <div className="ml-2">
                        <p className="text-xs font-medium text-gray-900">{rawSchema.name}</p>
                        <p className="text-xs text-gray-500">{(rawSchema.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handlePreviewSchema(rawSchema, 'raw')} className="p-1 text-gray-400 hover:text-timia-accent rounded transition-colors" title="Ver schema">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleRemoveFile('raw')} className="p-1 text-gray-400 hover:text-danger rounded transition-colors" title="Eliminar schema">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <AvisosEsquema avisos={validationErrors.raw} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schema Master</label>
            {!masterSchema ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <ArrowUpTrayIcon className="mx-auto h-6 w-6 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="file-master" className="cursor-pointer">
                    <span className="block text-xs font-medium text-gray-900">
                      Subir archivo .schema
                    </span>
                    <input
                      id="file-master"
                      name="file-master"
                      type="file"
                      accept=".schema"
                      className="sr-only"
                      onChange={(e) => handleFileUpload('master', e)}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                    <div className="ml-2">
                      <p className="text-xs font-medium text-gray-900">{masterSchema.name}</p>
                      <p className="text-xs text-gray-500">{(masterSchema.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePreviewSchema(masterSchema, 'master')} className="p-1 text-gray-400 hover:text-timia-accent rounded transition-colors" title="Ver schema">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleRemoveFile('master')} className="p-1 text-gray-400 hover:text-danger rounded transition-colors" title="Eliminar schema">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <AvisosEsquema avisos={validationErrors.master} />

            {/* Alias contextual: sólo cuando hay master schema y podemos operar.
                Tres estados: warning (nombre sin alias), override activo, edit affordance sutil. */}
            {masterSchema && onAliasOverrideChange && (
              <div className="mt-2 rounded-md bg-gray-50 px-3 py-2">
                {isEditingAlias ? (
                  // ESTADO EDIT: sin caja propia, ya la pone el bloque de metadatos
                  <div className="text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="alias-input" className="text-gray-500">Alias:</label>
                      <input
                        id="alias-input"
                        type="text"
                        autoFocus
                        value={aliasDraft}
                        onChange={(e) => setAliasDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveAliasDraft();
                          if (e.key === 'Escape') cancelEditingAlias();
                        }}
                        placeholder="Ej. hdape001"
                        className="w-40 rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-timia-accent focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={saveAliasDraft}
                        className="font-medium text-timia-accent hover:underline"
                      >
                        Guardar
                      </button>
                      <span className="text-gray-300">·</span>
                      <button
                        type="button"
                        onClick={cancelEditingAlias}
                        className="text-gray-500 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                    </div>
                    {aliasDraft.trim().length > ALIAS_MAX_LENGTH ? (
                      <p className="mt-0.5 text-warning">
                        {aliasDraft.trim().length} chars — se acortará a{' '}
                        <span className="font-mono">{shortenAlias(aliasDraft.trim())}</span>
                      </p>
                    ) : (
                      <p className="mt-0.5 text-gray-400">
                        Máximo {ALIAS_MAX_LENGTH} chars; si excede se quitan vocales de derecha a izquierda.
                      </p>
                    )}
                  </div>
                ) : aliasOverride ? (
                  // ESTADO OVERRIDE ACTIVO: chip informativo con acciones + desglose si aplica
                  <div className="rounded-md border border-timia-accent/30 bg-timia-accent/5 px-2.5 py-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-timia-accent flex-shrink-0" />
                      <span className="text-xs text-gray-700">
                        Alias override: <span className="font-semibold text-timia-accent font-mono">{aliasOverride}</span>
                      </span>
                      <button
                        type="button"
                        onClick={startEditingAlias}
                        className="ml-auto p-1 text-gray-400 hover:text-timia-accent rounded transition-colors"
                        title="Editar alias"
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={clearAlias}
                        className="p-1 text-gray-400 hover:text-danger rounded transition-colors"
                        title="Quitar override (volver a alias automático)"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {aliasBreakdown && (
                      <p className="mt-1 pl-6 text-[11px] text-gray-500">
                        <span className="font-mono text-timia-accent">{aliasBreakdown.origen}</span>{' '}
                        {aliasBreakdown.origenLabel} · <span className="font-mono text-timia-accent">{aliasBreakdown.marker}</span>{' '}
                        {aliasBreakdown.markerLabel} · <span className="font-mono text-timia-accent">{aliasBreakdown.aplicativo}</span>{' '}
                        {aliasBreakdown.aplicativoLabel} · <span className="font-mono text-timia-accent">{aliasBreakdown.descriptivo}</span>{' '}
                        descriptivo
                      </p>
                    )}
                  </div>
                ) : showAliasWarning ? (
                  // ESTADO WARNING: nombre físico probablemente sin alias
                  <div className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-subtle px-2.5 py-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-amber-900">
                        <span className="font-medium">Alias no detectado</span> en <code className="bg-warning-muted px-1 rounded">{masterPhysicalName}</code>. Especifica manualmente:
                      </p>
                      <button
                        type="button"
                        onClick={startEditingAlias}
                        className="mt-1.5 text-xs font-medium text-timia-accent hover:underline"
                      >
                        + Especificar alias
                      </button>
                    </div>
                  </div>
                ) : (
                  // ESTADO SUBTLE: derived alias con desglose si cumple patrón; edit affordance
                  <div className="px-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      {aliasBreakdown && (
                        <CheckCircleIcon
                          className="h-3.5 w-3.5 text-emerald-500"
                          aria-label="Alias reconocido"
                        />
                      )}
                      <span>
                        Alias: <span className="font-mono text-gray-700">{derivedAlias || '—'}</span>
                      </span>
                      {derivedWasShortened && (
                        <span
                          className="text-[10px] uppercase tracking-wide text-warning font-medium"
                          title={`Original de ${derivedAliasRaw.length} chars, acortado a ${ALIAS_MAX_LENGTH} quitando vocales.`}
                        >
                          acortado
                        </span>
                      )}
                      <span className="text-gray-300">·</span>
                      <button
                        type="button"
                        onClick={startEditingAlias}
                        className="text-timia-accent hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                    {aliasBreakdown && (
                      <p className="mt-0.5 pl-5 text-[11px] text-gray-400">
                        <span className="font-mono text-gray-600">{aliasBreakdown.origen}</span>{' '}
                        {aliasBreakdown.origenLabel} · <span className="font-mono text-gray-600">{aliasBreakdown.marker}</span>{' '}
                        {aliasBreakdown.markerLabel} · <span className="font-mono text-gray-600">{aliasBreakdown.aplicativo}</span>{' '}
                        {aliasBreakdown.aplicativoLabel} · <span className="font-mono text-gray-600">{aliasBreakdown.descriptivo}</span>{' '}
                        descriptivo
                      </p>
                    )}
                  </div>
                )}
                {masterSecurityLevel && (
                  <div className="mt-1.5 flex items-center gap-2 border-t border-gray-200 pt-1.5 text-[11px]">
                    <span className="text-gray-500">Nivel de Seguridad:</span>
                    <span className="font-mono text-gray-700">{masterSecurityLevel}</span>
                    {masterSecurityLevel === 'L2' && (
                      <span
                        className="text-[10px] uppercase tracking-wide font-medium text-info"
                        title="El schema master es L2, así que Kirby y SmartCleaner generan además la fase L1T."
                      >
                        genera L1T
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>

      <FilePreviewModal
        file={schemaPreview ? { name: schemaPreview.title, content: schemaPreview.content } : null}
        onClose={() => setSchemaPreview(null)}
      />
    </>
  );
};