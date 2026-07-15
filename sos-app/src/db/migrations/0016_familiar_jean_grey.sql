CREATE TABLE "documento_gerado" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"codigo" text NOT NULL,
	"tipo" text NOT NULL,
	"titulo" text NOT NULL,
	"nome_arquivo" text NOT NULL,
	"setor_id" uuid,
	"autor_id" uuid,
	"autor_nome" text NOT NULL,
	"gerado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documento_gerado_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
ALTER TABLE "documento_gerado" ADD CONSTRAINT "documento_gerado_empresa_id_empresa_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documento_gerado" ADD CONSTRAINT "documento_gerado_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documento_gerado" ADD CONSTRAINT "documento_gerado_autor_id_usuario_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;