import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import NuovoEventoWizard from "./NuovoEventoWizard";

export default async function NuovoEventoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { isPremium: true },
  });

  return <NuovoEventoWizard isPremium={dbUser?.isPremium ?? false} />;
}
