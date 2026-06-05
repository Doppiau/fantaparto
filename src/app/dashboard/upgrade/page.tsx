import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import UpgradeClient from "./UpgradeClient";

const QS = "var(--font-quicksand, sans-serif)";

export const metadata = { title: "Passa a Premium · FantaParto" };

export default async function UpgradePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { isPremium: true, couponRiscattato: true, pianoAttivatoAt: true },
  });

  return (
    <div className="px-4 md:px-8" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(44,44,46,0.40)", margin: 0, fontFamily: QS }}>
          Piano Premium
        </h1>
      </div>

      <UpgradeClient
        isPremium={dbUser?.isPremium ?? false}
        couponRiscattato={dbUser?.couponRiscattato ?? null}
        pianoAttivatoAt={dbUser?.pianoAttivatoAt ?? null}
      />
    </div>
  );
}
