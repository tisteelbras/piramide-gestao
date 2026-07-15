ALTER TABLE "acao_5w2h" ADD COLUMN "recomendacao_id" uuid;--> statement-breakpoint
ALTER TABLE "acao_5w2h" ADD COLUMN "prazo" date;--> statement-breakpoint
ALTER TABLE "acao_5w2h" ADD COLUMN "concluida_em" timestamp;--> statement-breakpoint
ALTER TABLE "acao_5w2h" ADD CONSTRAINT "acao_5w2h_recomendacao_id_recomendacao_id_fk" FOREIGN KEY ("recomendacao_id") REFERENCES "public"."recomendacao"("id") ON DELETE set null ON UPDATE no action;