#!/usr/bin/env node
/**
 * Sincroniza los documentos que se publican en la sección /admin/docs
 * desde el workspace docs/ al repo (src/data/docs/).
 *
 * Uso:
 *   npm run sync-docs
 *
 * Para añadir un documento nuevo, edita FILES + src/lib/docs/catalog.ts.
 * Las rutas src son relativas al repo (asumiendo que docs/ vive a 2 niveles arriba).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WORKSPACE = path.resolve(ROOT, '..');
const DEST_DIR = path.join(ROOT, 'src', 'data', 'docs');

const FILES = [
  {
    src: 'docs/1_operacion_soporte/RBAC_ROLES.md',
    dest: 'RBAC_ROLES.md',
  },
  {
    src: 'docs/2_arquitectura/diagramas/cloud/Cloud Architecture AWS.svg',
    dest: 'diagramas/cloud-architecture-aws.svg',
  },
  {
    src: 'docs/2_arquitectura/diagramas/proceso-end-to-end.svg',
    dest: 'diagramas/proceso-end-to-end.svg',
  },
  {
    src: 'docs/2_arquitectura/diagramas/aws-architecture-detail.svg',
    dest: 'diagramas/flujo-ia.svg',
  },
  {
    src: 'docs/2_arquitectura/diagramas/aws-architecture-pipeline-detail.svg',
    dest: 'diagramas/flujo-pipeline-generator.svg',
  },
];

function syncDocs() {
  let ok = 0;
  let fail = 0;

  for (const { src, dest } of FILES) {
    const srcPath = path.join(WORKSPACE, src);
    const destPath = path.join(DEST_DIR, dest);

    if (!fs.existsSync(srcPath)) {
      console.error(`  [missing]  ${src}`);
      fail++;
      continue;
    }

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
    const size = (fs.statSync(destPath).size / 1024).toFixed(1);
    console.log(`  [ok]       ${dest}  (${size} KB)`);
    ok++;
  }

  console.log(`\n${ok}/${FILES.length} archivos sincronizados${fail ? ` · ${fail} faltantes` : ''}`);
  if (fail) process.exit(1);
}

syncDocs();
