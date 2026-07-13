// ————————————————————————————————————————————————
// Tokens de design — fonte única de cores para os estilos inline
// (style={{}}) e para os gráficos (Etapa 5).
//
// Espelha as CSS vars de globals.css (@theme). Mantenha os dois em
// sincronia: aqui para JS/TS, lá para classes utilitárias Tailwind.
// Código NOVO deve importar daqui em vez de repetir hex literais.
// ————————————————————————————————————————————————

export const cor = {
  // Marca
  brand: "#0068a9",
  brandDark: "#004e80",
  green: "#47ad4b",
  greenDark: "#33853a",
  ink: "#0e1a24",

  // Neutros
  surface: "#ffffff",
  surfaceSunk: "#eef4f9",
  appBg: "#f4f7fa",
  muted: "#5b6b78",
  faint: "#8493a0",
  faint2: "#a2afba",
  inkSoft: "#46586a",
  hairline: "#d9e2ea",

  // Estados semânticos
  warn: "#d98a00",
  warnFg: "#8a5a08",
  warnBg: "#fdf3e0",
  danger: "#c0392b",
  dangerBg: "#fdecea",
  success: "#33853a",
  successBg: "#eef7ef",
} as const;

// Paleta categórica para gráficos (séries por setor/nível). Deriva das
// cores de marca + estados, garantindo consistência com o resto do app.
export const paletaCategorica = [
  cor.brand,
  cor.green,
  cor.warn,
  cor.danger,
  cor.brandDark,
  cor.greenDark,
] as const;

// Cor por grau de maturidade — alinhada aos rótulos do domínio.
export const corMaturidade = {
  inicial: "#c0392b",
  em_desenvolvimento: "#d98a00",
  consolidado: "#0068a9",
  referencia: "#33853a",
} as const;
