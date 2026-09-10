import { COOKIE, configured, passwordMatches, sessionToken } from "@/lib/auth";
const attempts = new Map<string, { count: number; reset: number }>();
export async function POST(request: Request) {
 const origin = new URL(request.url).origin;
 if (request.headers.get("origin") !== origin) return new Response("Unzulässige Herkunft", { status: 403 });
 if (!configured()) return new Response("Zugang nicht eingerichtet", { status: 503 });
 // Local single-user protection. Replace with a durable limiter before public hosting.
 const key = request.headers.get("cf-connecting-ip") ?? "local";
 const now = Date.now();
 for (const [ip, entry] of attempts) if (entry.reset <= now) attempts.delete(ip);
 const attempt = attempts.get(key) ?? { count: 0, reset: now + 60_000 };
 if (attempt.count >= 10) return new Response("Bitte in einer Minute erneut versuchen.", { status: 429, headers: { "Retry-After": "60" } });
 attempt.count++; attempts.set(key, attempt);
 if (Number(request.headers.get("content-length")) > 4096) return new Response("Anfrage zu groß", { status: 413 });
 const body = await request.text();
 if (body.length > 4096) return new Response("Anfrage zu groß", { status: 413 });
 const password = new URLSearchParams(body).get("password") ?? "";
 if (!await passwordMatches(password)) return new Response(null, { status: 303, headers: { Location: "/login?error=1", "Cache-Control": "no-store" } });
 attempts.delete(key);
 return new Response(null, { status: 303, headers: { Location: "/", "Cache-Control": "no-store", "Set-Cookie": `${COOKIE}=${await sessionToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${new URL(request.url).protocol === "https:" ? "; Secure" : ""}` } });
}
