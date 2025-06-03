'use client';

import { useState } from 'react';
import { BoxFlowCard } from '@/components/molecules/BoxFlowCard';
import { BoxFlowControls } from '@/components/molecules/BoxFlowControls';
import { ErrorModal } from '@/components/molecules/ErrorModal';
import { CSVData } from './types';
import { PlayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { applyOperations } from '@/services/MER';
import { ApplyOperationsResponse } from '@/services/MER/types';
import { useAuth } from '@/lib/context/AuthContext';
import JSZip from 'jszip';

export const DesignerToolContent = () => {
  const { user, country } = useAuth();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVData[]>([]);
  const [processedResult, setProcessedResult] = useState<ApplyOperationsResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCsvFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const parsedData = parseCSV(text);
          setCsvFile(file);
          setCsvData(parsedData);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Error al leer el archivo CSV');
        }
      }
    };
    input.click();
  };

  const parseCSV = (text: string): CSVData[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
    }

    // Detectar delimitador
    const firstLine = lines[0];
    const delimiters = [',', ';', '|', '\t'];
    const delimiter = delimiters.find(d => firstLine.includes(d)) || ',';

    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
    const data: CSVData[] = [];

    // Verificar que existan las columnas requeridas
    const requiredColumns = ['request', 'table_code'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Faltan las columnas requeridas: ${missingColumns.join(', ')}`);
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: CSVData = {
          request: '',
          table_code: '',
          column_logical_name: '',
          comments: ''
        };

        headers.forEach((header, index) => {
          const value = values[index] || '';
          switch (header) {
            case 'request':
              row.request = value;
              break;
            case 'table_code':
              row.table_code = value;
              break;
            case 'column_logical_name':
              row.column_logical_name = value;
              break;
            case 'comments':
              row.comments = value;
              break;
          }
        });

        if (row.request && row.table_code) {
          data.push(row);
        }
      }
    }

    if (data.length === 0) {
      throw new Error('No se encontraron filas válidas en el archivo CSV. Verifique que tenga las columnas: request, table_code');
    }

    return data;
  };

  const handleProcessOperations = async () => {
    if (!csvData.length || !user?.email) {
      setErrorMessage('Se requieren datos CSV válidos y un usuario autenticado');
      return;
    }

    setIsProcessing(true);
    try {
      const requestData = {
        details: csvData.map(row => ({
          request: row.request,
          table_code: row.table_code,
          column_logical_name: row.column_logical_name || '',
          comments: row.comments || ''
        }))
      };

      const result = await applyOperations(requestData, user.email, country);
      
      if (result) {
        setProcessedResult(result);
        setSuccessMessage('Operaciones procesadas correctamente');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage('No se obtuvo respuesta del servidor');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al procesar las operaciones');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!processedResult) {
      setErrorMessage('No hay resultados para descargar');
      return;
    }

    try {
      const zip = new JSZip();

      // Convertir results a CSV
      const csvContent = convertResultsToCSV(processedResult.results);
      
      // Crear el archivo CSV con codificación UTF-8 explícita
      zip.file('output.csv', csvContent, {
        binary: false,
        // Asegurar que se mantenga la codificación UTF-8
        createFolders: false
      });

      // Agregar script VB si existe y no está vacío
      if (processedResult.vb_script && processedResult.vb_script.trim() !== '') {
        zip.file('output.vbs', processedResult.vb_script);
      }

      // Generar y descargar el ZIP
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });
      
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pdm_operations_output.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage('Archivos descargados correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al generar la descarga');
    }
  };

  const convertResultsToCSV = (results: ApplyOperationsResponse['results']): string => {
    // Determinar el delimitador basado en la configuración regional
    // En España y otros países europeos, Excel suele usar punto y coma
    const delimiter = ';'; // Cambiar a ',' si prefieres coma
    
    const headers = [
      'request',
      'table_code', 
      'column_logical_name',
      'comments',
      'status',
      'reply',
      'error'
    ];

    // Agregar BOM UTF-8 al inicio para que Excel reconozca correctamente el archivo
    const BOM = '\uFEFF';
    const csvRows = [BOM + headers.join(delimiter)];

    // Función para escapar valores CSV correctamente
    const escapeCSVValue = (value: string): string => {
      if (!value) return '""';
      
      // Reemplazar comillas dobles con comillas dobles escapadas
      let escapedValue = value.replace(/"/g, '""');
      
      // Reemplazar saltos de línea con espacios para evitar problemas
      escapedValue = escapedValue.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ');
      
      // Reemplazar múltiples espacios con uno solo
      escapedValue = escapedValue.replace(/\s+/g, ' ').trim();
      
      return `"${escapedValue}"`;
    };

    results.forEach(result => {
      const row = [
        escapeCSVValue(result.request || ''),
        escapeCSVValue(result.table_code || ''),
        escapeCSVValue(result.column_logical_name || ''),
        escapeCSVValue(result.comments || ''),
        escapeCSVValue(result.status || ''),
        escapeCSVValue(result.reply || ''),
        escapeCSVValue(result.error || '')
      ];
      csvRows.push(row.join(delimiter));
    });

    return csvRows.join('\n');
  };

  const getControls = () => {
    const canProcess = csvFile && csvData.length > 0 && !isProcessing;
    const canDownload = processedResult !== null;

    return (
      <BoxFlowControls
        leftIcons={[{
          icon: <PlayIcon className="h-5 w-5" />,
          onClick: handleProcessOperations,
          className: "text-green-500 hover:text-green-600",
          disabled: !canProcess,
          tooltip: !csvFile ? 'Debe cargar un archivo CSV' : 
                  csvData.length === 0 ? 'El archivo CSV no contiene datos válidos' :
                  isProcessing ? 'Procesando...' : 'Procesar operaciones'
        }]}
        rightIcons={[{
          icon: <ArrowDownTrayIcon className="h-5 w-5" />,
          onClick: handleDownload,
          className: "text-blue-500 hover:text-blue-600",
          disabled: !canDownload,
          tooltip: !processedResult ? 'No hay resultados para descargar' : 'Descargar resultados'
        }]}
      />
    );
  };

  return (
    <>
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fade-in-out">
          {successMessage}
        </div>
      )}

      <div className="relative p-8">
        <div className="mb-8">
          <h2 className="text-[#00A3FF] text-xl font-semibold">Herramienta de Edición PDM</h2>
        </div>

        <div className="flex items-center gap-12">
          <div className="relative z-10">
            <BoxFlowCard
              title={<>Operaciones<br/>PDM</>}
              isStatic={false}
              schema="csv"
              selectedFile={csvFile}
              onFileClick={handleCsvFileSelect}
              className="border-2 border-[#94B5F0]"
              controls={getControls()}
            />
          </div>
        </div>

        {processedResult && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Resultados del procesamiento</h3>
            <div className="text-xs text-blue-600">
              <div>Total de operaciones: {processedResult.results.length}</div>
              <div>Generadas: {processedResult.results.filter(r => r.status === 'GENERATED').length}</div>
              <div>Observaciones: {processedResult.results.filter(r => r.status === 'REPLIED').length}</div>
              <div>Con errores: {processedResult.results.filter(r => r.status === 'ERROR').length}</div>
            </div>
          </div>
        )}
      </div>

      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}; 