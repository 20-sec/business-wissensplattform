import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.argv[2] ?? "http://localhost:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Diese Prüfung darf nur den lokalen Server verwenden.");
const secret = (await readFile(new URL("../.dev.vars", import.meta.url), "utf8")).split("\n").find(l => l.startsWith("APP_PASSWORD="))?.slice(13).replace(/^"|"$/g, "");
const get = (path, cookie) => fetch(base + path, { redirect: "manual", headers: cookie ? { Cookie: cookie } : {} });
const post = (path, body, origin = base, cookie) => fetch(base + path, { method: "POST", redirect: "manual", headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded", ...(cookie ? { Cookie: cookie } : {}) }, body });
assert.equal((await get("/login")).status, 200);
for (const route of ["/", "/methodik", "/analysen/no-such-video", "/themen/no-such-topic"]) {
 const response = await get(route); assert.ok([302, 303, 307].includes(response.status), route); assert.match(response.headers.get("location"), /login/);
}
assert.equal((await get("/api/original/missing")).status, 401);
assert.equal((await post("/api/login", "password=x", "https://invalid.example")).status, 403);
const bad = await post("/api/login", "password=wrong-password"); assert.equal(bad.status, 303); assert.match(bad.headers.get("location"), /error/);
const ok = await post("/api/login", new URLSearchParams({ password: secret }).toString()); assert.equal(ok.status, 303);
const setCookie = ok.headers.get("set-cookie"); assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /SameSite=Strict/);
const cookie = setCookie.split(";")[0];
for (const route of ["/", "/methodik"]) { const response = await get(route, cookie); assert.equal(response.status, 200, route); assert.match(response.headers.get("cache-control"), /no-store/); }
assert.equal((await get("/api/original/missing", cookie)).status, 404);
assert.notEqual((await get("/", cookie + "tampered")).status, 200);
assert.equal((await get("/api/original/missing", cookie + "tampered")).status, 401);
assert.notEqual((await get("/")).status, 200, "Keine anonyme Auslieferung nach angemeldetem Abruf");
const logout = await post("/api/logout", "", base, cookie); assert.equal(logout.status, 303); assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
console.log("Zugriff geprüft: Login, Herkunft, Cookie, geschützte Seiten/Originale, Fälschung, Cache und Logout.");
