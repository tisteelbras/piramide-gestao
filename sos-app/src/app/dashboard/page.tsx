// O dashboard executivo passou a ser a tela inicial ("/").
// Esta rota fica como redirecionamento para links antigos/favoritos.
import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/");
}
