import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED  = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("avatar") as File | null;

  if (!file) return NextResponse.json({ error: "Nessun file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Formato non supportato (usa JPEG, PNG, WebP o GIF)" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File troppo grande (max 2 MB)" }, { status: 400 });

  const ext      = file.type.split("/")[1].replace("jpeg", "jpg");
  const path     = `avatars/${user.id}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  // Usa il service role key per poter fare upsert nello storage
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error: uploadErr } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from("avatars").getPublicUrl(path);

  await prisma.user.update({
    where: { id: user.id },
    data:  { avatarUrl: publicUrl },
  });

  return NextResponse.json({ url: publicUrl });
}
