// ————————————————————————————————————————————————
// Provedor de IA PLUGÁVEL — o motor por trás do diagnóstico inteligente.
//
// A ideia: qual IA usar é uma decisão trocável por configuração, não por
// reescrita. Hoje começamos no Groq (camada gratuita, rápido, estável, API
// no formato OpenAI); amanhã dá para apontar para Claude, um endpoint
// OpenAI-compatível, ou Ollama local — mudando só o .env.local.
//
// Sem banco, sem React, sem depender de nenhum SDK: é um fetch HTTP puro
// contra o endpoint chat/completions (o formato que Groq, OpenAI, Together,
// OpenRouter e Ollama expõem).
//
// Variáveis de ambiente (todas em .env.local, NUNCA no git):
//   AI_PROVIDER   groq | openai | ollama | custom   (default: groq)
//   AI_API_KEY    a chave do provedor (Ollama não precisa)
//   AI_MODEL      opcional — sobrescreve o modelo padrão do provedor
//   AI_BASE_URL   opcional — sobrescreve o endpoint (obrigatório p/ custom)
// ————————————————————————————————————————————————

export type ProvedorIA = "groq" | "openai" | "ollama" | "custom";

type PerfilProvedor = {
  baseUrl: string;
  modeloPadrao: string;
  precisaChave: boolean;
};

// Padrões por provedor. Todos falam o mesmo dialeto (chat/completions),
// então só mudam a URL e o modelo padrão.
const PERFIS: Record<ProvedorIA, PerfilProvedor> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    modeloPadrao: "llama-3.3-70b-versatile",
    precisaChave: true,
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    modeloPadrao: "gpt-4o-mini",
    precisaChave: true,
  },
  ollama: {
    baseUrl: "http://localhost:11434/v1",
    modeloPadrao: "llama3.1",
    precisaChave: false,
  },
  custom: {
    baseUrl: "",
    modeloPadrao: "",
    precisaChave: false,
  },
};

export type ConfigIA = {
  provedor: ProvedorIA;
  baseUrl: string;
  modelo: string;
  chave: string | null;
};

/** Lê a configuração do ambiente. Retorna null quando a IA não está
 *  configurada (sem chave onde é obrigatória, ou custom sem URL) — o
 *  diagnóstico por regra continua funcionando normalmente nesse caso. */
export function lerConfigIA(env: NodeJS.ProcessEnv = process.env): ConfigIA | null {
  const provedor = (env.AI_PROVIDER?.trim().toLowerCase() as ProvedorIA) || "groq";
  const perfil = PERFIS[provedor];
  if (!perfil) return null;

  const baseUrl = env.AI_BASE_URL?.trim() || perfil.baseUrl;
  const modelo = env.AI_MODEL?.trim() || perfil.modeloPadrao;
  const chave = env.AI_API_KEY?.trim() || null;

  if (!baseUrl || !modelo) return null; // custom mal configurado
  if (perfil.precisaChave && !chave) return null; // sem chave onde é preciso

  return { provedor, baseUrl, modelo, chave };
}

export type MensagemIA = { role: "system" | "user"; content: string };

/**
 * Faz uma chamada de chat e devolve o texto da resposta. Formato OpenAI
 * (Groq/OpenAI/Ollama/etc.). `response_format: json_object` pede JSON
 * quando o provedor suporta; provedores que ignoram ainda devolvem o texto
 * e o chamador faz o parse tolerante.
 *
 * Lança em erro de rede/HTTP — o chamador decide o fallback.
 */
export async function chamarIA(
  cfg: ConfigIA,
  mensagens: MensagemIA[],
  opcoes: { json?: boolean; timeoutMs?: number } = {},
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opcoes.timeoutMs ?? 30_000);
  try {
    const resp = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.chave ? { Authorization: `Bearer ${cfg.chave}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.modelo,
        messages: mensagens,
        temperature: 0.3,
        ...(opcoes.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const corpo = await resp.text().catch(() => "");
      throw new Error(`IA ${resp.status}: ${corpo.slice(0, 200)}`);
    }
    const data = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const texto = data.choices?.[0]?.message?.content;
    if (!texto) throw new Error("IA respondeu sem conteúdo.");
    return texto;
  } finally {
    clearTimeout(timer);
  }
}
