import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { lessonDrafts, parseArguments, seedLessons } from './seed-lessons.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));

test('all six candidates contain only known metadata and intentionally incomplete drafts', () => {
  const drafts = lessonDrafts();
  assert.deepEqual(drafts.map(({ youtubeId, durationSeconds }) => [youtubeId, durationSeconds]), [
    ['ghmRXT4_osE', 399], ['cvmYJ3obUds', 131], ['9R-utqpmwmE', 305],
    ['JuphSL52GuM', 343], ['13WRqaZzktY', 276], ['FVjtJ2k02Cc', 301],
  ]);
  assert.deepEqual(drafts.map(({ title, sourceChannel }) => [title, sourceChannel]), [
    ['PLANNING YOUR HOMESTEAD LAYOUT | Using GOOGLE EARTH', 'Fuller Farms TX'],
    ['Livestock Cattle Panel Fence Installation', 'One Man Fencing'],
    ['Planning a Vegetable Garden for Beginners: The 5 Golden Rules', 'GrowVeg'],
    ['Vegetable Farming Business in South Africa: How to Start and Grow Successfully', 'Douw Steyn'],
    ['Extend Your Garden Season with Interplanting and Frost Protection', 'Virginia Farm Bureau'],
    ['How Shade Cloth Can Save Your Cool Season Crops', 'OklahomaGardening'],
  ]);
  assert.equal(new Set(drafts.map(({ youtubeId }) => youtubeId)).size, 6);
  for (const draft of drafts) {
    assert.equal(draft.reviewed, false);
    assert.equal(draft.published, false);
    assert.equal(draft.language, '');
    assert.equal(draft.summary, '');
    assert.deepEqual(draft.keySteps, []);
    assert.equal(draft.visualOnly, null);
    assert.equal(draft.fallbackPriority, null);
    assert.match(draft.topicId, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(draft.title && draft.topicLabel && draft.sourceChannel);
  }
});

test('project selection requires an explicit matching fresh-project confirmation', () => {
  assert.equal(parseArguments(['--project', 'fresh-farm-123', '--confirm-fresh-project', 'fresh-farm-123']), 'fresh-farm-123');
  for (const args of [
    [], ['--project', 'fresh-farm-123'],
    ['--project', 'fresh-farm-123', '--confirm-fresh-project', 'other-project'],
    ['--project', 'Bad Project', '--confirm-fresh-project', 'Bad Project'],
    ['--project', 'fresh-farm-123', '--confirm-fresh-project', 'fresh-farm-123', '--extra'],
  ]) assert.throws(() => parseArguments(args));
});

test('seed uses one atomic create-only batch with deterministic document IDs', async () => {
  const calls = [];
  let commits = 0;
  const db = {
    collection(name) {
      assert.equal(name, 'lessons');
      return { doc: (id) => ({ id }) };
    },
    batch() {
      return {
        create(ref, data) { calls.push({ ref, data }); },
        async commit() { commits += 1; },
      };
    },
  };
  await seedLessons(db);
  assert.equal(commits, 1);
  assert.deepEqual(calls.map(({ ref }) => ref.id), lessonDrafts().map(({ youtubeId }) => youtubeId));
  assert.deepEqual(calls.map(({ data }) => data), lessonDrafts());
});

test('installed Firebase Admin supports the seed imports and create-only batch API', async () => {
  const { applicationDefault, initializeApp, deleteApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  assert.equal(typeof applicationDefault, 'function');
  const app = initializeApp({ projectId: 'fresh-farm-123' }, 'seed-api-test');
  try {
    const db = getFirestore(app);
    const batch = db.batch();
    assert.equal(typeof batch.create, 'function');
    assert.equal(typeof batch.commit, 'function');
    batch.create(db.collection('lessons').doc('ghmRXT4_osE'), lessonDrafts()[0]);
  } finally {
    await deleteApp(app);
  }
});

test('existing-document and other commit errors are propagated, not retried as overwrites', async () => {
  let createCount = 0;
  let commitCount = 0;
  const failure = new Error('ALREADY_EXISTS');
  const db = {
    collection: () => ({ doc: (id) => ({ id }) }),
    batch: () => ({
      create: () => { createCount += 1; },
      commit: async () => { commitCount += 1; throw failure; },
    }),
  };
  await assert.rejects(seedLessons(db), (error) => error === failure);
  assert.equal(createCount, 6);
  assert.equal(commitCount, 1);
});

test('CLI fails before initializing Firebase when selection is missing or emulator is set', () => {
  const missing = spawnSync(process.execPath, ['seed-lessons.mjs'], { cwd: scriptDirectory, encoding: 'utf8' });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Usage:/);
  const emulator = spawnSync(process.execPath, [
    'seed-lessons.mjs', '--project', 'fresh-farm-123', '--confirm-fresh-project', 'fresh-farm-123',
  ], { cwd: scriptDirectory, encoding: 'utf8', env: { ...process.env, FIRESTORE_EMULATOR_HOST: 'localhost:8080' } });
  assert.equal(emulator.status, 1);
  assert.match(emulator.stderr, /FIRESTORE_EMULATOR_HOST/);
});
