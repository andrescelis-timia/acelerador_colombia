'use client';

import { useState } from 'react';
import { ArrowUpTrayIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/context/AuthContext';
import type { SampleAnalysisProps, SampleAnalysisResult, SampleField } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const TYPE_OPTIONS = ['string', 'integer', 'decimal', 'date', 'timestamp', 'boolean'];

const TYPE_COLORS: Record<string, string> = {
  string: 'bg-gray-100 text-gray-700',
  integer: 'bg-blue-100 text-blue-700',
  decimal: 'bg-purple-100 text-purple-700',
  date: 'bg-green-100 text-green-700',
  timestamp: 'bg-teal-100 text-teal-700',
  boolean: 'bg-orange-100 text-orange-700',
};

export const SampleAnalysis = ({ objectId }: SampleAnalysisProps) => {
  const { user, country } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SampleAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<SampleField[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setFields([]);
      setError(null);
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
    }
  };

  const handleAnalyze = async () => {
    if (!file || !user?.email) return;

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('object_id', objectId);

      const response = await fetch(`${API_URL}/pipeline-generator/sample/analyze`, {
        method: 'POST',
        headers: {
          'X-User': user.email,
          'X-Country': country || 'CO',
        },
        body: formData,
      });

      const data: SampleAnalysisResult = await response.json();

      if (!response.ok) {
        setError((data as { detail?: string }).detail || 'Error al analizar');
        return;
      }

      setResult(data);
      setFields(data.fields || []);
    } catch {
      setError('Error de conexion al analizar el archivo');
    } finally {
      setAnalyzing(false);
    }
  };

  const updateFieldType = (position: number, newType: string) => {
    setFields(prev => prev.map(f =>
      f.position === position ? { ...f, data_type: newType } : f
    ));
  };

  const isParquet = file?.name.endsWith('.parquet');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisis de Muestra</h3>

        {/* Upload area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => { setFile(null); setResult(null); setFields([]); }}
                className="text-red-500 hover:text-red-700 text-sm ml-4"
              >
                Quitar
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Arrastra un archivo o haz click para seleccionar</p>
              <p className="text-xs text-gray-400 mt-1">CSV, TXT, TSV, Parquet</p>
              <input
                type="file"
                className="hidden"
                accept=".csv,.txt,.tsv,.parquet"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>

        {/* Analyze button */}
        {file && !result && (
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-6 py-2.5 bg-[#0A3977] text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {analyzing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
              {analyzing ? 'Analizando...' : 'Analizar Muestra'}
            </button>
            {!isParquet && (
              <p className="text-xs text-gray-400">Se detectara automaticamente delimitador, header y tipos de datos</p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {result?.metadata && (
        <>
          {/* Metadata cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-lg shadow-sm border p-3">
              <p className="text-xs text-gray-500">Filas</p>
              <p className="text-lg font-bold text-gray-900">{result.metadata.total_rows}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-3">
              <p className="text-xs text-gray-500">Columnas</p>
              <p className="text-lg font-bold text-gray-900">{result.metadata.total_columns}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-3">
              <p className="text-xs text-gray-500">Delimitador</p>
              <p className="text-lg font-bold text-gray-900 font-mono">
                {result.metadata.delimiter === '\t' ? 'TAB' : result.metadata.delimiter || 'N/A'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-3">
              <p className="text-xs text-gray-500">Header</p>
              <p className="text-lg font-bold text-gray-900">{result.metadata.has_header ? 'Si' : 'No'}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-3">
              <p className="text-xs text-gray-500">Tipo</p>
              <p className="text-lg font-bold text-gray-900 capitalize">{result.metadata.file_type}</p>
            </div>
          </div>

          {/* Fields table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Campos Detectados ({fields.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formato</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nullable</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ejemplos</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transformaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field) => (
                    <tr key={field.position} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-400">{field.position}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 font-mono">{field.field_name}</td>
                      <td className="px-4 py-3">
                        <select
                          value={field.data_type}
                          onChange={(e) => updateFieldType(field.position, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${TYPE_COLORS[field.data_type] || 'bg-gray-100'}`}
                        >
                          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-mono">{field.format || '-'}</td>
                      <td className="px-4 py-3 text-xs">{field.nullable ? <span className="text-yellow-600">Si</span> : <span className="text-gray-400">No</span>}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono max-w-[200px] truncate">
                        {field.sample_values.join(', ')}
                      </td>
                      <td className="px-4 py-3">
                        {field.suggested_transformations.length > 0 ? (
                          <div className="space-y-1">
                            {field.suggested_transformations.map((t, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                <span className="text-xs text-amber-700">{t.description}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};