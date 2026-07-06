# SOS — Sistema de Operação Steelbras

Plataforma web de gestão da Steelbras: uma **pirâmide organizacional** que conecta
o nível estratégico (Visão) ao operacional (Processos), passando por Recursos e
Resultado. Construída em Next.js + React, evoluindo por etapas até virar o centro
estratégico da empresa.

> Este projeto substitui o protótipo de página única (`../index.html`), que agora
> serve apenas como referência visual.

## Rodar em desenvolvimento

```bash
npm install      # só na primeira vez
npm run dev      # abre em http://localhost:3000
```

Outros comandos:

```bash
npm run build    # build de produção (roda TypeScript + gera páginas)
npm run start    # sobe o build de produção
npm run lint     # checagem de estilo
```

## Estrutura

```
src/
  app/
    layout.tsx      Layout raiz — carrega a fonte Montserrat e os metadados
    page.tsx        Página inicial — só renderiza <Sos/>
    globals.css     Tokens da marca (cores, tipografia) e animações
  components/
    Sos.tsx             Componente principal: header, pirâmide, painel, autosave
    Pyramid.tsx         A pirâmide de 4 níveis (SVG)
    SectorWheel.tsx     A roda de setores do nível Processos
    SectorChecklist.tsx O checklist de 6 etapas de cada setor
  lib/
    sos-data.ts     Dados e tipos (níveis, etapas, setores). Ponto único de verdade.
public/
    steelbras-logo.svg / steelbras-icon.svg   Identidade visual
```

## Etapa atual: 0 — Fundação

- [x] Projeto Next.js + TypeScript + Tailwind com a identidade Steelbras
- [x] Pirâmide, roda de setores e checklist migrados para componentes React
- [x] Persistência local (localStorage) do protótipo mantida
- [ ] **Próximo (Etapa 1):** login e banco de dados via Supabase; os dados de
      setores/checklists passam a vir do banco, e não mais do `localStorage`.

A camada de persistência está isolada no topo de `components/Sos.tsx`
(`loadState` / `saveState`), justamente para facilitar a troca por Supabase
na Etapa 1 sem mexer no resto da interface.
