import { requireAccess } from "@/lib/auth";
import { catalog } from "@/lib/data";
import { Button } from "@/components/ui/button";
import ReviewContent from "@/components/review-content";
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
      </div>
    </nav>
    <iframe className="original-full-frame" title={video.title} src={`/api/original/${video.id}`} sandbox="" referrerPolicy="no-referrer"/>
    <section className="compact-review-band" id="kurzpruefung" aria-labelledby="compact-title">
      <div className="compact-review">
      <p className="eyebrow">UNSERE EINSCHÄTZUNG{review ? ` · ${review.id}` : ""}</p>
      <h2 id="compact-title">Unsere Kurzprüfung</h2>
      {review?.compactSummary ? <ol>{review.compactSummary.map((point, index) => <li key={point.label}><span className="point-number" aria-hidden="true">0{index + 1}</span><div><h3>{point.label}</h3><p>{point.text}</p></div></li>)}</ol> : <p className="muted">Die Kurzprüfung folgt nach der Sichtung deiner Analyse.</p>}
      <p className="compact-invitation">Ergänzungen, Erfahrungen oder Verbindungen aus deinem Netzwerk können wir im gemeinsamen Task prüfen und in die Wissensbasis aufnehmen.</p>
      <Button asChild><a href="#vollstaendige-pruefung" aria-label="Mehr: vollständige Gegenprüfung weiter unten">Mehr</a></Button>
      </div>
    </section>
    <section id="vollstaendige-pruefung" aria-label="Vollständige Gegenprüfung"><ReviewContent video={video} showBackLink={false}/></section>
  </main>;
}
