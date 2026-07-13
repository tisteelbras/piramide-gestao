CREATE TABLE "ciclo_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"setor_id" uuid NOT NULL,
	"fechado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"fechado_por" text,
	"geral" numeric(5, 2) NOT NULL,
	"visao" numeric(5, 2) NOT NULL,
	"tatico" numeric(5, 2) NOT NULL,
	"processos" numeric(5, 2) NOT NULL,
	"resultados" numeric(5, 2) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_setor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setor_id" uuid NOT NULL,
	"meta" integer NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meta_setor_setor_id_unique" UNIQUE("setor_id")
);
--> statement-breakpoint
CREATE TABLE "politica_avaliacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"periodicidade_dias" integer DEFAULT 90 NOT NULL,
	"aviso_dias" integer DEFAULT 15 NOT NULL,
	"meta_padrao" integer DEFAULT 80 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "politica_avaliacao_empresa_id_unique" UNIQUE("empresa_id")
);
--> statement-breakpoint
ALTER TABLE "ciclo_snapshot" ADD CONSTRAINT "ciclo_snapshot_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ciclo_snapshot" ADD CONSTRAINT "ciclo_snapshot_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_setor" ADD CONSTRAINT "meta_setor_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "politica_avaliacao" ADD CONSTRAINT "politica_avaliacao_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;