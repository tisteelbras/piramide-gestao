// ————————————————————————————————————————————————
// Cria (ou atualiza) um usuário admin do SOS.
// Uso: npm run db:create-admin -- "Nome" email@empresa.com senha
// Sem argumentos, usa os valores padrão do primeiro admin.
// ————————————————————————————————————————————————
import { db } from "./index";
import { empresa, usuario } from "./schema";
import { hashSenha } from "../domain/senha";
import { eq } from "drizzle-orm";

async function main() {
  const [nome, email, senha] = [
    process.argv[2] ?? "Rodrigo Araujo",
    process.argv[3] ?? "marketing@steelbras.com.br",
    process.argv[4] ?? "Mudar123",
  ];

  const emp = await db.query.empresa.findFirst({
    where: eq(empresa.nome, "Steelbras"),
  });
  if (!emp) {
    console.error("Empresa Steelbras não encontrada. Rode 'npm run db:seed' antes.");
    process.exit(1);
  }

  const senhaHash = await hashSenha(senha);
  const existente = await db.query.usuario.findFirst({
    where: eq(usuario.email, email),
  });

  if (existente) {
    await db
      .update(usuario)
      .set({ senhaHash, papel: "admin", nome, ativo: true, atualizadoEm: new Date() })
      .where(eq(usuario.id, existente.id));
    console.log(`✓ Admin atualizado: ${email}`);
  } else {
    await db.insert(usuario).values({
      empresaId: emp.id,
      nome,
      email,
      senhaHash,
      papel: "admin",
    });
    console.log(`✓ Admin criado: ${email}`);
  }
  console.log("  Senha definida. Troque no primeiro acesso.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falha:", e);
    process.exit(1);
  });
