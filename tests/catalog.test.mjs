import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { evidenceSummary, revisionSchema } from '../lib/schema.mjs';
const stamp = '2026-09-10T12:00:00.000Z';
function revision(id, previousId = null) {
 return { id, createdAt: stamp, previousId, reason: 'Test einer neuen Quelle', methodVersion: '1.0', assessment: 'Aussage bleibt offen.', claims: [{ id: 'c1', text: 'Testaussage', importance: 3, status: 'offen', rationale: 'Tragende Aussage, noch ohne Belege.', sourceIds: [], location: 'Absatz 1', scope: 'Testfall' }], sources: [], personalRelevance: { rating: null, rationale: 'Unbekannt', confirmedByMarkus: false }, questions: [], relatedVideoIds: [], reviewers: [{ role: 'Recherche', name: 'Test A', conclusion: 'Offen' }, { role: 'Gegenprüfung', name: 'Test B', conclusion: 'Offen' }] };
}
test('Offene zentrale Aussage und widerlegte Aussage bleiben in Gewichtung sichtbar', () => {
 const result = evidenceSummary([{ importance: 3, status: 'offen' }, { importance: 1, status: 'gestützt' }]);
 assert.equal(result.coverage, 25); assert.equal(result.distribution.find(d => d.status === 'offen').percent, 75);
 assert.equal(evidenceSummary([]).coverage, null);
 assert.equal(evidenceSummary([{ importance: 3, status: 'widerlegt' }]).criticalConflict, true);
});
test('Urteile ohne Quellen und gefährliche Quellen-URLs werden zurückgewiesen', () => {
 const value = revision('r1'); value.claims[0].status = 'gestützt'; assert.equal(revisionSchema.safeParse(value).success, false);
 value.sources = [{ id: 's1', title: 'Test', url: 'javascript:alert(1)', accessedAt: stamp, originGroup: 'a', note: 'Test' }]; value.claims[0].sourceIds = ['s1']; assert.equal(revisionSchema.safeParse(value).success, false);
});
test('Import schützt Originale, erzeugt Prüfimpulse und hängt Revisionen ausschließlich an', async () => {
 const root = await mkdtemp(join(tmpdir(), 'business-test-'));
 const script = new URL('../scripts/catalog.mjs', import.meta.url);
 const run = (...args) => spawnSync(process.execPath, [fileURLToPath(script), ...args], { encoding: 'utf8', env: { ...process.env, BUSINESS_DATA_ROOT: root } });
 const success = result => assert.equal(result.status, 0, result.stderr);
 const load = async () => JSON.parse(await readFile(join(root, 'data/catalog.json'), 'utf8'));
 try {
  await mkdir(join(root, 'data'));
  await writeFile(join(root, 'data/catalog.json'), JSON.stringify({ schemaVersion: 1, videos: [], topics: [], reviewQueue: [] }));
  await writeFile(join(root, 'data/content.json'), '{}');
  const html = join(root, 'sample.html'), meta = join(root, 'meta.json'), review = join(root, 'review.json');
  const original = '<html><h1>Nur Test</h1><script>throw new Error("untrusted")</script></html>';
  await writeFile(html, original);
  await writeFile(meta, JSON.stringify({ id: 'video-a', title: 'A', categories: ['KI & Automation'], sections: [{category: 'KI & Automation', section: 'Tools und Werkzeuge'}], tags: ['Agenten'], sourceAssessment: 'Ursprüngliches Rating: 8/10' }));
  const validMeta = await readFile(meta, 'utf8');
  await writeFile(meta, JSON.stringify({...JSON.parse(validMeta), sections: [{category: 'KDP-Buchbusiness', section: 'Marketing'}]}));
  assert.notEqual(run('import', html, meta).status, 0, 'Untersektion eines anderen Oberbereichs zurückweisen');
  await writeFile(meta, validMeta);
  success(run('import', html, meta));
  assert.notEqual(run('import', html, meta).status, 0);
  let catalog = await load();
  assert.equal(catalog.videos[0].sourceAssessment, 'Ursprüngliches Rating: 8/10');
  assert.equal(await readFile(join(root, 'data/originals', catalog.videos[0].originalHash + '.html'), 'utf8'), original);
  await writeFile(html, '<html>Anderes Testvideo</html>');
  await writeFile(meta, JSON.stringify({ id: 'video-b', title: 'B', categories: ['KI & Automation'], sections: [{category: 'KI & Automation', section: 'Tools und Werkzeuge'}], tags: ['Agenten'] }));
  success(run('import', html, meta));
  catalog = await load(); assert.equal(catalog.reviewQueue.length, 2);
  assert.equal(catalog.videos[0].revisions.length, 0, 'Neues Video ist noch kein neues Urteil');
  const r1 = revision('r1'); r1.relatedVideoIds = ['video-b'];
  await writeFile(review, JSON.stringify(r1)); success(run('review', 'video-a', review));
  assert.notEqual(run('review', 'video-a', review).status, 0);
  const r2 = revision('r2', 'r1'); await writeFile(review, JSON.stringify(r2)); success(run('review', 'video-a', review));
  catalog = await load(); assert.deepEqual(catalog.videos[0].revisions[0], r1); assert.equal(catalog.videos[0].revisions.length, 2); assert.equal(catalog.reviewQueue.length, 1);
  const bad = revision('r3', 'r2'); bad.relatedVideoIds = ['unknown-video']; await writeFile(review, JSON.stringify(bad)); assert.notEqual(run('review', 'video-a', review).status, 0);
  success(run('validate'));
  assert.equal((await load()).videos[0].revisions.length, 2);
 } finally { await rm(root, { recursive: true, force: true }); }
});
