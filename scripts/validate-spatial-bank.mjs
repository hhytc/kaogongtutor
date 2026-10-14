import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packs = [
  ['errrc_origami', 'public/data/errrc/origami.json'],
  ['errrc_assembly', 'public/data/errrc/assembly.json'],
  ['errrc_cross_section', 'public/data/errrc/cross_section.json'],
  ['errrc_guokao_spatial', 'public/data/errrc/guokao_spatial_2022_2026.json'],
  ['spatial_training', 'public/data/spatial/training.json'],
];
const all = new Map();
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const auditManifest = read('public/data/errrc/manifest.json');
const metadata = new Map(auditManifest.questions.map(q => [q.id, q]));
assert.equal(metadata.size, auditManifest.questions.length, 'Duplicate manifest IDs');
let imageReferences = 0;
for (const [packId, file] of packs) {
  const questions = read(file);
  assert.equal(questions.length, auditManifest.packs[packId], `${packId} count drift`);
  for (const q of questions) {
    assert(!all.has(q.id), `Duplicate question ${q.id}`);
    all.set(q.id, q);
    const meta = metadata.get(q.id);
    assert(meta, `${q.id} missing from manifest`);
    assert.equal(meta.packId, packId);
    assert.equal(meta.category, q.category);
    assert.equal(meta.version, q.version || 1);
    assert(q.questionText.trim() && q.detailedAnalysis.trim(), `${q.id} empty content`);
    assert.equal(q.options.length, 4, `${q.id} option count`);
    assert.deepEqual(new Set(q.options.map(o => o.key)), new Set(['A', 'B', 'C', 'D']));
    assert(q.options.some(o => o.key === q.correctAnswer), `${q.id} invalid answer key`);
    const unassisted = [q.questionText, ...q.options.map(o => o.text)];
    assert(unassisted.every(text => !text.includes('✅')), `${q.id} source answer marker leak`);
    for (const resource of [...(q.stemImages || []), ...(q.analysisImages || []), ...q.options.map(o => o.imageUrl).filter(Boolean)]) {
      assert(resource.startsWith('data/'), `${q.id} unexpected remote/root image ${resource}`);
      const image = path.join(root, 'public', resource);
      assert(fs.existsSync(image) && fs.statSync(image).size > 0, `${q.id} missing image ${resource}`);
      imageReferences++;
    }
    if (q.meta?.isRealExam) {
      if (packId === 'errrc_guokao_spatial') {
        assert(q.source.includes('回忆'), `${q.id}: provenance must label recollection`);
      }
      assert.equal(q.meta.upstreamRevision, '84ab93d4b64b61d897bece8a1c0a5bab06b4feb2');
    } else {
      assert(q.source.includes('原创'), `${q.id}: authored training must not masquerade as real exam`);
    }
  }
}
for (const q of all.values()) {
  for (const variant of q.variantIds || []) {
    const target = all.get(variant);
    assert(target && target.questionRole === 'variant', `${q.id} broken variant ${variant}`);
    assert.equal(metadata.get(q.id).packId, metadata.get(variant).packId, `${q.id} lazy-load variant crossing pack`);
  }
}
assert.equal(all.size, auditManifest.total);

const source = fs.readFileSync(path.join(root, 'src/data/spatialQuestionManifest.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ESNext}}).outputText;
const {SPATIAL_SUPPLEMENT_MANIFEST} = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const supplements = auditManifest.questions.filter(q => ['spatial_training', 'errrc_guokao_spatial'].includes(q.packId));
assert.deepEqual(SPATIAL_SUPPLEMENT_MANIFEST, supplements, 'Runtime metadata differs from audit manifest');

const audit = read('public/data/errrc/guokao_spatial_audit.json');
assert.equal(audit.uniqueSpatialQuestions, audit.questions.length);
assert.equal(audit.added + audit.presentBefore, audit.questions.length);
assert.deepEqual(new Set(audit.questions.map(q => q.year)), new Set(['2022', '2023', '2024', '2025', '2026']));
for (const q of audit.questions) {
  assert(all.has(q.id), `Observed national question still missing: ${q.id}`);
  assert.equal(all.get(q.id).category, q.category);
}
for (const [file, expected] of Object.entries(audit.copiedImageSha256)) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'public', file))).digest('hex'), expected, `Source image copy changed: ${file}`);
}
const paperAudit = read('public/data/errrc/guokao_spatial_papers.json');
assert.equal(paperAudit.papers.length, 15, 'Missing annual paper source');
assert.equal(new Set(paperAudit.papers.map(p => `${p.year}:${p.paper}`)).size, 15);
assert(paperAudit.papers.every(p => p.checked && p.sha256 && p.sourceUrl));
assert.equal(paperAudit.appearances.length, 45);
assert.deepEqual(new Set(paperAudit.appearances.map(p => p.id)), new Set(audit.questions.map(q => q.id)), 'Paper cross-check and imported question universe differ');
assert(paperAudit.appearances.every(p => p.checked && all.has(p.id)));

const exactAllow = read('docs/spatial-3d-exact-allowlist.json');
const exactAllowed = new Set(exactAllow.exactQuestionIds || []);
let relatedNational = 0;
let exactNational = 0;
let noneNational = 0;
for (const observed of audit.questions) {
  const q = all.get(observed.id);
  const sim = q.simulatorConfig;
  if (!sim) {
    noneNational += 1;
    continue;
  }
  assert.equal(typeof sim.tab, 'string', `${observed.id} simulatorConfig.tab required`);
  assert.equal(typeof sim.isExact, 'boolean', `${observed.id} simulatorConfig.isExact must be boolean`);
  if (sim.isExact === true) {
    assert(exactAllowed.has(observed.id), `${observed.id} claims isExact=true but is not in docs/spatial-3d-exact-allowlist.json`);
    assert(sim.label && !String(sim.label).includes('相关考点'), `${observed.id} exact simulator must not use 相关考点 label`);
    exactNational += 1;
  } else {
    assert(sim.label && String(sim.label).includes('相关考点'), `${observed.id} related simulator must label 相关考点演示`);
    assert(!String(sim.label).includes('精确还原') || String(sim.label).includes('非') , `${observed.id} related label must not claim 精确还原`);
    relatedNational += 1;
  }
}
assert.equal(exactNational + relatedNational + noneNational, audit.questions.length);
for (const q of all.values()) {
  const sim = q.simulatorConfig;
  if (sim?.isExact === true) {
    assert(exactAllowed.has(q.id), `${q.id} has isExact=true outside national allowlist policy`);
  }
  if (metadata.get(q.id)?.packId === 'spatial_training') {
    assert(!sim, `${q.id} original training must not advertise simulatorConfig`);
  }
}
console.log(`PASS: ${all.size} pack questions, ${imageReferences} valid image references; ${audit.questions.length} observed national spatial questions covered; runtime/audit metadata agrees.`);
console.log(`3D coverage for ${audit.questions.length} national spatial items: exact=${exactNational}, related=${relatedNational}, none=${noneNational}; exact-allowlist=${exactAllowed.size}.`);

