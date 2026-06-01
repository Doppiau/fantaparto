import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AdminUser {
  id:    string;
  email: string;
}

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Per Server Components — usa notFound() se non autorizzato.
 * Garantisce che la pagina sia visivamente identica a qualsiasi altra 404.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Non loggato → redirect a /login senza passare l'URL corrente come parametro
  // (evita di rivelare il percorso segreto nella query string)
  if (!user?.email) redirect("/login");

  if (!getAdminEmails().includes(user.email.toLowerCase())) {
    notFound(); // 404 finto — nessun indizio sull'esistenza della rotta (§4.1)
  }

  return { id: user.id, email: user.email };
}

/**
 * Per Server Actions — lancia un Error invece di chiamare notFound().
 * Il caller gestisce l'errore e ritorna { success: false, error }.
 */
export async function assertAdmin(): Promise<AdminUser> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) throw new Error("Non autenticato.");

  if (!getAdminEmails().includes(user.email.toLowerCase())) {
    throw new Error("Non autorizzato.");
  }

  return { id: user.id, email: user.email };
}
