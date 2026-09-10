import { z } from "zod";
export const categories = ["Business-Ideen / Sidehustles", "Sportwetten", "KDP-Buchbusiness", "KI & Automation"];
const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
const date = z.string().datetime();
const url = z.string().url().refine(v => /^https?:\/\//.test(v), "Nur HTTP(S)-Quellen erlaubt");
export const sourceSchema = z.object({ id, title: z.string().min(1), url, accessedAt: date, originGroup: z.string().min(1), note: z.string().min(1) }).strict();
export const claimSchema = z.object({ id, text: z.string().min(1), importance: z.number().int().min(1).max(3), status: z.enum(["gestützt", "teilweise gestützt", "offen", "widerlegt"]), rationale: z.string().min(1), sourceIds: z.array(id), location: z.string().min(1), scope: z.string().min(1) }).strict();
export const revisionSchema = z.object({ id, createdAt: date, previousId: id.nullable(), reason: z.string().min(1), methodVersion: z.literal("1.0"), assessment: z.string().min(1), keyFacts: z.array(z.object({ label: z.string().min(1).max(80), fact: z.string().min(1).max(500), implication: z.string().min(1).max(400), sourceIds: z.array(id).min(1) }).strict()).length(5).optional(), marketExamples: z.array(z.object({ title: z.string().min(1), author: z.string(), niche: z.string(), match: z.string(), language: z.string(), format: z.string(), implementation: z.string(), takeaway: z.string(), amazonUrl: url, caveat: z.string() }).strict()).optional(), compactSummary: z.array(z.object({ label: z.string().min(1).max(60), text: z.string().min(1).max(400) }).strict()).length(5).optional(), claims: z.array(claimSchema).min(1), sources: z.array(sourceSchema), personalRelevance: z.object({ rating: z.number().int().min(0).max(4).nullable(), rationale: z.string(), confirmedByMarkus: z.boolean() }).strict(), questions: z.array(z.string()), relatedVideoIds: z.array(id), reviewers: z.array(z.object({ role: z.enum(["Recherche", "Gegenprüfung", "Synthese"]), name: z.string().min(1), conclusion: z.string().min(1) }).strict()).min(2) }).strict().superRefine((r, ctx) => {
 const sourceIds = new Set(r.sources.map(s => s.id));
 if (sourceIds.size !== r.sources.length || new Set(r.claims.map(c => c.id)).size !== r.claims.length) ctx.addIssue({ code: "custom", message: "Quellen-/Aussagen-IDs müssen eindeutig sein" });
 for (const point of r.keyFacts ?? []) {
   if (point.sourceIds.some(s => !sourceIds.has(s))) ctx.addIssue({ code: "custom", message: "Unbekannte Key-Fact-Quelle" });
 }
 for (const claim of r.claims) {
   if (claim.sourceIds.some(s => !sourceIds.has(s))) ctx.addIssue({ code: "custom", message: "Unbekannte Quellenreferenz" });
   if (claim.status !== "offen" && !claim.sourceIds.length) ctx.addIssue({ code: "custom", message: "Ein Belegurteil benötigt Quellen" });
 }
 if (!r.reviewers.some(x => x.role === "Recherche") || !r.reviewers.some(x => x.role === "Gegenprüfung")) ctx.addIssue({ code: "custom", message: "Recherche und Gegenprüfung dokumentieren" });
});
export const videoSchema = z.object({ id, title: z.string().min(1), sourceUrl: url.nullable(), channel: z.string().nullable(), publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), importedAt: date, categories: z.array(z.enum(categories)).min(1), tags: z.array(z.string().min(1)), summary: z.string(), originalHash: z.string().regex(/^[a-f0-9]{64}$/), originalFilename: z.string(), sourceAssessment: z.string().nullable(), topicIds: z.array(id), revisions: z.array(revisionSchema) }).strict();
export const topicSchema = z.object({ id, title: z.string().min(1), revisions: z.array(z.object({ id, createdAt: date, reason: z.string().min(1), summary: z.string().min(1), videoRevisionIds: z.array(z.string()).min(1) }).strict()) }).strict();
export const catalogSchema = z.object({ schemaVersion: z.literal(1), videos: z.array(videoSchema), topics: z.array(topicSchema), reviewQueue: z.array(z.object({ videoId: id, triggerVideoId: id, reason: z.string().min(1), createdAt: date }).strict()) }).strict().superRefine((c, ctx) => {
 const vids = new Set(c.videos.map(v => v.id)), topics = new Set(c.topics.map(t => t.id));
 if (vids.size !== c.videos.length || topics.size !== c.topics.length) ctx.addIssue({ code: "custom", message: "Doppelte Video-/Themen-ID" });
 const refs = new Set();
 for (const v of c.videos) {
   if (v.topicIds.some(t => !topics.has(t))) ctx.addIssue({ code: "custom", message: "Unbekanntes Thema" });
   const seen = new Set();
   for (let i = 0; i < v.revisions.length; i++) {
     const r = v.revisions[i]; refs.add(`${v.id}/${r.id}`);
     if (seen.has(r.id) || r.previousId !== (v.revisions[i - 1]?.id ?? null)) ctx.addIssue({ code: "custom", message: "Ungültige Revisionskette" });
     if (r.relatedVideoIds.some(x => !vids.has(x))) ctx.addIssue({ code: "custom", message: "Unbekanntes Vergleichsvideo" });
     seen.add(r.id);
   }
 }
 for (const t of c.topics) {
   if (new Set(t.revisions.map(r => r.id)).size !== t.revisions.length) ctx.addIssue({ code: "custom", message: "Doppelte Themenrevision" });
   for (const r of t.revisions) if (r.videoRevisionIds.some(x => !refs.has(x))) ctx.addIssue({ code: "custom", message: "Unbekannte Video-Revision in Themenseite" });
 }
 if (c.reviewQueue.some(q => !vids.has(q.videoId) || !vids.has(q.triggerVideoId))) ctx.addIssue({ code: "custom", message: "Ungültige Prüfwarteschlange" });
});
export function evidenceSummary(claims) {
 const total = claims.reduce((sum, c) => sum + c.importance, 0);
 const weight = status => claims.filter(c => c.status === status).reduce((sum, c) => sum + c.importance, 0);
 return { total, coverage: total ? Math.round(100 * (total - weight("offen")) / total) : null, distribution: ["gestützt", "teilweise gestützt", "offen", "widerlegt"].map(status => ({ status, weight: weight(status), percent: total ? Math.round(100 * weight(status) / total) : null })), criticalConflict: claims.some(c => c.importance === 3 && c.status === "widerlegt") };
}
