// Código curto e legível para documentos (ISO 9001) — ex.: "NEXO-7F3A2B".
// Base32 sem caracteres ambíguos (sem I/O/0/1), fácil de ditar em reunião.
const ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function gerarCodigoDocumento(random: () => number = Math.random): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += ALFABETO[Math.floor(random() * ALFABETO.length)];
  }
  return `NEXO-${s}`;
}

/** Valida o formato NEXO-XXXXXX (6 chars do alfabeto). */
export function ehCodigoValido(codigo: string): boolean {
  return new RegExp(`^NEXO-[${ALFABETO}]{6}$`).test(codigo);
}
