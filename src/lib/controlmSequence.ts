/**
 * Consecutivo de los JOBNAME de Control-M.
 *
 * El nombre reserva exactamente 3 caracteres para el consecutivo
 * -CUUAACP0`001`-, asi que 1000 no cabe: empujaria el nombre a 12 caracteres y
 * lo sacaria del estandar. Al agotarse las cifras se mete una letra, de derecha
 * a izquierda, en tres niveles:
 *
 *   nivel 1   digito digito digito     000 .. 999        1.000
 *   nivel 2   digito LETRA  alfanum    0A0 .. 9ZZ        9.360
 *   nivel 3   LETRA  alfanum alfanum   A00 .. ZZZ       33.696
 *
 * Es el mismo esquema que aplica el backend en
 * `controlm_xml_generator_service.py`; los dos tienen que coincidir porque
 * ambos construyen nombres.
 *
 * Queda fuera la forma digito-digito-LETRA (00A, 12Z): no pertenece a ningun
 * nivel y no se genera nunca.
 */

const DIGITOS = '0123456789';
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALFANUM = DIGITOS + LETRAS;

const NIVEL_1 = DIGITOS.length ** 3;                        // 1.000
const NIVEL_2 = DIGITOS.length * LETRAS.length * ALFANUM.length;  // 9.360
const NIVEL_3 = LETRAS.length * ALFANUM.length ** 2;        // 33.696

/** Ultimo consecutivo que cabe en 3 caracteres: 'ZZZ'. */
export const SECUENCIA_MAX = NIVEL_1 + NIVEL_2 + NIVEL_3 - 1;

/**
 * Codifica el consecutivo en los 3 caracteres del JOBNAME.
 * Devuelve null si se sale del rango, en vez de un nombre invalido.
 */
export function formatearSecuencia(seq: number): string | null {
  if (!Number.isInteger(seq) || seq < 0 || seq > SECUENCIA_MAX) return null;

  if (seq < NIVEL_1) return String(seq).padStart(3, '0');

  let resto = seq - NIVEL_1;
  if (resto < NIVEL_2) {
    const tercero = resto % ALFANUM.length;
    const alto = Math.floor(resto / ALFANUM.length);
    return DIGITOS[Math.floor(alto / LETRAS.length)] + LETRAS[alto % LETRAS.length] + ALFANUM[tercero];
  }

  resto -= NIVEL_2;
  const tercero = resto % ALFANUM.length;
  const alto = Math.floor(resto / ALFANUM.length);
  return LETRAS[Math.floor(alto / ALFANUM.length)] + ALFANUM[alto % ALFANUM.length] + ALFANUM[tercero];
}

/**
 * Lee los 3 caracteres del JOBNAME como numero. Inversa de `formatearSecuencia`.
 * Devuelve null para lo que no encaje en ningun nivel.
 */
export function parsearSecuencia(texto: string): number | null {
  const s = (texto || '').trim().toUpperCase();
  if (s.length !== 3) return null;

  const [a, b, c] = s;
  const esDigito = (ch: string) => DIGITOS.includes(ch);
  const esLetra = (ch: string) => LETRAS.includes(ch);
  const esAlfanum = (ch: string) => ALFANUM.includes(ch);

  if (esDigito(a) && esDigito(b) && esDigito(c)) return Number(s);

  if (esDigito(a) && esLetra(b) && esAlfanum(c)) {
    return NIVEL_1 +
      (DIGITOS.indexOf(a) * LETRAS.length + LETRAS.indexOf(b)) * ALFANUM.length +
      ALFANUM.indexOf(c);
  }

  if (esLetra(a) && esAlfanum(b) && esAlfanum(c)) {
    return NIVEL_1 + NIVEL_2 +
      (LETRAS.indexOf(a) * ALFANUM.length + ALFANUM.indexOf(b)) * ALFANUM.length +
      ALFANUM.indexOf(c);
  }

  return null;
}
