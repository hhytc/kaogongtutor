import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = new Map();
globalThis.localStorage = {
  getItem: key => map.get(key) ?? null,
  setItem: (key, value) => map.set(key, String(value)),
  removeItem: key => map.delete(key),
};
async function load(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const js = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}}).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
}
const {learningStorage} = await load('src/utils/learningStorage.ts');
const {assessmentStorage, MAX_SPATIAL_ASSESSMENTS} = await load('src/utils/assessmentStorage.ts');
learningStorage.saveAttempt('spatial:isolation-fixture', 'A', false, 2, undefined, 1);
learningStorage.clearCurrentForReattempt('spatial:isolation-fixture');
const trainingSnapshot = () => {
  const {exportedAt: _exportedAt, ...state} = JSON.parse(learningStorage.exportBackup());
  return state;
};
const snapshot = trainingSnapshot();
const sample = n => ({
  startedAt: 1000 + n * 100000, finishedAt: 16000 + n * 100000,
  category: 'views', sourceFilter: 'guokao', timeLimitSeconds: 60, elapsedSeconds: 15,
  questions: [{questionId: `assessment:${n}`, answer: 'B', correctAnswer: 'B',
    isCorrect: true, firstTest: true, practicedBefore: false, secondsSpent: 15}],
});
for (let n = 0; n < MAX_SPATIAL_ASSESSMENTS + 2; n++) {
  const result = assessmentStorage.saveAssessment(sample(n));
  assert(result.persisted);
}
assert.deepEqual(trainingSnapshot(), snapshot, 'Timed-test storage mutated training history/first-attempt/hints');
assert.equal(assessmentStorage.getHistory().length, MAX_SPATIAL_ASSESSMENTS);
assert.equal(assessmentStorage.getSeenQuestionIds().size, MAX_SPATIAL_ASSESSMENTS + 2);
assert(assessmentStorage.getSeenQuestionIds().has('assessment:0'), 'Old seen IDs lost when visible history truncated');
assert.equal(learningStorage.getRecords()['spatial:isolation-fixture'].firstAttemptCorrect, false);
assert.equal(learningStorage.getRecords()['spatial:isolation-fixture'].firstAttemptHints, 2);
assert(assessmentStorage.clear());
assert.equal(assessmentStorage.getHistory().length, 0);
assert.deepEqual(trainingSnapshot(), snapshot, 'Clearing test history cleared training');
console.log('PASS: independent timed-test storage, first-attempt/hint isolation, history cap, repeat-ID retention and clear boundary.');
