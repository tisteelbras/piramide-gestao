CREATE TYPE "public"."papel_usuario" AS ENUM('admin', 'direcao', 'lider');--> statement-breakpoint
CREATE TYPE "public"."grupo_criterio" AS ENUM('geral', 'rh', 'sistemico', 'estrutural', 'indicadores', 'governanca', 'monitoramento', 'desempenho');--> statement-breakpoint
CREATE TYPE "public"."nivel_piramide" AS ENUM('visao', 'tatico', 'processos', 'resultados');--> statement-breakpoint
CREATE TYPE "public"."status_resposta" AS ENUM('nao_iniciada', 'em_andamento', 'revisada');--> statement-breakpoint
CREATE TYPE "public"."categoria_ativo" AS ENUM('estrutura_fisica', 'logistica', 'maquina', 'hardware', 'celular', 'equipamento', 'infraestrutura', 'outro');--> statement-breakpoint
CREATE TYPE "public"."categoria_sistema" AS ENUM('erp', 'crm', 'planner', 'mrp', 'interno', 'outro');--> statement-breakpoint
CREATE TYPE "public"."eixo_rh" AS ENUM('cultura', 'fit_cultural', 'treinamento', 'desempenho');--> statement-breakpoint
CREATE TYPE "public"."eixo_processo" AS ENUM('rotinas', 'padronizacao', 'planejamento', 'prazo', 'cronograma', 'reunioes', 'documentacao', 'automacao');--> statement-breakpoint
CREATE TYPE "public"."origem_analise" AS ENUM('regra', 'ia');--> statement-breakpoint
CREATE TYPE "public"."severidade" AS ENUM('baixa', 'media', 'alta');--> statement-breakpoint
CREATE TYPE "public"."status_acao" AS ENUM('pendente', 'em_andamento', 'concluida');--> statement-breakpoint
CREATE TABLE "colaborador" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"cargo" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "empresa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"cnpj" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"papel" "papel_usuario" DEFAULT 'lider' NOT NULL,
	"setor_id" uuid,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuario_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "avaliacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"autor_id" uuid,
	"titulo" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "criterio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nivel" "nivel_piramide" NOT NULL,
	"grupo" "grupo_criterio" DEFAULT 'geral' NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"peso" numeric(5, 2) DEFAULT '1' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resposta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"avaliacao_id" uuid NOT NULL,
	"criterio_id" uuid NOT NULL,
	"nota" numeric(5, 2),
	"status" "status_resposta" DEFAULT 'nao_iniciada' NOT NULL,
	"observacao" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ativo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid,
	"nome" text NOT NULL,
	"categoria" "categoria_ativo" DEFAULT 'outro' NOT NULL,
	"nota" numeric(5, 2),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avaliacao_colaborador" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"avaliacao_id" uuid NOT NULL,
	"colaborador_id" uuid NOT NULL,
	"eixo" "eixo_rh" NOT NULL,
	"nota" numeric(5, 2),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sistema" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid,
	"nome" text NOT NULL,
	"categoria" "categoria_sistema" DEFAULT 'outro' NOT NULL,
	"nota" numeric(5, 2),
	"eh_necessidade" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avaliacao_processo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_id" uuid NOT NULL,
	"eixo" "eixo_processo" NOT NULL,
	"nota" numeric(5, 2),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acao_plano" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"recomendacao_id" uuid,
	"titulo" text NOT NULL,
	"responsavel" text,
	"status" "status_acao" DEFAULT 'pendente' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnostico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"nivel" "nivel_piramide",
	"titulo" text NOT NULL,
	"detalhe" text,
	"severidade" "severidade" DEFAULT 'media' NOT NULL,
	"origem" "origem_analise" DEFAULT 'regra' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indicador" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"unidade" text,
	"meta" numeric(12, 2),
	"valor_atual" numeric(12, 2),
	"eh_ausencia" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recomendacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"diagnostico_id" uuid,
	"titulo" text NOT NULL,
	"detalhe" text,
	"prioridade" numeric(4, 0) DEFAULT '3' NOT NULL,
	"impacto_esperado" text,
	"origem" "origem_analise" DEFAULT 'regra' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "colaborador" ADD CONSTRAINT "colaborador_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colaborador" ADD CONSTRAINT "colaborador_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setor" ADD CONSTRAINT "setor_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_autor_id_usuario_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "criterio" ADD CONSTRAINT "criterio_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resposta" ADD CONSTRAINT "resposta_avaliacao_id_avaliacao_id_fk" FOREIGN KEY ("avaliacao_id") REFERENCES "public"."avaliacao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resposta" ADD CONSTRAINT "resposta_criterio_id_criterio_id_fk" FOREIGN KEY ("criterio_id") REFERENCES "public"."criterio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativo" ADD CONSTRAINT "ativo_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativo" ADD CONSTRAINT "ativo_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao_colaborador" ADD CONSTRAINT "avaliacao_colaborador_avaliacao_id_avaliacao_id_fk" FOREIGN KEY ("avaliacao_id") REFERENCES "public"."avaliacao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao_colaborador" ADD CONSTRAINT "avaliacao_colaborador_colaborador_id_colaborador_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaborador"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sistema" ADD CONSTRAINT "sistema_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sistema" ADD CONSTRAINT "sistema_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacao_processo" ADD CONSTRAINT "avaliacao_processo_processo_id_processo_id_fk" FOREIGN KEY ("processo_id") REFERENCES "public"."processo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo" ADD CONSTRAINT "processo_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo" ADD CONSTRAINT "processo_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acao_plano" ADD CONSTRAINT "acao_plano_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acao_plano" ADD CONSTRAINT "acao_plano_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acao_plano" ADD CONSTRAINT "acao_plano_recomendacao_id_recomendacao_id_fk" FOREIGN KEY ("recomendacao_id") REFERENCES "public"."recomendacao"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostico" ADD CONSTRAINT "diagnostico_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostico" ADD CONSTRAINT "diagnostico_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendacao" ADD CONSTRAINT "recomendacao_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendacao" ADD CONSTRAINT "recomendacao_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendacao" ADD CONSTRAINT "recomendacao_diagnostico_id_diagnostico_id_fk" FOREIGN KEY ("diagnostico_id") REFERENCES "public"."diagnostico"("id") ON DELETE set null ON UPDATE no action;