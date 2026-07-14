import "server-only";
import PDFDocument from "pdfkit";
import { montarArvore, type NoOrganograma, type PessoaOrganograma } from "./tipos";

// Gera o PDF do organograma do setor: uma árvore indentada, com o nome
// em destaque e a função abaixo. Retorna o Buffer do arquivo.
//
// Escolha de desenho: árvore indentada (e não caixas conectadas), porque
// lida bem com qualquer profundidade e número de pessoas sem estourar a
// largura da página — que é o caso real de um setor.

const AZUL = "#0068a9";
const VERDE = "#47ad4b";
const TINTA = "#0e1a24";
const CINZA = "#5b6b78";

export async function gerarPdfOrganograma(opts: {
  setorNome: string;
  empresaNome: string;
  pessoas: PessoaOrganograma[];
}): Promise<Buffer> {
  const { setorNome, empresaNome, pessoas } = opts;
  const arvore = montarArvore(pessoas);

  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const pronto = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // ——— Cabeçalho ———
  doc.fillColor(AZUL).fontSize(20).font("Helvetica-Bold").text("Organograma", { continued: false });
  doc.fillColor(TINTA).fontSize(15).font("Helvetica-Bold").text(setorNome);
  doc.moveDown(0.2);
  doc.fillColor(CINZA).fontSize(9.5).font("Helvetica")
    .text(`${empresaNome} · NEXO — gerado em ${new Date().toLocaleDateString("pt-BR")}`);

  // Linha divisória
  doc.moveDown(0.6);
  const yLinha = doc.y;
  doc.strokeColor("#d9e2ea").lineWidth(1)
    .moveTo(doc.page.margins.left, yLinha)
    .lineTo(doc.page.width - doc.page.margins.right, yLinha)
    .stroke();
  doc.moveDown(0.8);

  if (arvore.length === 0) {
    doc.fillColor(CINZA).fontSize(11).font("Helvetica")
      .text("Nenhuma pessoa cadastrada neste setor.");
    doc.end();
    return pronto;
  }

  // ——— Árvore indentada ———
  const desenhaNo = (no: NoOrganograma, nivel: number) => {
    const x = doc.page.margins.left + nivel * 22;
    const larguraUtil = doc.page.width - doc.page.margins.right - x;

    // Quebra de página quando necessário.
    if (doc.y > doc.page.height - doc.page.margins.bottom - 46) doc.addPage();

    const y = doc.y;
    // Marcador: quadrado colorido (azul na raiz, verde nos demais).
    doc.rect(x, y + 3, 6, 6).fill(nivel === 0 ? AZUL : VERDE);

    doc.fillColor(TINTA).fontSize(11).font("Helvetica-Bold")
      .text(no.nome, x + 13, y, { width: larguraUtil - 13 });
    if (no.cargo) {
      doc.fillColor(CINZA).fontSize(9).font("Helvetica")
        .text(no.cargo, x + 13, doc.y, { width: larguraUtil - 13 });
    }
    doc.moveDown(0.55);

    for (const filho of no.subordinados) desenhaNo(filho, nivel + 1);
  };

  for (const raiz of arvore) desenhaNo(raiz, 0);

  // ——— Rodapé ———
  doc.moveDown(1);
  doc.fillColor(CINZA).fontSize(8.5).font("Helvetica")
    .text(
      `${pessoas.length} pessoa${pessoas.length === 1 ? "" : "s"} no organograma de ${setorNome}.`,
      doc.page.margins.left,
      doc.y,
    );

  doc.end();
  return pronto;
}
