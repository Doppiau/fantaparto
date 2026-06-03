import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import ProfiloClient from "./ProfiloClient";

const QS = "var(--font-quicksand, sans-serif)";

export default async function ProfiloPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [dbUser, eventi] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: user.id },
      select: { email: true, nome: true },
    }),
    prisma.event.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, nomeBimbo: true, stato: true,
        dataPresuntaParto: true, codiceCondivisione: true,
        classificaPrivata: true, hypeSpaceAnonimo: true, votiBloccati: true,
      },
    }),
  ]);

  return (
    <div className="px-4 md:px-6" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 680, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C2C2E", fontFamily: QS, margin: 0 }}>
          Gestione Profilo
        </h1>
        <p style={{ fontSize: 13, color: "rgba(44,44,46,0.50)", margin: "4px 0 0" }}>
          Parametri di gioco, privacy, account e GDPR
        </p>
      </div>

      <ProfiloClient
        eventi={eventi}
        emailUtente={dbUser?.email ?? user.email ?? ""}
        nomeGenitore={dbUser?.nome ?? null}
      />
    </div>
  );
}
