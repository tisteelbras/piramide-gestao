# Banco de dados do SOS

Postgres da empresa, banco **`sos_steelbras`**. ORM: **Drizzle** (SQL-first).

## Como conectar (uma vez)

1. Crie o banco `sos_steelbras` no pgAdmin (Servidor → Databases → botão direito → Create → Database).
2. Copie `.env.example` para `.env.local` e preencha `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/sos_steelbras
   ```
3. Aplique as migrations e o seed:
   ```bash
   npm run db:migrate     # cria as 16 tabelas
   npx tsx src/db/seed.ts  # empresa Steelbras + setores + critérios
   ```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run db:generate` | Gera nova migration SQL a partir de mudanças no schema |
| `npm run db:migrate`  | Aplica as migrations no banco |
| `npm run db:push`     | Empurra o schema direto (útil em dev, sem gerar arquivo) |
| `npm run db:studio`   | Abre a interface visual do Drizzle para ver os dados |

## Organização do schema (`src/db/schema/`)

| Arquivo | Domínio | Tabelas |
|---|---|---|
| `organizacao.ts` | Fundação | empresa, setor, usuario, colaborador |
| `avaliacao.ts` | Motor da pirâmide | criterio, avaliacao, resposta |
| `recursos.ts` | Nível 2 (Tático) | avaliacao_colaborador, sistema, ativo |
| `processos.ts` | Nível 3 | processo, avaliacao_processo |
| `resultado.ts` | Nível 4 + IA | indicador, diagnostico, recomendacao, acao_plano |

**Decisões de modelagem:**
- Toda tabela referencia `empresa` → single-tenant hoje, SaaS-ready amanhã.
- O motor de avaliação é genérico (`criterio` + `resposta`) e serve os 4 níveis,
  evitando tabelas rígidas por nível.
- `diagnostico`/`recomendacao` têm coluna `origem` (`regra` | `ia`): o MVP preenche
  por regras; a IA real preenche depois, sem mudar o schema.
- Cálculo de notas/maturidade fica em `src/domain/maturidade.ts` (funções puras,
  fora do banco e da UI).
