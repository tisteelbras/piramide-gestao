CREATE TYPE "public"."tipo_no_fluxograma" AS ENUM('inicio', 'processo', 'decisao', 'fim');--> statement-breakpoint
CREATE TABLE "fluxograma" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "no_fluxograma" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fluxograma_id" uuid NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"tipo" "tipo_no_fluxograma" DEFAULT 'processo' NOT NULL,
	"processo_id" uuid,
	"rotulo" text,
	"pergunta" text,
	"destino_nao_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fluxograma" ADD CONSTRAINT "fluxograma_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fluxograma" ADD CONSTRAINT "fluxograma_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "no_fluxograma" ADD CONSTRAINT "no_fluxograma_fluxograma_id_fluxograma_id_fk" FOREIGN KEY ("fluxograma_id") REFERENCES "public"."fluxograma"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "no_fluxograma" ADD CONSTRAINT "no_fluxograma_processo_id_processo_id_fk" FOREIGN KEY ("processo_id") REFERENCES "public"."processo"("id") ON DELETE set null ON UPDATE no action;