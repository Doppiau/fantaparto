"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "Password troppo corta"),
});

const SignupSchema = z.object({
  nome: z.string().trim().min(2, "Il nome deve avere almeno 2 caratteri").max(80),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
});

export type AuthActionState = {
  error?: string;
};

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email o password non corretti" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = SignupSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { nome: parsed.data.nome },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Email già registrata. Prova ad accedere." };
    }
    return { error: "Errore durante la registrazione. Riprova." };
  }

  // Crea il record Prisma — la signup action bypassa la callback Google
  // quindi il trigger DB non scatta. L'upsert è idempotente.
  if (data.user) {
    await prisma.user.upsert({
      where:  { id: data.user.id },
      create: { id: data.user.id, email: parsed.data.email, nome: parsed.data.nome },
      update: {},
    }).catch(() => { /* ignora: utente già esistente */ });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
