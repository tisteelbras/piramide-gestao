CREATE TYPE "public"."categoria_causa_ishikawa" AS ENUM('metodo', 'maquina', 'material', 'mao_de_obra', 'medicao', 'meio_ambiente');--> statement-breakpoint
CREATE TABLE "acao_5w2h" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plano_id" uuid NOT NULL,
	"o_que" text NOT NULL,
	"por_que" text,
	"onde" text,
	"quando" text,
	"quem" text,
	"como" text,
	"quanto_custa" text,
	"status" "status_acao" DEFAULT 'pendente' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "causa_ishikawa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ishikawa_id" uuid NOT NULL,
	"categoria" "categoria_causa_ishikawa" NOT NULL,
	"descricao" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ishikawa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid,
	"problema" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_bcg" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"participacao" numeric(5, 2),
	"crescimento" numeric(5, 2),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plano_5w2h" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid,
	"titulo" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acao_5w2h" ADD CONSTRAINT "acao_5w2h_plano_id_plano_5w2h_id_fk" FOREIGN KEY ("plano_id") REFERENCES "public"."plano_5w2h"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "causa_ishikawa" ADD CONSTRAINT "causa_ishikawa_ishikawa_id_ishikawa_id_fk" FOREIGN KEY ("ishikawa_id") REFERENCES "public"."ishikawa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ishikawa" ADD CONSTRAINT "ishikawa_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ishikawa" ADD CONSTRAINT "ishikawa_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_bcg" ADD CONSTRAINT "item_bcg_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plano_5w2h" ADD CONSTRAINT "plano_5w2h_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plano_5w2h" ADD CONSTRAINT "plano_5w2h_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE set null ON UPDATE no action;