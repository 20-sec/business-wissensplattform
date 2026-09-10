import { COOKIE } from "@/lib/auth";
export async function POST(request: Request) {
 if (request.headers.get("origin") !== new URL(request.url).origin) return new Response("Unzulässige Herkunft", { status: 403 });
 return new Response(null, { status: 303, headers: { Location: "/login", "Cache-Control": "no-store", "Set-Cookie": `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` } });
}
