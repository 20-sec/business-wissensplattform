import { requireAccess } from '@/lib/auth';
import { catalog } from '@/lib/data';
import { tagSlug } from '@/lib/tags';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function Tag({ params }: { params: Promise<{id: string}> }) {
 await requireAccess(); const {id}=await params;
 const tags=[...new Set(catalog.videos.flatMap(v=>v.tags))];
 const tag=tags.find(t=>tagSlug(t)===id); if(!tag)notFound();
 const videos=catalog.videos.filter(v=>v.tags.includes(tag));
 return <main className="article"><a href="/">Zur Bibliothek</a><p className="eyebrow" style={{marginTop:24}}>THEMENÜBERSICHT</p><h1>{tag}</h1><p className="muted">{videos.length} {videos.length===1?'Analyse':'Analysen'} mit diesem Tag</p><div className="results">{videos.map(v=><article className="panel" key={v.id}><h2><a href={`/analysen/${v.id}`}>{v.title}</a></h2><p>{v.summary}</p><div className="tags">{v.tags.map(t=><a key={t} href={`/tags/${tagSlug(t)}`}>{t}</a>)}</div><p><a href={`/analysen/${v.id}`}>Analyse ansehen →</a></p></article>)}</div></main>;
}
