// Relatório operacional das entregas — página interna para apresentar à
// direção o que foi construído no NEXO. Autenticada (o proxy protege toda
// rota que não seja login/estático), imprimível em PDF. Conteúdo estático:
// é o registro das grandes atualizações, não dados ao vivo.
import Link from "next/link";
import BotaoImprimir from "@/features/pdf-export/BotaoImprimir";

const BLUE = "#0068a9", GREEN = "#47ad4b", INK = "#0e1a24", CINZA = "#5b6b78";

type Entrega = {
  n: number;
  titulo: string;
  problema: string;
  solucao: string;
  valor: string;
  itens?: string[];
};

const ENTREGAS: Entrega[] = [
  {
    n: 1,
    titulo: "Estabilidade — dois sistemas convivendo sem se derrubar",
    problema:
      "O NEXO aparecia fora do ar: outro projeto interno ocupava a mesma porta e o time via a tela errada.",
    solucao:
      "Cada sistema passou a ter uma porta fixa própria. O NEXO responde sempre em um endereço só, sem disputa.",
    valor:
      "O time deixou de perder tempo com “o sistema caiu” quando na verdade era só um endereço trocado.",
  },
  {
    n: 2,
    titulo: "Gestão por Objetivos no lugar certo + KPIs que medem de verdade",
    problema:
      "A Gestão por Objetivos estava na etapa de Visão (planejamento), quando na prática ela só acontece depois dos processos. E não estava claro o que o NEXO mede sobre um KPI: o valor do indicador em si é apurado em outra plataforma.",
    solucao:
      "A Gestão por Objetivos virou um resultado da execução, no nível certo. E o KPI passou a funcionar como deve: a área declara quais indicadores tem, e cada um vira um processo em Processos — o processo que se executa para atingir aquele KPI. É a maturidade dessa execução que vira nota na pirâmide.",
    valor:
      "O diagnóstico deixou de confundir “ter o número” com “fazer o que leva ao número”. O que conta como resultado é a execução que persegue a meta.",
    itens: [
      "Visão ficou mais enxuta e fiel ao que é planejamento",
      "Cada KPI declarado gera o processo de execução que o persegue",
      "O Resultado de KPI passou a medir a execução, não o valor apurado fora",
    ],
  },
  {
    n: 3,
    titulo: "Plano de ação vivo — o diagnóstico vira execução acompanhada",
    problema:
      "O sistema apontava o problema e sugeria a ação, mas ninguém acompanhava se a ação era feita. A linha se perdia ali.",
    solucao:
      "Cada recomendação vira uma ação com responsável, prazo e status. Uma tela de plano de ação por setor mostra o que está a fazer, em andamento, concluído e — em vermelho — o que está atrasado.",
    valor:
      "Fecha o ciclo de gestão: medir → recomendar → AGIR → acompanhar. O dashboard da direção mostra, de um olhar, quantas ações estão abertas e atrasadas em toda a empresa.",
  },
  {
    n: 4,
    titulo: "Visão com ferramentas concretas, não só texto",
    problema:
      "Algumas etapas da Visão eram campos de texto livre; a Governança tinha ferramenta em apenas 2 dos seus 4 pilares.",
    solucao:
      "O Direcionamento Estratégico ganhou uma lista de objetivos com meta, prazo e status. A Governança fechou os 4 pilares: somaram-se um Checklist de Controles e uma Matriz de Sucessão (que aponta sozinha o risco de “só uma pessoa sabe fazer”).",
    valor:
      "A Visão deixou de ser declaração e virou algo mensurável e gerenciável, pilar a pilar.",
  },
  {
    n: 5,
    titulo: "Diagnóstico com memória — senso de jornada",
    problema:
      "Cada diagnóstico era uma fotografia isolada; o sistema esquecia o ciclo anterior.",
    solucao:
      "O diagnóstico passou a comparar com o último fechamento: mostra o que melhorou, o que piorou e quantos pontos, nível a nível. Recomendações que se arrastam ganham o aviso “apontado há N ciclos, ainda sem resolução”.",
    valor:
      "A direção enxerga a evolução (“Recursos subiu, Processos caiu”), não só o estado atual — e vê o que está sendo ignorado ciclo após ciclo.",
  },
  {
    n: 6,
    titulo: "Inteligência artificial no diagnóstico",
    problema:
      "As recomendações vinham de regras fixas, que olham um sinal de cada vez e não enxergam a conexão entre eles.",
    solucao:
      "Uma camada de IA analisa os quatro níveis juntos e aponta a causa raiz provável (ex.: “indicador ruim + sistema faltante + processo fraco apontam para o mesmo gargalo”). Ela soma às regras — se a IA sair do ar, o diagnóstico por regra continua de pé.",
    valor:
      "Recomendações que uma regra não produziria, com o raciocínio explicado. A tecnologia é trocável: hoje uma opção gratuita, amanhã outra, sem reescrever o sistema.",
  },
];

export default function RelatorioOperacionalPage() {
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div style={{ background: "#fff", color: INK, minHeight: "100vh" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 14mm; }
          .bloco { break-inside: avoid; }
        }
        .wrap { max-width: 880px; margin: 0 auto; padding: 40px 32px 80px; font-family: 'Montserrat', system-ui, sans-serif; }
      `}</style>

      <div className="wrap">
        <div className="no-print" style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <Link href="/" style={{ textDecoration: "none", color: CINZA, fontWeight: 700, fontSize: 13, border: "1px solid #d9e2ea", padding: "10px 14px", borderRadius: 10 }}>‹ Dashboard</Link>
          <BotaoImprimir />
          <span style={{ alignSelf: "center", fontSize: 12.5, color: "#8493a0" }}>Use “Salvar em PDF” na janela de impressão.</span>
        </div>

        {/* Cabeçalho */}
        <header style={{ borderBottom: `3px solid ${BLUE}`, paddingBottom: 18, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: BLUE, letterSpacing: "-.01em" }}>NEXO</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#8493a0" }}>Conectar. Executar. Evoluir.</span>
            <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 800, color: BLUE }}>Steel<span style={{ color: GREEN }}>bras</span></span>
          </div>
          <h1 style={{ margin: "14px 0 4px", fontSize: 24, fontWeight: 800, color: INK }}>Relatório de evolução do sistema</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: CINZA }}>O que foi construído no NEXO — resumo para a direção · {hoje}</p>
        </header>

        {/* Abertura */}
        <p style={{ fontSize: 14, color: "#3a4a56", lineHeight: 1.6, margin: "22px 0 8px" }}>
          O NEXO evoluiu de uma ferramenta que <b>avalia</b> para uma plataforma que <b>acompanha a gestão de ponta a ponta</b>. As seis entregas abaixo, em ordem, mostram essa transformação: do sistema estável ao diagnóstico que agora usa inteligência artificial e tem memória de ciclos.
        </p>

        {/* Régua de cadeia do método */}
        <div className="bloco" style={{ background: "#f4f8fb", borderRadius: 12, padding: "14px 16px", margin: "16px 0 26px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          {["Visão", "Recursos", "Processos", "Resultados"].map((n, i) => (
            <span key={n} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: BLUE }}>{n}</span>
              {i < 3 && <span style={{ color: "#c0ccd6", fontWeight: 800 }}>→</span>}
            </span>
          ))}
          <span style={{ width: "100%", textAlign: "center", fontSize: 11.5, color: "#8493a0", marginTop: 4 }}>
            A cadeia que o NEXO mede: cada nível sustenta o seguinte.
          </span>
        </div>

        {/* Entregas */}
        <div style={{ display: "grid", gap: 18 }}>
          {ENTREGAS.map((e) => (
            <section key={e.n} className="bloco" style={{ border: "1px solid #e3ebf1", borderRadius: 14, padding: "18px 20px", borderLeft: `5px solid ${BLUE}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 999, background: BLUE, color: "#fff", fontWeight: 800, fontSize: 15, display: "grid", placeItems: "center" }}>{e.n}</span>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: INK, lineHeight: 1.25 }}>{e.titulo}</h2>
              </div>

              <Campo rotulo="O problema" cor="#c0392b" texto={e.problema} />
              <Campo rotulo="O que fizemos" cor={BLUE} texto={e.solucao} />
              <Campo rotulo="O ganho" cor={GREEN} texto={e.valor} />

              {e.itens && (
                <ul style={{ margin: "10px 0 0", paddingLeft: 20, color: CINZA, fontSize: 13, lineHeight: 1.6 }}>
                  {e.itens.map((it) => <li key={it}>{it}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Fecho */}
        <section className="bloco" style={{ marginTop: 26, background: "#eef7ef", border: "1px solid #cfe0d0", borderRadius: 14, padding: "18px 20px" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#256a2b" }}>Onde o NEXO está agora</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "#33613a", lineHeight: 1.6 }}>
            O sistema mede os quatro níveis, transforma o diagnóstico em plano de ação acompanhado com prazos, compara cada ciclo com o anterior e conta com uma camada de inteligência artificial que cruza os níveis para achar causas raiz. Tudo em uso real, sobre o banco de dados da empresa.
          </p>
        </section>

        <p style={{ marginTop: 22, fontSize: 11, color: "#a2afba", textAlign: "center" }}>
          NEXO · Steelbras — documento interno de acompanhamento das entregas.
        </p>
      </div>
    </div>
  );
}

function Campo({ rotulo, cor, texto }: { rotulo: string; cor: string; texto: string }) {
  return (
    <p style={{ margin: "0 0 7px", fontSize: 13.5, color: "#3a4a56", lineHeight: 1.55 }}>
      <span style={{ fontWeight: 800, color: cor }}>{rotulo}: </span>
      {texto}
    </p>
  );
}
