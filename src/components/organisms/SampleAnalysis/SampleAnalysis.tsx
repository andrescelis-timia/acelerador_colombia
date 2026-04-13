'use client';

import { useState, useEffect } from 'react';
import { ArrowUpTrayIcon, ExclamationTriangleIcon, CheckCircleIcon, XMarkIcon, BeakerIcon, EyeIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/context/AuthContext';
import type { SampleAnalysisProps, SampleAnalysisResult, SampleField } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const TYPE_COLORS: Record<string, string> = {
  string: 'bg-gray-100 text-gray-700',
  integer: 'bg-blue-100 text-blue-700',
  decimal: 'bg-purple-100 text-purple-700',
  date: 'bg-green-100 text-green-700',
  timestamp: 'bg-teal-100 text-teal-700',
  boolean: 'bg-orange-100 text-orange-700',
};

export const SampleAnalysis = ({ objectId, initialData }: SampleAnalysisProps) => {
  const { user, country } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SampleAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<SampleField[]>([]);
  const [acceptedTransformations, setAcceptedTransformations] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string[][] | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['transformations', 'fields']));

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  useEffect(() => {
    if (!initialData?.artifacts_data) return;
    const data = initialData.artifacts_data as unknown as SampleAnalysisResult & { accepted_transformation_keys?: string[] };
    setResult(data);
    setFields(data.fields || []);
    if (data.accepted_transformation_keys) {
      setAcceptedTransformations(new Set(data.accepted_transformation_keys));
    } else {
      setAcceptedTransformations(new Set());
    }
    if (data.preview_rows) {
      setPreviewContent(data.preview_rows);
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setFields([]);
      setError(null);
      setPreviewContent(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setResult(null);
      setFields([]);
      setError(null);
      setPreviewContent(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !user?.email) return;
    setAnalyzing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (objectId) formData.append('object_id', objectId);
      const response = await fetch(`${API_URL}/pipeline-generator/sample/analyze`, {
        method: 'POST',
        headers: { 'X-User': user.email, 'X-Country': country || 'CO' },
        body: formData,
      });
      const data: SampleAnalysisResult = await response.json();
      if (!response.ok) {
        setError((data as { detail?: string }).detail || 'Error al analizar');
        return;
      }
      setResult(data);
      setFields(data.fields || []);
      setAcceptedTransformations(new Set());
      if (data.preview_rows) {
        setPreviewContent(data.preview_rows);
      }
    } catch {
      setError('Error de conexion al analizar el archivo');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleTransformation = (key: string) => {
    setAcceptedTransformations(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const saveAcceptedTransformations = async (keys: Set<string>) => {
    if (!objectId || !user?.email || !result) return;
    try {
      await fetch(`${API_URL}/pipeline-generator/sample/accepted-transformations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User': user.email,
          'X-Country': country || 'CO',
        },
        body: JSON.stringify({ object_id: objectId, accepted_keys: Array.from(keys) }),
      });
    } catch {
      // non-critical — silently ignore
    }
  };

  const handleCloseModal = () => {
    if (result) saveAcceptedTransformations(acceptedTransformations);
    setModalOpen(false);
  };

  const handleDeleteSample = () => {
    setResult(null); setFields([]); setFile(null); setPreviewContent(null);
    if (!objectId || !user?.email) return;
    fetch(`${API_URL}/pipeline-generator/sample/${objectId}`, {
      method: 'DELETE',
      headers: { 'X-User': user.email, 'X-Country': country || 'CO' },
    }).catch(() => {});
  };

  const totalTransformations = fields.reduce((sum, f) => sum + f.suggested_transformations.length, 0);

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BeakerIcon className="h-5 w-5 text-gray-400" />
          <div>
            <span className="text-sm font-medium text-gray-700">Analisis de Muestra</span>
            {result?.metadata && (
              <div className="flex items-center gap-2 mt-0.5">
                <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs text-gray-500">
                  {result.metadata.total_columns} campos
                  {totalTransformations > 0 ? `, ${totalTransformations} transformaciones recomendadas` : ', sin transformaciones recomendadas'}
                </span>
              </div>
            )}
            {!result && (
              <p className="text-xs text-gray-400 mt-0.5">Sube una muestra CSV/TXT/Parquet para detectar tipos y transformaciones</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <>
              {previewContent && (
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Ver muestra"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleDeleteSample}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar analisis"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-[#0A3977] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Ver Resultados
              </button>
            </>
          )}
          {!result && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 text-sm font-medium text-[#0A3977] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Analizar
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col text-xs">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Analisis de Muestra</h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-3">
              {/* Upload */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
                  file || result ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={handleDeleteSample} className="text-red-500 hover:text-red-700 ml-4">Quitar</button>
                  </div>
                ) : result?.metadata ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <p className="font-medium text-gray-900">{result.metadata.file_name}</p>
                    <label className="text-blue-600 hover:text-blue-800 cursor-pointer ml-2">
                      Cambiar archivo
                      <input type="file" className="hidden" accept=".csv,.txt,.tsv,.parquet" onChange={handleFileChange} />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <ArrowUpTrayIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-gray-600">Arrastra un archivo o haz click para seleccionar</p>
                    <p className="text-[10px] text-gray-400 mt-1">CSV, TXT, TSV, Parquet</p>
                    <input type="file" className="hidden" accept=".csv,.txt,.tsv,.parquet" onChange={handleFileChange} />
                  </label>
                )}
              </div>

              {file && !result && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-4 py-1.5 bg-[#0A3977] text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {analyzing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                  {analyzing ? 'Analizando...' : 'Analizar Muestra'}
                </button>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Results */}
              {result?.metadata && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                    {[
                      { label: 'Filas', value: result.metadata.total_rows },
                      { label: 'Columnas', value: result.metadata.total_columns },
                      { label: 'Delimitador', value: result.metadata.delimiter === '\t' ? 'TAB' : result.metadata.delimiter || 'N/A' },
                      { label: 'Header', value: result.metadata.has_header ? 'Si' : 'No' },
                      { label: 'Tipo', value: result.metadata.file_type },
                    ].map((m, i) => (
                      <div key={m.label} className="flex items-center gap-2">
                        {i > 0 && <span className="text-gray-200">|</span>}
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{m.label}</span>
                        <span className="font-bold text-gray-900 font-mono">{m.value}</span>
                      </div>
                    ))}
                  </div>

                  {result.validation_warning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-amber-800">{result.validation_warning}</span>
                    </div>
                  )}
                  {result.validation_ok && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                      <CheckCircleIcon className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      <span className="text-green-800">{result.validation_ok}</span>
                    </div>
                  )}

                  {(() => {
                    const allTransformations = fields.flatMap((f) =>
                      f.suggested_transformations.map((t, ti) => ({
                        field: f.field_name,
                        key: `${f.field_name}::${ti}::${t.type}`,
                        ...t,
                      }))
                    );
                    const acceptedCount = allTransformations.filter(t => acceptedTransformations.has(t.key)).length;
                    return (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => toggleSection('transformations')}
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDownIcon className={`h-3.5 w-3.5 text-gray-500 transition-transform ${openSections.has('transformations') ? '' : '-rotate-90'}`} />
                            <span className="font-medium text-gray-700">
                              Transformaciones Recomendadas
                              {allTransformations.length > 0
                                ? <span className="ml-1.5 text-amber-600">({acceptedCount}/{allTransformations.length} aceptadas)</span>
                                : <span className="ml-1.5 text-green-600">(sin recomendaciones)</span>
                              }
                            </span>
                          </div>
                          {allTransformations.length > 0 && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setAcceptedTransformations(new Set(allTransformations.map(t => t.key)))}
                                className="text-[10px] text-gray-500 hover:text-gray-800 underline"
                              >
                                Aceptar todo
                              </button>
                              <button
                                onClick={() => setAcceptedTransformations(new Set())}
                                className="text-[10px] text-gray-500 hover:text-gray-800 underline"
                              >
                                Rechazar todo
                              </button>
                            </div>
                          )}
                        </div>
                        {openSections.has('transformations') && allTransformations.length > 0 && (
                          <div className="px-3 py-2 space-y-0.5 border-t border-gray-100">
                            {allTransformations.map((t) => {
                              const isAccepted = acceptedTransformations.has(t.key);
                              return (
                                <label key={t.key} className={`flex items-center gap-2 rounded px-2 py-1 cursor-pointer transition-colors ${isAccepted ? 'bg-amber-50/60' : 'opacity-40'}`}>
                                  <input type="checkbox" checked={isAccepted} onChange={() => toggleTransformation(t.key)} className="h-3 w-3 text-amber-600 rounded border-gray-300 flex-shrink-0" />
                                  <span className="font-mono font-semibold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">{t.field}</span>
                                  <span className={`${isAccepted ? 'text-gray-600' : 'text-gray-400 line-through'}`}>{t.description}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div
                      onClick={() => toggleSection('fields')}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <ChevronDownIcon className={`h-3.5 w-3.5 text-gray-500 transition-transform ${openSections.has('fields') ? '' : '-rotate-90'}`} />
                      <span className="font-medium text-gray-700">Campos Detectados ({fields.length})</span>
                    </div>
                    {openSections.has('fields') && (
                      <div className="overflow-auto max-h-[45vh] border-t border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-2.5 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase">#</th>
                              <th className="px-2.5 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase">Campo</th>
                              <th className="px-2.5 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase">Tipo</th>
                              <th className="px-2.5 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase">Formato</th>
                              <th className="px-2.5 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase">Nullable</th>
                              <th className="px-2.5 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase">Ejemplos</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {fields.map((field) => (
                              <tr key={field.position} className="hover:bg-gray-50">
                                <td className="px-2.5 py-1.5 text-gray-400">{field.position}</td>
                                <td className="px-2.5 py-1.5 font-medium text-gray-900 font-mono">{field.field_name}</td>
                                <td className="px-2.5 py-1.5">
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_COLORS[field.data_type] || 'bg-gray-100'}`}>{field.data_type}</span>
                                </td>
                                <td className="px-2.5 py-1.5 text-gray-600 font-mono">{field.format || '-'}</td>
                                <td className="px-2.5 py-1.5">{field.nullable ? <span className="text-yellow-600">Si</span> : <span className="text-gray-400">No</span>}</td>
                                <td className="px-2.5 py-1.5 text-gray-500 font-mono max-w-[180px] truncate">{field.sample_values.join(', ')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {previewOpen && previewContent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setPreviewOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Contenido de la Muestra
                <span className="text-sm font-normal text-gray-400 ml-2">(primeras {result?.metadata?.has_header ? previewContent.length - 1 : previewContent.length} filas)</span>
              </h2>
              <button onClick={() => setPreviewOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-auto p-4">
              <table className="min-w-full text-xs font-mono">
                <thead>
                  <tr>
                    {previewContent[0]?.map((_, ci) => (
                      <th key={ci} className="px-2 py-1.5 text-left font-semibold text-gray-700 bg-gray-100 border-b border-gray-200 whitespace-nowrap">
                        {result?.metadata?.has_header && previewContent[0] ? previewContent[0][ci]?.trim() : `col_${ci}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewContent.slice(result?.metadata?.has_header ? 1 : 0).map((row, ri) => (
                    <tr key={ri} className="hover:bg-gray-50 border-b border-gray-100">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-2 py-1.5 text-gray-600 whitespace-nowrap">{cell.trim()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};