import { requireAccess } from "@/lib/auth";
import { catalog } from "@/lib/data";
import { notFound } from "next/navigation";
import ReviewContent from "@/components/review-content";
export const dynamic = "force-dynamic";
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
 await requireAccess(); const { id } = await params;
 const video = catalog.videos.find(v => v.id === id); if (!video) notFound();
 return <main><ReviewContent video={video}/></main>;
}
