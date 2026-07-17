import "server-only";
import { cache } from "react";
import { eq, asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { setor, colaborador, processo, atribuicaoRaci, etapaProcesso } from "@/db/schema";
import { getEmpresa } from "@/features/assessments/queries";
import { validarRaci, type PapelRaci } from "@/features/raci/tipos";
import { grauPadronizacao, padronizacaoDoSetor } from "@/features/mapa-processos/tipos";

/** Status das ferramentas de diagnóstico (por setor) — para o hub. */
export type StatusFerramentasSetor = {
  setorId: string;
  setorNome: string;
  organograma: { pessoas: number };
  raci: { atividades: number; lacunas: number };
  mapa: { processos: number; documentados: number; padronizacao: number };
};

/**
 * Status das 3 ferramentas de diagnóstico em TODOS os setores.
 * Cinco queries no total (setores + colaboradores + processos +
 * atribuições + etapas), sem N+1.
 */
export const statusDiagnosticoPorSetor = cache(
  async (): Promise<StatusFerramentasSetor[]> => {
    const emp = await getEmpresa();

    const [setores, pessoas, processos] = await Promise.all([
      db.query.setor.findMany({
        where: eq(setor.empresaId, emp.id),
        orderBy: [asc(setor.nome)],
      }),
      db.query.colaborador.findMany({ where: eq(colaborador.empresaId, emp.id) }),
      db.query.processo.findMany({ where: eq(processo.empresaId, emp.id) }),
    ]);

    const idsProc = processos.map((p) => p.id);
    const [atribuicoes, etapas] = await Promise.all([
      idsProc.length
        ? db.query.atribuicaoRaci.findMany({
            where: inArray(atribuicaoRaci.processoId, idsProc),
          })
        : Promise.resolve([]),
      idsProc.length
        ? db.query.etapaProcesso.findMany({
            where: inArray(etapaProcesso.processoId, idsProc),
          })
        : Promise.resolve([]),
    ]);

    // Indexa por setor.
    const etapasPorProc = new Map<string, typeof etapas>();
    for (const e of etapas) {
      const l = etapasPorProc.get(e.processoId) ?? [];
      l.push(e);
      etapasPorProc.set(e.processoId, l);
    }

    return setores.map((s) => {
      const pessoasDoSetor = pessoas.filter((c) => c.setorId === s.id);
      const procsDoSetor = processos.filter((p) => p.setorId === s.id);
      const idsDoSetor = new Set(procsDoSetor.map((p) => p.id));

      // RACI: reusa a validação oficial para contar as lacunas.
      const lacunas = validarRaci({
        atividades: procsDoSetor.map((p) => ({ id: p.id, nome: p.nome, tipo: p.tipo })),
        pessoas: pessoasDoSetor.map((c) => ({ id: c.id, nome: c.nome, cargo: c.cargo })),
        atribuicoes: atribuicoes
          .filter((a) => idsDoSetor.has(a.processoId))
          .map((a) => ({
            processoId: a.processoId,
            colaboradorId: a.colaboradorId,
            papel: a.papel as PapelRaci,
          })),
      }).length;

      // Mapa: reusa a régua oficial de padronização.
      const mapeados = procsDoSetor.map((p) => ({
        id: p.id,
        nome: p.nome,
        tipo: p.tipo,
        etapas: (etapasPorProc.get(p.id) ?? []).map((e) => ({
          id: e.id,
          ordem: e.ordem,
          tipoNo: e.tipoNo,
          titulo: e.titulo,
          descricao: e.descricao,
          responsavelId: e.responsavelId,
          responsavelNome: null,
          entrega: e.entrega,
        })),
      }));

      return {
        setorId: s.id,
        setorNome: s.nome,
        organograma: { pessoas: pessoasDoSetor.length },
        raci: { atividades: procsDoSetor.length, lacunas },
        mapa: {
          processos: procsDoSetor.length,
          documentados: mapeados.filter((p) => grauPadronizacao(p) === "documentado").length,
          padronizacao: padronizacaoDoSetor(mapeados),
        },
      };
    });
  },
);
