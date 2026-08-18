import type JSZip from 'jszip';

export const CI_CONFIG_FILE_NAME = 'ci.yml';

/**
 * Va en la raíz del ZIP, fuera de `kirby/`, `hammurabi/` y `others/`: describe
 * el comportamiento del repositorio entero, no el de una carpeta.
 */
export const CI_CONFIG_CONTENT = `# ci.yml
behaviour:
  registerJobs: true
  registerJobsWork: true
`;

export const addCiConfigToZip = (zip: JSZip): void => {
  zip.file(CI_CONFIG_FILE_NAME, CI_CONFIG_CONTENT);
};

/** Para el camino de respaldo, que descarga los ficheros sueltos sin ZIP. */
export const ciConfigAsFile = () => ({
  file_name: CI_CONFIG_FILE_NAME,
  content: CI_CONFIG_CONTENT,
});