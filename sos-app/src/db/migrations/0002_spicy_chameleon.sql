CREATE TYPE "public"."tipo_processo" AS ENUM('desempenho', 'governanca', 'monitoramento', 'kpi', 'outro');--> statement-breakpoint
CREATE TABLE "anexo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"avaliacao_id" uuid NOT NULL,
	"criterio_id" uuid NOT NULL,
	"nome_original" text NOT NULL,
	"nome_arquivo" text NOT NULL,
	"mime_type" text,
	"tamanho_bytes" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ativo" ADD COLUMN "observacao" text;--> statement-breakpoint
ALTER TABLE "processo" ADD COLUMN "tipo" "tipo_processo" DEFAULT 'outro' NOT NULL;--> statement-breakpoint
ALTER TABLE "anexo" ADD CONSTRAINT "anexo_avaliacao_id_avaliacao_id_fk" FOREIGN KEY ("avaliacao_id") REFERENCES "public"."avaliacao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anexo" ADD CONSTRAINT "anexo_criterio_id_criterio_id_fk" FOREIGN KEY ("criterio_id") REFERENCES "public"."criterio"("id") ON DELETE cascade ON UPDATE no action;