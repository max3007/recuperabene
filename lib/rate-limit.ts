// Rate limiter best-effort in memoria, per endpoint + IP.
//
// ATTENZIONE: su serverless (Vercel) lo stato vive nella singola istanza ed è
// volatile. Protegge da loop accidentali e raffiche rapide su un'istanza calda,
// ma NON è un limite distribuito forte: istanze diverse hanno contatori diversi.
// La protezione vera contro abusi anonimi è il Basic Auth nel middleware; questo
// è difesa in profondità contro il burn di token. Per un limite robusto e
// condiviso servirebbe uno store esterno (Upstash Redis / Vercel KV).

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  retryAfter: number; // secondi
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

// IP del chiamante dietro il proxy di Vercel; fallback a "local" in dev.
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}
