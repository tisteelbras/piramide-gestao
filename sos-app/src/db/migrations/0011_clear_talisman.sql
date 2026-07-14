CREATE TYPE "public"."direcao_indicador" AS ENUM('maior', 'menor');--> statement-breakpoint
ALTER TYPE "public"."tipo_processo" ADD VALUE 'gestao_objetivos' BEFORE 'outro';--> statement-breakpoint
ALTER TABLE "indicador" ADD COLUMN "direcao" "direcao_indicador" DEFAULT 'maior' NOT NULL;