"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { erro?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      senha: formData.get("senha"),
      redirectTo: "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { erro: "Email ou senha incorretos." };
    }
    // signIn lança um redirect em caso de sucesso — repassar.
    throw error;
  }
}
