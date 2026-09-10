import { requireAccess } from "@/lib/auth";
import { catalog } from "@/lib/data";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Topic({ params }: { params: Promise<{ id: string }> }) {
 await requireAccess(); const { id } = await params; const topic = catalog.topics.find(t => t.id === id); if (!topic) notFound();
 const ids = new Set(topic.revisions.flatMap(r => r.videoRevisionIds.map(ref => ref.split("/")[0])));
 const videos = catalog.videos.filter(v => v.topicIds.includes(id) || ids.has(v.id));
 return <main className="article"><a href="/">Zur Bibliothek</a><h1>{topic.title}</h1><h2>Zugehörige Analysen</h2><div className="results">{videos.map(v => <article className="panel" key={v.id}><h3><a href={`/analysen/${v.id}`}>{v.title}</a></h3><p>{v.summary}</p><a href={`/analysen/${v.id}`}>Analyse ansehen →</a></article>)}</div><h2>Gemeinsamer Wissensstand</h2>{!topic.revisions.length && <p>Die Zusammenfassung entsteht nach der Prüfung der zugehörigen Analysen.</p>}{[...topic.revisions].reverse().map((r, i) => <section className="history" key={r.id}><h2>{i ? "Frühere Fassung" : "Aktuelle Fassung"} · {r.id}</h2><p className="muted">{new Date(r.createdAt).toLocaleDateString("de-DE")} · {r.reason}</p><p style={{ whiteSpace: "pre-wrap" }}>{r.summary}</p><h3>Verwendete Prüfstände</h3><ul>{r.videoRevisionIds.map(ref => <li key={ref}><a href={`/analysen/${ref.split("/")[0]}`}>{ref}</a></li>)}</ul></section>)}</main>;
}
