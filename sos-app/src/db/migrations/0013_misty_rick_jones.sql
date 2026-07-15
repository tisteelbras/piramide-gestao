CREATE TYPE "public"."risco_sucessao" AS ENUM('sem_dominio', 'critico', 'ok');--> statement-breakpoint
CREATE TYPE "public"."situacao_controle" AS ENUM('nao_existe', 'parcial', 'existe');--> statement-breakpoint
CREATE TYPE "public"."status_objetivo" AS ENUM('a_definir', 'em_andamento', 'atingido');--> statement-breakpoint
CREATE TABLE "controle_governanca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"situacao" "situacao_controle" DEFAULT 'nao_existe' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "objetivo_estrategico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"meta" text,
	"prazo" date,
	"status" "status_objetivo" DEFAULT 'a_definir' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sucessao_governanca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"atividade" text NOT NULL,
	"quem_domina" text,
	"risco" "risco_sucessao" DEFAULT 'sem_dominio' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "controle_governanca" ADD CONSTRAINT "controle_governanca_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controle_governanca" ADD CONSTRAINT "controle_governanca_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objetivo_estrategico" ADD CONSTRAINT "objetivo_estrategico_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objetivo_estrategico" ADD CONSTRAINT "objetivo_estrategico_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sucessao_governanca" ADD CONSTRAINT "sucessao_governanca_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sucessao_governanca" ADD CONSTRAINT "sucessao_governanca_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;