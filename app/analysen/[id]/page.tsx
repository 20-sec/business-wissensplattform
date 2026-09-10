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
  return <main className="original-viewer">
    <nav className="original-toolbar" aria-label="Analyseansichten">
      <a href="/" className="back-link">Zur Bibliothek</a>
      <span className="original-label">Originalanalyse</span>
      <div className="original-actions">
        <Button variant="outline" asChild><a href={`/api/original/${video.id}`} target="_blank" rel="noreferrer">Original separat öffnen</a></Button>
        <Button variant="outline" asChild><a href={`/api/original/${video.id}`} download={video.originalFilename}>HTML herunterladen</a></Button>
        <Button asChild><a href={`/analysen/${video.id}/gegenpruefung`}>Unsere Gegenprüfung</a></Button>
      </div>
    </nav>
    <iframe className="original-full-frame" title={video.title} src={`/api/original/${video.id}`} sandbox="" referrerPolicy="no-referrer"/>
  </main>;
}
