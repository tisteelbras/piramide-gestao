import "server-only";
import PDFDocument from "pdfkit";
import { montarArvore, type PessoaOrganograma } from "./tipos";
import { calcularLayout, iniciais, CAIXA_L, CAIXA_A } from "./layout";

// Gera o PDF do organograma: caixas conectadas por linhas, no mesmo
// desenho da tela (reusa calcularLayout). Em paisagem, com escala
// automática para a estrutura caber na página.

const AZUL = "#0068a9";
const VERDE = "#47ad4b";
const AMBAR = "#d98a00";
const AZUL_ESC = "#004e80";
const TINTA = "#0e1a24";
const CINZA = "#5b6b78";
const LINHA = "#cfdae4";

const CORES_NIVEL = [AZUL, VERDE, AMBAR, AZUL_ESC];
const corDoNivel = (n: number) => CORES_NIVEL[n % CORES_NIVEL.length];

export async function gerarPdfOrganograma(opts: {
  setorNome: string;
  empresaNome: string;
  pessoas: PessoaOrganograma[];
}): Promise<Buffer> {
  const { setorNome, empresaNome, pessoas } = opts;

  // Paisagem: organogramas crescem para os lados.
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const pronto = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // ——— Cabeçalho ———
  doc.fillColor(AZUL).fontSize(18).font("Helvetica-Bold").text("Organograma");
  doc.fillColor(TINTA).fontSize(14).font("Helvetica-Bold").text(setorNome);
  doc.fillColor(CINZA).fontSize(9).font("Helvetica")
    .text(`${empresaNome} · NEXO — gerado em ${new Date().toLocaleDateString("pt-BR")}`);

  const topoDesenho = doc.y + 18;

  if (pessoas.length === 0) {
    doc.moveDown(1);
    doc.fillColor(CINZA).fontSize(11).text("Nenhuma pessoa cadastrada neste setor.");
    doc.end();
    return pronto;
  }

  // ——— Layout (o mesmo da tela) ———
  const { caixas, ligacoes, largura, altura } = calcularLayout(montarArvore(pessoas));

  // Escala para caber na área útil, sem ampliar além de 1×.
  const dispX = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const dispY = doc.page.height - topoDesenho - doc.page.margins.bottom - 16;
  const escala = Math.min(1, dispX / Math.max(1, largura), dispY / Math.max(1, altura));

  // Centraliza horizontalmente o desenho escalado.
  const offsetX = doc.page.margins.left + Math.max(0, (dispX - largura * escala) / 2);

  doc.save();
  doc.translate(offsetX, topoDesenho).scale(escala);

  // ——— Linhas de conexão (cotovelo) ———
  doc.strokeColor(LINHA).lineWidth(1.6 / escala);
  for (const l of ligacoes) {
    const meioY = (l.de.y + l.para.y) / 2;
    doc.moveTo(l.de.x, l.de.y)
      .lineTo(l.de.x, meioY)
      .lineTo(l.para.x, meioY)
      .lineTo(l.para.x, l.para.y)
      .stroke();
  }

  // ——— Caixas ———
  for (const c of caixas) {
    const cn = corDoNivel(c.nivel);

    // Corpo da caixa.
    doc.roundedRect(c.x, c.y, CAIXA_L, CAIXA_A, 8).fillAndStroke("#ffffff", "#e3ebf1");
    // Faixa superior colorida (marca o nível).
    doc.save();
    doc.roundedRect(c.x, c.y, CAIXA_L, CAIXA_A, 8).clip();
    doc.rect(c.x, c.y, CAIXA_L, 3.5).fill(cn);
    doc.restore();

    // Avatar circular com as iniciais (o sistema não guarda foto).
    const raio = 15;
    const acx = c.x + 12 + raio;
    const acy = c.y + CAIXA_A / 2 + 1;
    doc.circle(acx, acy, raio).fill(cn);
    doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold")
      .text(iniciais(c.nome), c.x + 12, acy - 5, { width: raio * 2, align: "center" });

    // Nome e função.
    const tx = c.x + 12 + raio * 2 + 8;
    const tw = CAIXA_L - (tx - c.x) - 10;
    doc.fillColor(TINTA).fontSize(9).font("Helvetica-Bold")
      .text(c.nome, tx, c.y + 24, { width: tw, ellipsis: true, lineBreak: false });
    doc.fillColor(CINZA).fontSize(7.5).font("Helvetica")
      .text(c.cargo || "sem função", tx, c.y + 37, { width: tw, ellipsis: true, lineBreak: false });
  }

  doc.restore();

  // ——— Rodapé ———
  doc.fillColor(CINZA).fontSize(8).font("Helvetica").text(
    `${pessoas.length} pessoa${pessoas.length === 1 ? "" : "s"} no organograma de ${setorNome}.`,
    doc.page.margins.left,
    doc.page.height - doc.page.margins.bottom - 10,
    { lineBreak: false },
  );

  doc.end();
  return pronto;
}
