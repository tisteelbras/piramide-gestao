CREATE TYPE "public"."papel_raci" AS ENUM('responsavel', 'aprovador', 'consultado', 'informado');--> statement-breakpoint
CREATE TABLE "atribuicao_raci" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_id" uuid NOT NULL,
	"colaborador_id" uuid NOT NULL,
	"papel" "papel_raci" NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "atribuicao_raci_processo_colaborador" UNIQUE("processo_id","colaborador_id")
);
--> statement-breakpoint
ALTER TABLE "atribuicao_raci" ADD CONSTRAINT "atribuicao_raci_processo_id_processo_id_fk" FOREIGN KEY ("processo_id") REFERENCES "public"."processo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atribuicao_raci" ADD CONSTRAINT "atribuicao_raci_colaborador_id_colaborador_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaborador"("id") ON DELETE cascade ON UPDATE no action;