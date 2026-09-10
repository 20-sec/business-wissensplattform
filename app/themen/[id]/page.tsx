import { requireAccess } from "@/lib/auth";
import { catalog } from "@/lib/data";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Topic({ params }: { params: Promise<{ id: string }> }) {
 await requireAccess(); const { id } = await params; const topic = catalog.topics.find(t => t.id === id); if (!topic) notFound();
 return <main className="article"><a href="/">Zur Bibliothek</a><h1>{topic.title}</h1>{!topic.revisions.length && <p>Die Zusammenfassung entsteht nach der Prüfung der zugehörigen Analysen.</p>}{[...topic.revisions].reverse().map((r, i) => <section className="history" key={r.id}><h2>{i ? "Frühere Fassung" : "Aktuelle Fassung"} · {r.id}</h2><p className="muted">{new Date(r.createdAt).toLocaleDateString("de-DE")} · {r.reason}</p><p style={{ whiteSpace: "pre-wrap" }}>{r.summary}</p><h3>Verwendete Prüfstände</h3><ul>{r.videoRevisionIds.map(ref => <li key={ref}><a href={`/analysen/${ref.split("/")[0]}`}>{ref}</a></li>)}</ul></section>)}</main>;
}
