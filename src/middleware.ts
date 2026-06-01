import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { banIp, getIpFromRequest } from "@/lib/ratelimit";

const PROTECTED_ROUTES = ["/dashboard", "/eventi"];
const AUTH_ROUTES = ["/login", "/signup"];

// §4.1 — prefissi honeypot: IP bannato 24h + 404 secco, nessun indizio che la rotta esista
const HONEYPOT_PREFIXES = ["/admin", "/wp-admin", "/administrator", "/backend"];
const BAN_TTL = 86_400; // 24h

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (HONEYPOT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const ip = getIpFromRequest(request);
    if (ip !== "unknown") {
      banIp(ip, BAN_TTL).catch((err) =>
        console.error("[honeypot] ban fallito per IP", ip, err)
      );
    }
    return new NextResponse(null, { status: 404 });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
