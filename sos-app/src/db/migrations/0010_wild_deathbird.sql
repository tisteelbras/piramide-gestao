CREATE TABLE "etapa_processo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_id" uuid NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"responsavel_id" uuid,
	"entrega" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "etapa_processo" ADD CONSTRAINT "etapa_processo_processo_id_processo_id_fk" FOREIGN KEY ("processo_id") REFERENCES "public"."processo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etapa_processo" ADD CONSTRAINT "etapa_processo_responsavel_id_colaborador_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."colaborador"("id") ON DELETE set null ON UPDATE no action;