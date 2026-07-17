CREATE TYPE "public"."tipo_no_fluxo" AS ENUM('inicio', 'acao', 'decisao', 'fim');--> statement-breakpoint
ALTER TABLE "etapa_processo" ADD COLUMN "tipo_no" "tipo_no_fluxo" DEFAULT 'acao' NOT NULL;