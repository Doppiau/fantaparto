import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/auth/actions";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { nome: true },
  });

  const eventi = await prisma.event.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nomeBimbo: true,
      codiceCondivisione: true,
      stato: true,
      dataPresuntaParto: true,
      _count: { select: { predictions: true } },
    },
  });

  type EventoItem = (typeof eventi)[number];

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-pink-600">FantaParto</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Ciao, {dbUser?.nome ?? "Mamma"} 👋
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">I tuoi eventi</h2>
          <span className="text-xs text-gray-400">
            La creazione eventi avviene dall&apos;app mobile
          </span>
        </div>

        {eventi.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <p className="text-gray-500 text-sm">
              Non hai ancora nessun evento. Crea il primo dall&apos;app FantaParto!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventi.map((ev: EventoItem) => (
              <Link
                key={ev.id}
                href={`/dashboard/${ev.id}`}
                className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer block"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {ev.nomeBimbo ? `Baby ${ev.nomeBimbo}` : "Bimbo/a in arrivo"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Codice:{" "}
                    <span className="font-mono text-gray-600">
                      {ev.codiceCondivisione}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Data prevista:{" "}
                    {new Date(ev.dataPresuntaParto).toLocaleDateString("it-IT")}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                      ev.stato === "ATTIVO"
                        ? "bg-green-100 text-green-700"
                        : ev.stato === "CONCLUSO"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {ev.stato}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {ev._count.predictions} vot
                    {ev._count.predictions === 1 ? "o" : "i"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
