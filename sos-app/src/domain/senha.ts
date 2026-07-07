// Hash e verificação de senha (bcrypt). Nunca guardamos senha em texto puro.
import bcrypt from "bcryptjs";

const ROUNDS = 10;

export async function hashSenha(senhaPura: string): Promise<string> {
  return bcrypt.hash(senhaPura, ROUNDS);
}

export async function verificaSenha(
  senhaPura: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(senhaPura, hash);
}
