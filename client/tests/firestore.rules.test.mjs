import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import {
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  assertFails,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';

const projectId = 'demo-agroadvisor';
const observationId = 'test-observation';
let testEnvironment;

before(async () => {
  const rules = await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8');
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
});

after(async () => {
  await testEnvironment.cleanup();
});

async function seedObservation(authorId = 'author') {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, 'farms', authorId), {
      location: { latitude: -29, longitude: 24 },
    });
    await setDoc(doc(firestore, 'communityObservations', observationId), {
      type: 'frost',
      details: '',
      location: { latitude: -29, longitude: 24 },
      authorId,
      status: 'visible',
      reportCount: 0,
      createdAt: Timestamp.now(),
    });
  });
}

async function reportObservation(reporterId) {
  const firestore = testEnvironment.authenticatedContext(reporterId).firestore();
  const observation = doc(firestore, 'communityObservations', observationId);
  const report = doc(firestore, 'communityReports', reporterId, 'reports', observationId);

  return runTransaction(firestore, async (transaction) => {
    const reportSnapshot = await transaction.get(report);
    if (reportSnapshot.exists()) return false;

    const observationSnapshot = await transaction.get(observation);
    if (!observationSnapshot.exists()) throw new Error('Observation does not exist');

    const currentCount = observationSnapshot.data().reportCount;
    const nextCount = currentCount + 1;
    transaction.set(report, {
      observationId,
      createdAt: serverTimestamp(),
    });
    transaction.update(observation, {
      reportCount: nextCount,
      status: nextCount >= 2 ? 'hidden' : 'visible',
    });
    return true;
  });
}

test('a farmer cannot report the same observation twice', async () => {
  await seedObservation();

  assert.equal(await reportObservation('farmer-one'), true);
  assert.equal(await reportObservation('farmer-one'), false);

  const firestore = testEnvironment.authenticatedContext('farmer-one').firestore();
  const report = doc(firestore, 'communityReports', 'farmer-one', 'reports', observationId);
  await assertFails(setDoc(report, {
    observationId,
    createdAt: serverTimestamp(),
  }));
  const savedObservation = await getDoc(doc(firestore, 'communityObservations', observationId));
  assert.equal(savedObservation.data().reportCount, 1);
});

test('a direct report-count edit without a matching report is rejected', async () => {
  await seedObservation();
  const firestore = testEnvironment.authenticatedContext('farmer-one').firestore();

  await assertFails(updateDoc(doc(firestore, 'communityObservations', observationId), {
    reportCount: 1,
  }));
});

test('a report document without its matching count update is rejected', async () => {
  await seedObservation();
  const firestore = testEnvironment.authenticatedContext('farmer-one').firestore();

  await assertFails(setDoc(
    doc(firestore, 'communityReports', 'farmer-one', 'reports', observationId),
    { observationId, createdAt: serverTimestamp() },
  ));
});

test('a second distinct farmer report hides the observation', async () => {
  await seedObservation();

  assert.equal(await reportObservation('farmer-one'), true);
  assert.equal(await reportObservation('farmer-two'), true);

  const firestore = testEnvironment.authenticatedContext('author').firestore();
  const observation = await getDoc(doc(firestore, 'communityObservations', observationId));
  assert.equal(observation.data().reportCount, 2);
  assert.equal(observation.data().status, 'hidden');
});

test('an observation author cannot report their own observation', async () => {
  await seedObservation();

  await assert.rejects(reportObservation('author'));
});

test('an unrelated farmer cannot delete another farmer observation', async () => {
  await seedObservation();
  const firestore = testEnvironment.authenticatedContext('farmer-one').firestore();

  await assertFails(deleteDoc(doc(firestore, 'communityObservations', observationId)));
});
