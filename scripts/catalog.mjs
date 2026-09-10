import { readFile, writeFile, mkdir, rename, open, unlink } from "node:fs/promises";
import { resolve, basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { catalogSchema, revisionSchema, topicSchema, videoSchema } from "../lib/schema.mjs";
const root = resolve(process.env.BUSINESS_DATA_ROOT || fileURLToPath(new URL("../", import.meta.url)));
const data = join(root, "data");
const read = async name => JSON.parse(await readFile(join(data, name), "utf8"));
async function atomic(name, value) { const dest = join(data, name); await writeFile(dest + ".tmp", JSON.stringify(value, null, 2) + "\n"); await rename(dest + ".tmp", dest); }
const [command, ...args] = process.argv.slice(2);
let lock;
try {
 await mkdir(data, { recursive: true });
 lock = await open(join(data, ".catalog.lock"), "wx");
 const catalog = catalogSchema.parse(await read("catalog.json"));
 const originals = await read("content.json");
 if (command === "validate") {
   for (const v of catalog.videos) {
     const bytes = await readFile(join(data, "originals", v.originalHash + ".html"));
     if (createHash("sha256").update(bytes).digest("hex") !== v.originalHash || originals[v.id] !== bytes.toString("utf8")) throw new Error("Originaldatei oder HTML-Index verändert: " + v.id);
   }
   console.log(`Gültig: ${catalog.videos.length} Analysen, ${catalog.topics.length} Themen.`);
 } else if (command === "import") {
   const [htmlPath, metadataPath] = args;
   if (!htmlPath || !metadataPath) throw new Error("import <datei.html> <metadaten.json>");
   const bytes = await readFile(resolve(htmlPath));
   if (bytes.length > 10 * 1024 * 1024) throw new Error("HTML über 10 MB: vor dem Import prüfen");
   const originalHash = createHash("sha256").update(bytes).digest("hex");
   if (catalog.videos.some(v => v.originalHash === originalHash)) throw new Error("Diese HTML-Datei wurde bereits importiert.");
   const metadata = JSON.parse(await readFile(resolve(metadataPath), "utf8"));
   const record = videoSchema.parse({ sourceUrl: null, channel: null, publishedAt: null, tags: [], summary: "", sourceAssessment: null, topicIds: [], ...metadata, importedAt: new Date().toISOString(), originalHash, originalFilename: basename(htmlPath), revisions: [] });
   if (catalog.videos.some(v => v.id === record.id)) throw new Error("Video-ID existiert bereits; Original bleibt erhalten.");
   if (record.sourceUrl && catalog.videos.some(v => v.sourceUrl === record.sourceUrl)) throw new Error("Video-URL bereits vorhanden; neue Analyseversion zuerst inhaltlich prüfen.");
   // Queue topic matches and shared exact tool/topic tags. This never changes earlier judgements.
   for (const other of catalog.videos) {
     const shared = record.topicIds.some(t => other.topicIds.includes(t)) || record.tags.some(t => other.tags.includes(t));
     if (shared) {
       catalog.reviewQueue.push({ videoId: other.id, triggerVideoId: record.id, reason: "Neue Analyse mit gemeinsamem Thema oder Tag; Zusammenhang prüfen.", createdAt: record.importedAt });
       catalog.reviewQueue.push({ videoId: record.id, triggerVideoId: other.id, reason: "Mit vorhandenem Material vergleichen.", createdAt: record.importedAt });
     }
   }
   catalog.videos.push(record); catalogSchema.parse(catalog);
   await mkdir(join(data, "originals"), { recursive: true });
   // Exclusive write prevents overwriting an original.
   try { await writeFile(join(data, "originals", originalHash + ".html"), bytes, { flag: "wx" }); }
   catch (e) { if (e.code !== "EEXIST") throw e; const old = await readFile(join(data, "originals", originalHash + ".html")); if (!old.equals(bytes)) throw new Error("Original-Hash-Konflikt"); }
   originals[record.id] = bytes.toString("utf8");
   // A crash before the catalog write can only leave an unreferenced private original.
   await atomic("content.json", originals); await atomic("catalog.json", catalog);
   console.log(`Importiert: ${record.title}. Originalbewertung übernommen, Gegenprüfung offen.`);
 } else if (command === "review") {
   const [videoId, revisionPath] = args;
   const video = catalog.videos.find(v => v.id === videoId);
   if (!video || !revisionPath) throw new Error("review <video-id> <revision.json>");
   const revision = revisionSchema.parse(JSON.parse(await readFile(resolve(revisionPath), "utf8")));
   if (revision.previousId !== (video.revisions.at(-1)?.id ?? null) || video.revisions.some(r => r.id === revision.id)) throw new Error("Revision muss an die letzte Fassung anschließen");
   video.revisions.push(revision);
   catalog.reviewQueue = catalog.reviewQueue.filter(q => q.videoId !== videoId || !revision.relatedVideoIds.includes(q.triggerVideoId));
   catalogSchema.parse(catalog); await atomic("catalog.json", catalog);
   console.log(`Neue Prüfung ${revision.id} angehängt. Frühere Fassungen erhalten.`);
 } else if (command === "topic") {
   const topic = topicSchema.parse(JSON.parse(await readFile(resolve(args[0]), "utf8")));
   const old = catalog.topics.find(t => t.id === topic.id);
   if (old) {
     if (topic.revisions.length <= old.revisions.length || JSON.stringify(topic.revisions.slice(0, old.revisions.length)) !== JSON.stringify(old.revisions)) throw new Error("Alte Themenrevisionen müssen unverändert bleiben");
     catalog.topics[catalog.topics.indexOf(old)] = topic;
   } else catalog.topics.push(topic);
   catalogSchema.parse(catalog); await atomic("catalog.json", catalog); console.log("Thema gespeichert.");
 } else throw new Error("Befehle: import, review, topic, validate");
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { if (lock) { await lock.close(); await unlink(join(data, ".catalog.lock")); } }
