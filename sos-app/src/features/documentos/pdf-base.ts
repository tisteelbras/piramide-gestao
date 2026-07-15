import "server-only";
import PDFDocument from "pdfkit";

// ————————————————————————————————————————————————
// Gerador de PDF rastreável (ISO 9001) — base para todos os documentos do
// NEXO. Carimba, em TODA página, um rodapé com: código do documento, autor,
// data/hora e a marca. O conteúdo vem em "seções" simples (título + linhas
// ou pares campo/valor), então cada ferramenta só descreve o que quer,
// sem repetir a diagramação.
// ————————————————————————————————————————————————

const AZUL = "#0068a9", VERDE = "#47ad4b", TINTA = "#0e1a24", CINZA = "#5b6b78", LINHA = "#d9e2ea";

export type SecaoPdf =
  | { tipo: "paragrafo"; titulo?: string; texto: string }
  | { tipo: "lista"; titulo?: string; itens: string[] }
  | { tipo: "campos"; titulo?: string; campos: { rotulo: string; valor: string }[] }
  | { tipo: "tabela"; titulo?: string; colunas: string[]; linhas: string[][] };

export type DadosPdf = {
  tipo: string; // "Plano de ação", "Análise Ishikawa"…
  titulo: string;
  codigo: string; // NEXO-XXXXXX
  autorNome: string;
  empresaNome: string;
  setorNome?: string | null;
  geradoEm: Date;
  secoes: SecaoPdf[];
};

/** Gera o Buffer do PDF. O rodapé rastreável é desenhado em toda página. */
export function gerarPdfRastreavel(d: DadosPdf): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const pronto = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const larguraUtil = doc.page.width - 96;

  // ——— Cabeçalho ———
  doc.fillColor(AZUL).fontSize(20).font("Helvetica-Bold").text("NEXO", { continued: true });
  doc.fillColor(CINZA).fontSize(9).font("Helvetica").text("  ·  Conectar. Executar. Evoluir.");
  doc.moveDown(0.2);
  doc.fillColor(CINZA).fontSize(10).font("Helvetica").text(d.tipo.toUpperCase(), { characterSpacing: 1 });
  doc.fillColor(TINTA).fontSize(17).font("Helvetica-Bold").text(d.titulo, { width: larguraUtil });
  if (d.setorNome) doc.fillColor(CINZA).fontSize(11).font("Helvetica").text(`Setor: ${d.setorNome}`);
  doc.moveDown(0.4);
  doc.moveTo(48, doc.y).lineTo(doc.page.width - 48, doc.y).strokeColor(AZUL).lineWidth(2).stroke();
  doc.moveDown(0.8);

  // ——— Seções ———
  for (const s of d.secoes) {
    if (s.titulo) {
      doc.fillColor(AZUL).fontSize(12.5).font("Helvetica-Bold").text(s.titulo);
      doc.moveDown(0.2);
    }
    if (s.tipo === "paragrafo") {
      doc.fillColor(TINTA).fontSize(11).font("Helvetica").text(s.texto, { width: larguraUtil, align: "left" });
    } else if (s.tipo === "lista") {
      for (const it of s.itens) {
        doc.fillColor(TINTA).fontSize(11).font("Helvetica").text(`•  ${it}`, { width: larguraUtil, indent: 4 });
      }
    } else if (s.tipo === "campos") {
      for (const c of s.campos) {
        doc.fillColor(CINZA).fontSize(10.5).font("Helvetica-Bold").text(`${c.rotulo}: `, { continued: true });
        doc.fillColor(TINTA).font("Helvetica").text(c.valor || "—", { width: larguraUtil });
      }
    } else if (s.tipo === "tabela") {
      desenhaTabela(doc, s.colunas, s.linhas, larguraUtil);
    }
    doc.moveDown(0.9);
  }

  // ——— Rodapé rastreável em TODAS as páginas ———
  const total = doc.bufferedPageRange().count;
  const dataFmt = d.geradoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  for (let i = 0; i < total; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 42;
    doc.moveTo(48, y).lineTo(doc.page.width - 48, y).strokeColor(LINHA).lineWidth(0.8).stroke();
    doc.fillColor(CINZA).fontSize(8).font("Helvetica");
    // Esquerda: código + autor + data (a trilha ISO).
    doc.text(
      `Documento ${d.codigo}  ·  Gerado por ${d.autorNome}  ·  ${dataFmt}  ·  ${d.empresaNome}`,
      48, y + 6, { width: larguraUtil - 60, lineBreak: false },
    );
    // Direita: paginação.
    doc.text(`Pág. ${i + 1}/${total}`, doc.page.width - 108, y + 6, { width: 60, align: "right" });
  }

  doc.end();
  return pronto;
}

function desenhaTabela(doc: PDFKit.PDFDocument, colunas: string[], linhas: string[][], larguraUtil: number) {
  const n = colunas.length;
  const larguraCol = larguraUtil / n;
  const x0 = 48;
  let y = doc.y;

  // Cabeçalho da tabela.
  doc.fillColor(VERDE).fontSize(10).font("Helvetica-Bold");
  colunas.forEach((c, i) => doc.text(c, x0 + i * larguraCol, y, { width: larguraCol - 6 }));
  y = doc.y + 3;
  doc.moveTo(x0, y).lineTo(x0 + larguraUtil, y).strokeColor(LINHA).lineWidth(0.6).stroke();
  y += 4;

  // Linhas.
  doc.fillColor(TINTA).fontSize(10).font("Helvetica");
  for (const linha of linhas) {
    const alturas = linha.map((cel, i) => doc.heightOfString(cel || "—", { width: larguraCol - 6 }));
    const alturaLinha = Math.max(...alturas, 12);
    // Quebra de página se não couber.
    if (y + alturaLinha > doc.page.height - 60) { doc.addPage(); y = doc.y; }
    linha.forEach((cel, i) => doc.text(cel || "—", x0 + i * larguraCol, y, { width: larguraCol - 6 }));
    y += alturaLinha + 4;
    doc.y = y;
  }
}
