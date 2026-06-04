import { redis } from "./ratelimit";

const CACHE_TTL = 6 * 60 * 60; // 6 ore
const CACHE_PREFIX = "fp:vpn:";
const TIMEOUT_MS = 1500;

interface VpnResult {
  isVpn: boolean;
  type?: string;
  risk?: number;
}

// Controlla se un IP è VPN/proxy via proxycheck.io.
// Risultati cachati in Redis per 6h per risparmiare quota API.
export async function checkVpn(ip: string): Promise<VpnResult> {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("::")) {
    return { isVpn: false };
  }

  const cacheKey = `${CACHE_PREFIX}${ip}`;

  try {
    const cached = await redis.get<string>(cacheKey);
    if (cached !== null) {
      return JSON.parse(cached) as VpnResult;
    }
  } catch {
    // Cache miss — procedi con l'API
  }

  try {
    const apiKey = process.env.PROXYCHECK_KEY ?? "";
    const url = apiKey
      ? `https://proxycheck.io/v2/${ip}?key=${apiKey}&vpn=1&risk=1`
      : `https://proxycheck.io/v2/${ip}?vpn=1&risk=1`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!resp.ok) return { isVpn: false };

    const data = (await resp.json()) as Record<string, unknown>;
    const ipData = data[ip] as Record<string, unknown> | undefined;

    if (!ipData) return { isVpn: false };

    const result: VpnResult = {
      isVpn: ipData.proxy === "yes",
      type: typeof ipData.type === "string" ? ipData.type : undefined,
      risk: typeof ipData.risk === "number" ? ipData.risk : undefined,
    };

    await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TTL });
    return result;
  } catch {
    return { isVpn: false };
  }
}
