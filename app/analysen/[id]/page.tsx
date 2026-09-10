import { requireAccess } from "@/lib/auth";
import { catalog } from "@/lib/data";
import { evidenceSummary } from "@/lib/schema.mjs";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Analysis({ params }: { params: Promise<{ id: string }> }) {
 await requireAccess(); const { id } = await params; const video = catalog.videos.find(v => v.id === id); if (!video) notFound();
 return <main className="article"><a href="/">Zur Bibliothek</a><h1>{video.title}</h1><p>{video.summary}</p><p className="muted">{video.categories.join(" · ")} · Importiert am {new Date(video.importedAt).toLocaleDateString("de-DE")}</p>{video.sourceUrl && <p><a href={video.sourceUrl} target="_blank" rel="noreferrer">Videoquelle öffnen</a></p>}
 <div className="tags">{video.tags.map(t => <span key={t}>{t}</span>)}</div>
 {video.topicIds.map(id => <p key={id}><a href={`/themen/${id}`}>{catalog.topics.find(t => t.id === id)?.title}</a></p>)}
 <section className="panel"><h2>Mitgelieferte Bewertung</h2><p style={{ whiteSpace: "pre-wrap" }}>{video.sourceAssessment ?? "Noch nicht aus der HTML-Analyse erfasst. Keine Bewertung ergänzt oder erfunden."}</p><p className="small muted">Unveränderter Ausgangspunkt aus der eingereichten Analyse.</p></section>
 {catalog.reviewQueue.filter(q => q.videoId === id).map((q, i) => <p className="badge" key={i}>Erneut prüfen: {q.reason} <a href={`/analysen/${q.triggerVideoId}`}>Auslösendes Video</a></p>)}
 <h2>Unsere Gegenprüfung</h2>{!video.revisions.length && <p>Noch ungeprüft. Die Originalbewertung wurde noch nicht bestätigt oder abgeschwächt.</p>}
 {[...video.revisions].reverse().map((r, i) => { const evidence = evidenceSummary(r.claims); return <section className="history" key={r.id}><h3>{i === 0 ? "Aktuelle Prüfung" : "Frühere Prüfung"} · {r.id}</h3><p className="small muted">{new Date(r.createdAt).toLocaleDateString("de-DE")} · Bewertungsmethodik {r.methodVersion}</p><p><strong>Anlass:</strong> {r.reason}</p><p>{r.assessment}</p><div className="panel"><p><strong>Prüfabdeckung: {evidence.coverage ?? "—"} %</strong> des erfassten Aussagegewichts</p><div className="tags">{evidence.distribution.map(d => <span key={d.status}>{d.status}: {d.percent ?? "—"} %</span>)}</div><p className="small muted">Gewichtung nach Bedeutung (1–3). Keine Wahrscheinlichkeit, dass das Video wahr ist. Prozentwerte sind gerundet.</p>{evidence.criticalConflict && <p><strong>Eine zentrale Aussage ist widerlegt. Das darf nicht durch andere Aussagen ausgeglichen werden.</strong></p>}</div>
 {r.claims.map(c => <div className="claim" key={c.id}><strong>{c.text}</strong><p><span className="badge">{c.status}</span> · Gewicht {c.importance}/3</p><p>{c.rationale}</p><p className="small muted">{c.location} · {c.scope}</p><p className="small">Belege: {c.sourceIds.length ? c.sourceIds.map(sourceId => { const source = r.sources.find(s => s.id === sourceId); return source ? <a key={sourceId} href={source.url} target="_blank" rel="noreferrer">[{source.title}] </a> : null; }) : "Noch offen"}</p></div>)}
 <h3>Quellen und Unabhängigkeit</h3>{r.sources.map(s => <p key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a><br/><span className="small muted">Geprüft: {new Date(s.accessedAt).toLocaleDateString("de-DE")} · Ursprung: {s.originGroup}. {s.note}</span></p>)}
 <h3>Persönliche Relevanz</h3><p>{r.personalRelevance.rating === null ? "Noch offen" : `${r.personalRelevance.rating}/4`} · {r.personalRelevance.confirmedByMarkus ? "Von Markus bestätigt" : "Nicht von Markus bestätigt"}</p><p>{r.personalRelevance.rationale}</p>
 {!!r.questions.length && <><h3>Offene Rückfragen</h3><ul>{r.questions.map(q => <li key={q}>{q}</li>)}</ul></>}
 <h3>Prüfbeiträge</h3>{r.reviewers.map((reviewer, j) => <p key={j}><strong>{reviewer.role} · {reviewer.name}</strong><br/>{reviewer.conclusion}</p>)}
 {!!r.relatedVideoIds.length && <p>Verglichen mit: {r.relatedVideoIds.map(related => <a key={related} href={`/analysen/${related}`}>{catalog.videos.find(v => v.id === related)?.title} · </a>)}</p>}
 </section>; })}
 <h2>Originalanalyse</h2><p className="small muted">Geschützte HTML-Ansicht. Eingebettete Skripte und externe Inhalte werden nicht ausgeführt.</p><iframe className="original-frame" title={`Originalanalyse: ${video.title}`} src={`/api/original/${video.id}`} sandbox="" referrerPolicy="no-referrer"/></main>;
}
