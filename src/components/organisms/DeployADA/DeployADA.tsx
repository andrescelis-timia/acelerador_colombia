'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  RocketLaunchIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { usePipelineGeneratorService, DeployConfig, DeployStatusItem, ArtifactsStatus } from '@/services/PipelineGenerator';
import { useAuth } from '@/lib/context/AuthContext';

interface DeployADAProps {
  objectId: string;
}

const GENERATORS = [
  { id: 'kirby', label: 'Kirby', accent: 'bg-blue-500' },
  { id: 'hammurabi', label: 'Hammurabi', accent: 'bg-amber-500' },
  { id: 'smartcleaner', label: 'SmartCleaner', accent: 'bg-purple-500' },
] as const;

type GeneratorId = typeof GENERATORS[number]['id'];

export const DeployADA = ({ objectId }: DeployADAProps) => {
  const { user } = useAuth();
  const service = usePipelineGeneratorService();

  const [config, setConfig] = useState<DeployConfig>({
    repositories: {}, jira_hus: {}, owner_emails: [], datum_link: '',
  });
  const [emailInput, setEmailInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deploying, setDeploying] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, DeployStatusItem>>({});
  const [artifactsStatus, setArtifactsStatus] = useState<ArtifactsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (!objectId || !user?.email) return;
    const load = async () => {
      setLoading(true);
      try {
        const [configRes, statusRes, artStatus] = await Promise.allSettled([
          service.getDeployConfig(objectId),
          service.getDeployStatus(objectId),
          service.getArtifactsStatus(objectId),
        ]);
        if (configRes.status === 'fulfilled') { setConfig(configRes.value); setSaveStatus('saved'); }
        if (statusRes.status === 'fulfilled') {
          const st = statusRes.value;
          const map: Record<string, DeployStatusItem> = {};
          if (st.kirby) map.kirby = st.kirby;
          if (st.hammurabi) map.hammurabi = st.hammurabi;
          if (st.smartcleaner) map.smartcleaner = st.smartcleaner;
          setStatus(map);
        }
        if (artStatus.status === 'fulfilled') setArtifactsStatus(artStatus.value.status);
      } finally {
        setLoading(false);
        initialLoadDone.current = true;
      }
    };
    load();
  }, [objectId]);

  const serviceRef = useRef(service);
  serviceRef.current = service;

  useEffect(() => {
    if (!initialLoadDone.current) return;
    setSaveStatus('idle');
    debounceTimer.current && clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await serviceRef.current.saveDeployConfig(objectId, config);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 3000);
      }
      catch { setSaveStatus('idle'); }
    }, 800);
    return () => { debounceTimer.current && clearTimeout(debounceTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, objectId]);

  const handleDeploy = async (generatorType: string) => {
    setDeploying(prev => ({ ...prev, [generatorType]: true }));
    try {
      const result = await service.executeDeploy(objectId, generatorType);
      setStatus(prev => ({
        ...prev,
        [generatorType]: result.success
          ? { status: 'success', pr_url: result.pr_url, branch_name: result.branch_name }
          : { status: 'error', error_message: result.error },
      }));
    } catch (e) {
      setStatus(prev => ({
        ...prev,
        [generatorType]: { status: 'error', error_message: e instanceof Error ? e.message : 'Error desconocido' },
      }));
    } finally {
      setDeploying(prev => ({ ...prev, [generatorType]: false }));
    }
  };

  const addEmail = () => {
    const trimmed = emailInput.trim();
    if (trimmed && !config.owner_emails.includes(trimmed)) {
      setConfig(prev => ({ ...prev, owner_emails: [...prev.owner_emails, trimmed] }));
      setEmailInput('');
          }
  };

  const removeEmail = (email: string) => {
    setConfig(prev => ({ ...prev, owner_emails: prev.owner_emails.filter(e => e !== email) }));
      };

  const updateField = (gen: GeneratorId, field: 'repositories' | 'jira_hus', value: string) => {
    setConfig(prev => ({ ...prev, [field]: { ...prev[field], [gen]: value || undefined } }));
      };

  const isGenerated = (gen: string) => artifactsStatus?.[gen as keyof ArtifactsStatus] ?? false;
  const deployedCount = Object.values(status).filter(s => s.status === 'success').length;

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0A3977] mx-auto mb-2" />
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main card */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RocketLaunchIcon className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-medium text-gray-900">Despliegues ADA</h3>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400" />
                Guardando...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircleIcon className="h-3.5 w-3.5" /> Guardado
              </span>
            )}
            {deployedCount > 0 && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                {deployedCount}/3 desplegado{deployedCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* General config */}
          <div>
            <span className="text-xs text-gray-500 font-medium">Configuracion General</span>
            <div className="grid grid-cols-2 gap-6 mt-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Link DATUM</label>
                <input
                  type="text"
                  placeholder="https://datum.example.com/objeto/..."
                  value={config.datum_link || ''}
                  onChange={e => setConfig(prev => ({ ...prev, datum_link: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Emails Owner</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="owner@bbva.com"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                  />
                  <button onClick={addEmail} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors h-8">
                    Agregar
                  </button>
                </div>
                {config.owner_emails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {config.owner_emails.map(email => (
                      <span key={email} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                        {email}
                        <button onClick={() => removeEmail(email)} className="hover:text-red-600">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200" />

          {/* Generator cards */}
          <div>
            <span className="text-xs text-gray-500 font-medium">Componentes</span>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {GENERATORS.map(gen => {
                const hasArtifact = isGenerated(gen.id);
                const hasRepo = !!config.repositories[gen.id];
                const hasHu = !!config.jira_hus[gen.id];
                const canDeploy = hasArtifact && hasRepo && hasHu && !deploying[gen.id];
                const st = status[gen.id];
                const isDeploying = deploying[gen.id];

                return (
                  <div key={gen.id} className={`border rounded-lg ${st?.status === 'success' ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}>
                    {/* Card header */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                      <span className={`w-2 h-2 rounded-full ${gen.accent}`} />
                      <span className="text-xs font-medium text-gray-800">{gen.label}</span>
                      {hasArtifact
                        ? <CheckCircleIcon className="h-3.5 w-3.5 text-green-500 ml-auto" />
                        : <span className="ml-auto text-[10px] text-gray-400">Sin generar</span>
                      }
                    </div>

                    {/* Card body */}
                    <div className="p-3 space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Repositorio</label>
                        <input
                          type="text"
                          placeholder="https://bitbucket.org/ws/repo"
                          value={config.repositories[gen.id] || ''}
                          onChange={e => updateField(gen.id, 'repositories', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">HU Jira</label>
                        <input
                          type="text"
                          placeholder="HU-12345"
                          value={config.jira_hus[gen.id] || ''}
                          onChange={e => updateField(gen.id, 'jira_hus', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                        />
                      </div>

                      {/* Status */}
                      {st?.status === 'success' && st.pr_url && (
                        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1.5">
                          <CheckCircleIcon className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          <span className="flex-1 truncate">PR creada</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(st.pr_url!)}
                            className="p-0.5 hover:bg-green-100 rounded transition-colors"
                            title="Copiar link"
                          >
                            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                          </button>
                          <a href={st.pr_url} target="_blank" rel="noopener noreferrer"
                            className="p-0.5 hover:bg-green-100 rounded transition-colors"
                            title="Abrir PR"
                          >
                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                      {st?.status === 'error' && st.error_message && (
                        <div className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                          <ExclamationCircleIcon className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                          <span>{st.error_message}</span>
                        </div>
                      )}

                      {/* Deploy button */}
                      <button
                        onClick={() => handleDeploy(gen.id)}
                        disabled={!canDeploy}
                        className="w-full px-2 py-1.5 bg-[#0A3977] text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors h-8"
                      >
                        {isDeploying ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            Desplegando...
                          </>
                        ) : st?.status === 'success' ? 'Redesplegar' : 'Desplegar'}
                      </button>

                      {/* Hints */}
                      {!hasArtifact && <p className="text-[10px] text-gray-400 text-center">Genera {gen.label} primero</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
