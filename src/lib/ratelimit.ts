import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Istanza Redis condivisa — singleton per tutto il progetto
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Limitatore per le rotte di voto:
// max 5 richieste per IP in una finestra scorrevole di 10 secondi.
// Protegge da bot, spam e abuse senza bloccare utenti legittimi.
export const rateLimitVoto = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  prefix: "fp:rl:voto",
  analytics: true,
});

// Limitatore più stretto per le rotte di auth (futuro):
// max 10 tentativi ogni 60 secondi per IP.
export const rateLimitAuth = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "fp:rl:auth",
  analytics: true,
});

// ── Utility: IP banning ───────────────────────────────────────────────────────

const BAN_PREFIX = "fp:ban:";

export async function banIp(
  ip: string,
  ttlSeconds: number | null = null
): Promise<void> {
  const key = `${BAN_PREFIX}${ip}`;
  if (ttlSeconds) {
    await redis.set(key, "1", { ex: ttlSeconds });
  } else {
    // Ban permanente (fino a rimozione manuale)
    await redis.set(key, "1");
  }
}

export async function isIpBanned(ip: string): Promise<boolean> {
  const key = `${BAN_PREFIX}${ip}`;
  return (await redis.exists(key)) === 1;
}

// ── Utility: estrazione IP robusta per Vercel ─────────────────────────────────

export function getIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for può contenere una lista "client, proxy1, proxy2"
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}
