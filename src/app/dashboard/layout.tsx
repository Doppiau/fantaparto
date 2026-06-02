import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [dbUser, eventi] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: user.id },
      select: { nome: true, avatarUrl: true },
    }),
    prisma.event.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: "desc" },
      select:  { id: true, nomeBimbo: true, stato: true, dataPresuntaParto: true },
    }),
  ]);

  return (
    <div style={{ background: "#fbf9f5", minHeight: "100vh" }}>
      <Sidebar
        eventi={eventi}
        user={{
          nome:      dbUser?.nome      ?? null,
          avatarUrl: dbUser?.avatarUrl ?? null,
          email:     user.email        ?? "",
        }}
      />
      {/* Su mobile: margine 0 + padding-top per hamburger. Su desktop md+: 256px sidebar */}
      <div className="md:ml-64 pt-16 md:pt-0">
        {children}
      </div>
    </div>
  );
}
