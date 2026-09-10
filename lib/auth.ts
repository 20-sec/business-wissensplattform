import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "cloudflare:workers";
const encoder = new TextEncoder();
export const COOKIE = "business_session";
function secrets() {
  const values = env as unknown as Record<string, string>;
  return { password: values.APP_PASSWORD, secret: values.SESSION_SECRET };
}
export function configured() { const s = secrets(); return Boolean(s.password && s.secret); }
async function digest(value: string) { return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))); }
export async function passwordMatches(value: string) {
  if (!configured()) return false;
  const a = await digest(value), b = await digest(secrets().password);
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
async function sign(value: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secrets().secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value + ":" + secrets().password)));
  return Array.from(bytes, x => x.toString(16).padStart(2, "0")).join("");
}
export async function sessionToken() {
  const expires = String(Date.now() + 12 * 60 * 60 * 1000);
  return `${expires}.${await sign(expires)}`;
}
export async function authenticated() {
  if (!configured()) return false;
  const token = (await cookies()).get(COOKIE)?.value ?? "";
  const [expires, signature] = token.split(".");
  if (!/^\d+$/.test(expires ?? "") || !/^[a-f0-9]{64}$/.test(signature ?? "") || Number(expires) <= Date.now() || Number(expires) > Date.now() + 12 * 60 * 60 * 1000) return false;
  const expected = await sign(expires);
  let diff = 0; for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
export async function requireAccess() { if (!await authenticated()) redirect("/login"); }
