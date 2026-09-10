import { requireAccess } from "@/lib/auth";
import { catalog } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function OriginalAnalysis({ params }: { params: Promise<{ id: string }> }) {
  await requireAccess();
  const { id } = await params;
  const video = catalog.videos.find(v => v.id === id);
  if (!video) notFound();
  const review = video.revisions.at(-1);
  return <main className="original-viewer">
    <nav className="original-toolbar" aria-label="Analyseansichten">
      <a href="/" className="back-link">Zur Bibliothek</a>
      <span className="original-label">Originalanalyse</span>
      <div className="original-actions">
        <Button variant="outline" asChild><a href={`/api/original/${video.id}`} target="_blank" rel="noreferrer">Original separat öffnen</a></Button>
        <Button variant="outline" asChild><a href={`/api/original/${video.id}`} download={video.originalFilename}>HTML herunterladen</a></Button>
        <Button asChild><a href="#kurzpruefung">Unsere Kurzprüfung</a></Button>
      </div>
    </nav>
    <iframe className="original-full-frame" title={video.title} src={`/api/original/${video.id}`} sandbox="" referrerPolicy="no-referrer"/>
    <section className="compact-review" id="kurzpruefung" aria-labelledby="compact-title">
      <p className="eyebrow">UNSERE EINSCHÄTZUNG{review ? ` · ${review.id}` : ""}</p>
      <h2 id="compact-title">Fünf Balance-Points</h2>
      {review?.compactSummary ? <ol>{review.compactSummary.map((point, index) => <li key={point.label}><span className="point-number" aria-hidden="true">0{index + 1}</span><div><h3>{point.label}</h3><p>{point.text}</p></div></li>)}</ol> : <p className="muted">Die Kurzprüfung folgt nach der Sichtung deiner Analyse.</p>}
      <p className="compact-invitation">Was fällt dir dazu auf? Ergänze deine Sicht im gemeinsamen Task — wir prüfen sie und entwickeln die Einschätzung weiter.</p>
      <Button asChild><a href={`/analysen/${video.id}/gegenpruefung`} aria-label="Mehr: vollständige Gegenprüfung">Mehr</a></Button>
    </section>
  </main>;
}
