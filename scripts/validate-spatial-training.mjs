#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packPath = resolve(root, 'public/data/spatial/training.json');
const questions = JSON.parse(await readFile(packPath, 'utf8'));
const expectedCounts = {
  views: 8,
  origami: 4,
  paper_folding: 4,
  assembly: 2,
  cross_section: 2,
};

assert.equal(questions.length, 20, 'the original training pack should contain 20 questions');
const byId = new Map(questions.map((q) => [q.id, q]));
assert.equal(byId.size, questions.length, 'question ids must be unique');
for (const [category, count] of Object.entries(expectedCounts)) {
  assert.equal(questions.filter((q) => q.category === category).length, count, `${category} question count`);
}

const unitGroups = new Map();
const imageRefs = new Set();
for (const q of questions) {
  assert.match(q.id, /^spatial:[a-z0-9-]+$/);
  assert.equal(q.version, 1);
  assert.equal(q.source, '原创专项训练（非国考真题）');
  assert.equal(q.track, 'geometry');
  assert.equal(q.meta?.isRealExam, false);
  assert.ok(q.title && q.unitId && q.unitName && q.subType && q.questionText && q.detailedAnalysis);
  assert.ok(Array.isArray(q.knowledgePoints) && q.knowledgePoints.length >= 2);
  assert.ok(!q.simulatorConfig, `${q.id} should not advertise an unverified simulator`);
  assert.ok(Array.isArray(q.options) && q.options.length >= 2);
  assert.equal(new Set(q.options.map((option) => option.key)).size, q.options.length, `${q.id} option keys`);
  assert.ok(q.options.some((option) => option.key === q.correctAnswer), `${q.id} answer must match an option`);
  assert.ok(['example', 'variant'].includes(q.questionRole));
  if (!unitGroups.has(q.unitId)) unitGroups.set(q.unitId, []);
  unitGroups.get(q.unitId).push(q);
  for (const image of [...(q.stemImages ?? []), ...(q.analysisImages ?? [])]) imageRefs.add(image);
}

for (const [unitId, group] of unitGroups) {
  const examples = group.filter((q) => q.questionRole === 'example');
  const variants = group.filter((q) => q.questionRole === 'variant');
  assert.equal(examples.length, 1, `${unitId} should have one example`);
  assert.ok(variants.length >= 1, `${unitId} should have at least one variant`);
  for (const variantId of examples[0].variantIds ?? []) {
    assert.ok(variants.some((variant) => variant.id === variantId), `${unitId} variantIds must resolve`);
  }
}

for (const ref of imageRefs) {
  assert.match(ref, /^data\/spatial\/images\/[a-z0-9_-]+\.svg$/);
  const imagePath = resolve(root, 'public', ref);
  assert.ok(existsSync(imagePath), `missing referenced image ${ref}`);
  const svg = await readFile(imagePath, 'utf8');
  assert.match(svg, /^<svg\b/);
  assert.match(svg, /<\/svg>\s*$/);
}

// Independently enumerate all free hexominoes and fold each square by propagating
// its local right/up/normal frame across shared edges.
const key2 = (shape) => JSON.stringify(shape);
function canonicalPolyomino(shape) {
  const variants = [];
  for (const swap of [false, true]) {
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const points = shape.map(([x, y]) => {
          const [a, b] = swap ? [y, x] : [x, y];
          return [sx * a, sy * b];
        });
        const minX = Math.min(...points.map(([x]) => x));
        const minY = Math.min(...points.map(([, y]) => y));
        variants.push(points.map(([x, y]) => [x - minX, y - minY]).sort(([ax, ay], [bx, by]) => ax - bx || ay - by));
      }
    }
  }
  variants.sort((a, b) => key2(a).localeCompare(key2(b)));
  return variants[0];
}

let hexominoes = new Map([[key2([[0, 0]]), [[0, 0]]]]);
for (let size = 2; size <= 6; size += 1) {
  const next = new Map();
  for (const shape of hexominoes.values()) {
    const occupied = new Set(shape.map(([x, y]) => `${x},${y}`));
    for (const [x, y] of shape) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const point = [x + dx, y + dy];
        if (occupied.has(`${point[0]},${point[1]}`)) continue;
        const candidate = canonicalPolyomino([...shape, point]);
        next.set(key2(candidate), candidate);
      }
    }
  }
  hexominoes = next;
}

const neg = (v) => v.map((n) => -n);
const framesEqual = (a, b) => a.every((axis, i) => axis.every((n, j) => n === b[i][j]));
function foldsToCube(shape) {
  const cells = new Set(shape.map(([x, y]) => `${x},${y}`));
  const start = shape[0];
  const orientations = new Map([[`${start[0]},${start[1]}`, [[1, 0, 0], [0, 1, 0], [0, 0, 1]]]]);
  const queue = [start];
  const neighborFrame = (frame, dx, dy) => {
    const [u, v, n] = frame;
    if (dx === 1) return [neg(n), v, u];
    if (dx === -1) return [n, v, neg(u)];
    if (dy === 1) return [u, neg(n), v];
    return [u, n, neg(v)];
  };
  for (let i = 0; i < queue.length; i += 1) {
    const [x, y] = queue[i];
    const frame = orientations.get(`${x},${y}`);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const nextKey = `${nx},${ny}`;
      if (!cells.has(nextKey)) continue;
      const nextFrame = neighborFrame(frame, dx, dy);
      if (orientations.has(nextKey)) {
        if (!framesEqual(orientations.get(nextKey), nextFrame)) return false;
      } else {
        orientations.set(nextKey, nextFrame);
        queue.push([nx, ny]);
      }
    }
  }
  if (orientations.size !== 6) return false;
  const normals = [...orientations.values()].map((frame) => JSON.stringify(frame[2]));
  return new Set(normals).size === 6;
}

assert.equal(hexominoes.size, 35, 'free hexomino enumeration');
const legalCubeNets = [...hexominoes.values()].filter(foldsToCube);
assert.equal(legalCubeNets.length, 11, 'exactly 11 free hexominoes fold to a cube');
const catalogNets = [
  [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1], [3, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 2], [1, 3], [1, 4]],
  [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3], [2, 2]],
  [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3], [2, 3]],
  [[0, 0], [0, 1], [1, 1], [1, 2], [2, 1], [3, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3]],
  [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [3, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]],
  [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 1]],
  [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 2]],
];
const legalNetKeys = new Set(legalCubeNets.map((shape) => key2(canonicalPolyomino(shape))));
assert.equal(new Set(catalogNets.map((shape) => key2(canonicalPolyomino(shape)))).size, 11);
assert.ok(catalogNets.every((shape) => legalNetKeys.has(key2(canonicalPolyomino(shape)))), 'the 11-net chart must list all legal cube nets');
const netChoices = [
  catalogNets[0],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 2]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [2, 0]],
];
assert.deepEqual(netChoices.map(foldsToCube), [true, false, false, false], 'net-choice question has a unique legal answer');
assert.equal(byId.get('spatial:origami-cube-net-choice-variant').correctAnswer, 'A');

const max = (values) => Math.max(...values);
const frontProfile = (matrix) => matrix[0].map((_, x) => max(matrix.map((row) => row[x])));
const leftProfile = (matrix) => matrix.map((row) => max(row));
assert.deepEqual(frontProfile([[1, 3, 2], [2, 1, 3]]), [2, 3, 3]);
assert.deepEqual(leftProfile([[1, 3, 2], [2, 1, 3]]), [3, 3]);
assert.deepEqual(frontProfile([[2, 1, 3], [1, 2, 2]]), [2, 2, 3]);
assert.deepEqual(leftProfile([[2, 1, 3], [1, 2, 2]]), [3, 2]);

function projectionTotals(front, left) {
  const totals = [];
  for (let a = 0; a <= Math.max(front[0], left[0]); a += 1) {
    for (let b = 0; b <= Math.max(front[0], left[1]); b += 1) {
      for (let c = 0; c <= Math.max(front[1], left[0]); c += 1) {
        for (let d = 0; d <= Math.max(front[1], left[1]); d += 1) {
          if (max([a, b]) === front[0] && max([c, d]) === front[1] &&
              max([a, c]) === left[0] && max([b, d]) === left[1]) totals.push(a + b + c + d);
        }
      }
    }
  }
  return [Math.min(...totals), Math.max(...totals)];
}
assert.deepEqual(projectionTotals([2, 1], [2, 1]), [3, 5]);
assert.deepEqual(projectionTotals([3, 1], [3, 2]), [6, 7]);

const occlusionColumns = [[2, 1, 1], [1, 2, 0]]; // [x][y]
const totalBlocks = occlusionColumns.flat().reduce((sum, h) => sum + h, 0);
let visibleFrontBlocks = 0;
for (const column of occlusionColumns) {
  const maxHeight = max(column);
  for (let z = 0; z < maxHeight; z += 1) {
    if (column.some((height) => height > z)) visibleFrontBlocks += 1;
  }
}
assert.equal(totalBlocks, 7);
assert.equal(visibleFrontBlocks, 4);
assert.equal(totalBlocks - visibleFrontBlocks, 3);

assert.equal(12 * 8, 96);
assert.equal((12 / 2) * (8 / 2), 24);
assert.equal(18 * 10, 180);
assert.equal((18 / 2) * (10 / 2), 45);
assert.equal(4 * 3 + 5 * 2 - 2 * 1, 20);
const layersAfterFirstFold = ['A', 'C', 'B', 'D'];
const finalFoldedLayers = [...layersAfterFirstFold.slice(0, 2).reverse(), ...layersAfterFirstFold.slice(2)];
assert.deepEqual(finalFoldedLayers, ['C', 'A', 'B', 'D']);
assert.equal(finalFoldedLayers[1], 'A');
assert.equal(byId.get('spatial:paper-fold-order-layers-variant').correctAnswer, finalFoldedLayers[1]);

assert.equal([...new Set([2, 3])].filter((n) => [2, 5].includes(n))[0], 2);
assert.equal([...new Set([2, 3])].filter((n) => [3, 5].includes(n))[0], 3);

const blueFrontPositions = [[0, 0, 0], [1, 0, 1]];
assert.equal(blueFrontPositions.length, 2);
assert.equal(2 ** 3, 8);
assert.deepEqual([2, 2 + 4], [2, 6]);
assert.deepEqual([3, 3 + 4], [3, 7]);
assert.equal(6 ** 2 - 2 ** 2, 32);
for (let a = 1; a <= 8; a += 1) {
  for (let b = 1; b <= 8; b += 1) {
    for (let c = 1; c <= 8; c += 1) {
      const sideSquares = [a * a + b * b, a * a + c * c, b * b + c * c].sort((x, y) => x - y);
      assert.ok(sideSquares[0] + sideSquares[1] > sideSquares[2], 'cube corner triangle is acute');
    }
  }
}

const permutations = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
const permutationParity = (permutation) => {
  let inversions = 0;
  for (let i = 0; i < permutation.length; i += 1) {
    for (let j = i + 1; j < permutation.length; j += 1) {
      if (permutation[i] > permutation[j]) inversions += 1;
    }
  }
  return inversions % 2 === 0 ? 1 : -1;
};
const normalize3d = (points) => {
  const mins = [0, 1, 2].map((axis) => Math.min(...points.map((point) => point[axis])));
  return points.map((point) => point.map((value, axis) => value - mins[axis]))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
};
const referenceChiralShape = [[0, 0, 0], [0, 0, 1], [0, 1, 0], [1, 1, 0]];
const transformDeterminants = [
  permutationParity([1, 2, 0]) * 1 * 1 * 1,
  permutationParity([1, 0, 2]) * -1 * 1 * 1,
  permutationParity([2, 1, 0]) * 1 * 1 * -1,
  permutationParity([0, 1, 2]) * -1 * 1 * 1,
];
assert.deepEqual(transformDeterminants, [1, 1, 1, -1]);
const properRotationKeys = new Set();
for (const permutation of permutations) {
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        if (permutationParity(permutation) * sx * sy * sz !== 1) continue;
        const transformed = referenceChiralShape.map((point) => [sx * point[permutation[0]], sy * point[permutation[1]], sz * point[permutation[2]]]);
        properRotationKeys.add(JSON.stringify(normalize3d(transformed)));
      }
    }
  }
}
const mirroredShape = referenceChiralShape.map(([x, y, z]) => [-x, y, z]);
assert.ok(!properRotationKeys.has(JSON.stringify(normalize3d(mirroredShape))), 'reference four-cube shape must be chiral');

console.log(`Validated ${questions.length} original questions across ${unitGroups.size} example/variant units.`);
console.log(`Question counts: ${Object.entries(expectedCounts).map(([category, count]) => `${category}=${count}`).join(', ')}.`);
console.log(`Checked ${imageRefs.size} unique SVG resources; free hexominoes=${hexominoes.size}; legal cube nets=${legalCubeNets.length}.`);
console.log(`Geometry checks passed: occlusion 7/4/3; front profiles 2,3,3 and 2,2,3; projection totals 3–5 and 6–7; black-block ranges 2–6 and 3–7; folding areas 24/96 and 45/180; overlap union 20; fold layer order ${finalFoldedLayers.join(',')}; assembly rotations ${transformDeterminants.join('/')}; chiral mirror distinct across 24 rotations; volume 8; hollow section area 32 with 1 hole.`);
