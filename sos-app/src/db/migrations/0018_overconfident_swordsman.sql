CREATE TYPE "public"."perspectiva_bsc" AS ENUM('financeira', 'clientes', 'processos_internos', 'aprendizado');--> statement-breakpoint
CREATE TYPE "public"."quadrante_swot" AS ENUM('forca', 'fraqueza', 'oportunidade', 'ameaca');--> statement-breakpoint
CREATE TABLE "item_swot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"quadrante" "quadrante_swot" NOT NULL,
	"descricao" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "objetivo_estrategico" ADD COLUMN "perspectiva" "perspectiva_bsc";--> statement-breakpoint
ALTER TABLE "item_swot" ADD CONSTRAINT "item_swot_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_swot" ADD CONSTRAINT "item_swot_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;