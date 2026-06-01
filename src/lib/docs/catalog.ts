/**
 * Catálogo de documentos publicados en /admin/docs.
 *
 * Cada entrada corresponde a un archivo en src/data/docs/ (servidos vía
 * /api/docs/[...path] con guard de rol ADMIN).
 *
 * Para añadir un nuevo doc:
 *  1. Editar scripts/sync-docs.js + correr `npm run sync-docs`.
 *  2. Añadir la entrada aquí con su tipo (md | svg), icono y descripción.
 */

import type { ComponentType } from 'react';
import {
  ShieldCheckIcon,
  CloudIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

export type DocType = 'md' | 'svg';

export interface DocEntry {
  slug: string;                                          // identificador en la URL
  title: string;                                         // mostrado en sidebar + header
  description: string;                                   // subtítulo en el header del doc
  file: string;                                          // ruta relativa dentro de src/data/docs/
  type: DocType;
  icon: ComponentType<{ className?: string }>;
}

export interface DocGroup {
  id: string;
  title: string;
  entries: DocEntry[];
}

export const DOCS_CATALOG: DocGroup[] = [
  {
    id: 'roles',
    title: 'Roles y permisos',
    entries: [
      {
        slug: 'roles',
        title: 'Matriz de permisos (RBAC)',
        description: 'Roles del sistema y de proyecto, con la matriz de acciones por rol.',
        file: 'RBAC_ROLES.md',
        type: 'md',
        icon: ShieldCheckIcon,
      },
    ],
  },
  {
    id: 'diagramas',
    title: 'Diagramas',
    entries: [
      {
        slug: 'cloud-architecture-aws',
        title: 'Cloud Architecture (visión general)',
        description: 'Componentes AWS, integraciones externas y flujos macro del sistema.',
        file: 'diagramas/cloud-architecture-aws.svg',
        type: 'svg',
        icon: CloudIcon,
      },
      {
        slug: 'proceso-end-to-end',
        title: 'Proceso end-to-end (Fábrica TIMIA)',
        description: 'Workflow del equipo desde el pre-diccionario hasta la certificación de mallas.',
        file: 'diagramas/proceso-end-to-end.svg',
        type: 'svg',
        icon: ArrowsRightLeftIcon,
      },
      {
        slug: 'flujo-ia',
        title: 'Flujo del servicio IA',
        description: 'Estrategia cascada (catálogos → Qdrant → Claude) para generar diccionarios.',
        file: 'diagramas/flujo-ia.svg',
        type: 'svg',
        icon: SparklesIcon,
      },
      {
        slug: 'flujo-pipeline-generator',
        title: 'Flujo del Pipeline Generator',
        description: 'Análisis de muestra y generación determinista de Kirby, Hammurabi, SmartCleaner y Control-M.',
        file: 'diagramas/flujo-pipeline-generator.svg',
        type: 'svg',
        icon: CubeIcon,
      },
    ],
  },
];

export const findDocBySlug = (slug: string): DocEntry | undefined => {
  for (const group of DOCS_CATALOG) {
    const entry = group.entries.find(e => e.slug === slug);
    if (entry) return entry;
  }
  return undefined;
};

export const findDiagramBySlug = (slug: string): DocEntry | undefined => {
  return DOCS_CATALOG.find(g => g.id === 'diagramas')?.entries.find(e => e.slug === slug);
};

export const findGroupForSlug = (slug: string): DocGroup | undefined => {
  return DOCS_CATALOG.find(g => g.entries.some(e => e.slug === slug));
};
