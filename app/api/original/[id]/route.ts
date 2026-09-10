import { authenticated } from "@/lib/auth";
import { catalog } from "@/lib/data";
import html from "@/data/content.json";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
 if (!await authenticated()) return new Response("Zugang erforderlich", { status: 401, headers: { "Cache-Control": "no-store" } });
 const { id } = await params;
 if (!catalog.videos.some(v => v.id === id)) return new Response("Nicht gefunden", { status: 404 });
 const content = (html as Record<string, string>)[id];
 if (typeof content !== "string") return new Response("Original fehlt", { status: 404 });
 return new Response(content, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "Content-Security-Policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; frame-ancestors 'self'; form-action 'none'; base-uri 'none'", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } });
}
