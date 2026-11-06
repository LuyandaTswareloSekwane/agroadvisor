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
  assertSucceeds,
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

test('farm owner can save a realistically sized JPEG and other users cannot modify it', async () => {
  const owner = testEnvironment.authenticatedContext('photo-owner').firestore();
  const farm = doc(owner, 'farms', 'photo-owner');
  await assertSucceeds(setDoc(farm, {
    ownerId: 'photo-owner',
    name: 'Test farm',
    locationName: 'Musina',
    location: { latitude: -22.34, longitude: 30.04 },
    sizeHectares: 5,
    crops: ['maize'],
    livestock: {},
    photoDataUrl: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  const photo = 'data:image/jpeg;base64,' + 'A'.repeat(90_000);
  await assertSucceeds(updateDoc(farm, { photoDataUrl: photo, updatedAt: serverTimestamp() }));
  assert.equal((await getDoc(farm)).data().photoDataUrl, photo);
  await assertFails(updateDoc(farm, {
    photoDataUrl: 'data:image/jpeg;base64,' + 'A'.repeat(100_000),
    updatedAt: serverTimestamp(),
  }));
  await assertFails(updateDoc(farm, {
    photoDataUrl: 'data:image/png;base64,AAAA',
    updatedAt: serverTimestamp(),
  }));
  const other = testEnvironment.authenticatedContext('other').firestore();
  await assertFails(updateDoc(doc(other, 'farms', 'photo-owner'), {
    photoDataUrl: null,
    updatedAt: serverTimestamp(),
  }));
});

test('farmer profiles can only be read, created, updated, or deleted by their owner', async () => {
  const owner = testEnvironment.authenticatedContext('profile-owner', {
    email: 'owner@example.com',
  }).firestore();
  const profile = doc(owner, 'farmers', 'profile-owner');
  await assertSucceeds(setDoc(profile, {
    uid: 'profile-owner',
    fullName: 'Profile Owner',
    email: 'owner@example.com',
    createdAt: serverTimestamp(),
  }));
  await assertSucceeds(getDoc(profile));

  const other = testEnvironment.authenticatedContext('other-profile-user', {
    email: 'other@example.com',
  }).firestore();
  const otherView = doc(other, 'farmers', 'profile-owner');
  await assertFails(getDoc(otherView));
  await assertFails(setDoc(otherView, {
    uid: 'profile-owner',
    fullName: 'Changed by another user',
    email: 'owner@example.com',
    createdAt: serverTimestamp(),
  }));
  await assertFails(updateDoc(otherView, { fullName: 'Changed by another user' }));
  await assertFails(deleteDoc(otherView));
});

test('farm and memory data are private to the owning farmer', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, 'farms', 'farm-owner'), { name: 'Owner farm' });
    await setDoc(doc(firestore, 'farms', 'farm-owner', 'memory', 'entry-one'), {
      type: 'success',
      title: 'First harvest',
      note: '',
      occurredAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    });
  });

  const owner = testEnvironment.authenticatedContext('farm-owner').firestore();
  const other = testEnvironment.authenticatedContext('other-farmer').firestore();
  await assertSucceeds(getDoc(doc(owner, 'farms', 'farm-owner')));
  await assertSucceeds(getDoc(doc(owner, 'farms', 'farm-owner', 'memory', 'entry-one')));
  await assertFails(getDoc(doc(other, 'farms', 'farm-owner')));
  await assertFails(getDoc(doc(other, 'farms', 'farm-owner', 'memory', 'entry-one')));
  await assertFails(deleteDoc(doc(other, 'farms', 'farm-owner', 'memory', 'entry-one')));
});

test('only reviewed and published lessons are readable, and farmers cannot write lessons', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, 'lessons', 'published-reviewed'), {
      reviewed: true,
      published: true,
      title: 'Planting',
    });
    await setDoc(doc(firestore, 'lessons', 'unreviewed'), {
      reviewed: false,
      published: true,
      title: 'Draft',
    });
    await setDoc(doc(firestore, 'lessons', 'unpublished'), {
      reviewed: true,
      published: false,
      title: 'Not published',
    });
  });

  const farmer = testEnvironment.authenticatedContext('farmer').firestore();
  await assertSucceeds(getDoc(doc(farmer, 'lessons', 'published-reviewed')));
  await assertFails(getDoc(doc(farmer, 'lessons', 'unreviewed')));
  await assertFails(getDoc(doc(farmer, 'lessons', 'unpublished')));
  await assertFails(setDoc(doc(farmer, 'lessons', 'farmer-created'), {
    reviewed: true,
    published: true,
  }));
  await assertFails(updateDoc(doc(farmer, 'lessons', 'published-reviewed'), {
    title: 'Changed by farmer',
  }));
  await assertFails(deleteDoc(doc(farmer, 'lessons', 'published-reviewed')));
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

async function seedFarm(uid, location) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'farms', uid), { location });
  });
}

function communityNote(authorId, location) {
  return {
    type: 'frost',
    details: '',
    location,
    authorId,
    status: 'visible',
    reportCount: 0,
    createdAt: serverTimestamp(),
  };
}

test('a farmer may create a community note within 25 km of their own farm', async () => {
  await seedFarm('nearby-farmer', { latitude: -29, longitude: 24 });
  const firestore = testEnvironment.authenticatedContext('nearby-farmer').firestore();

  await assertSucceeds(setDoc(
    doc(firestore, 'communityObservations', 'nearby-note'),
    communityNote('nearby-farmer', { latitude: -28.78, longitude: 24 }),
  ));
});

test('BR-06 accepts a note exactly at the conservative 25 km boundary', async () => {
  await seedFarm('boundary-farmer', { latitude: -29, longitude: 24 });
  const firestore = testEnvironment.authenticatedContext('boundary-farmer').firestore();
  const boundaryLatitude = -29 + 25_000 / 112_000;

  await assertSucceeds(setDoc(
    doc(firestore, 'communityObservations', 'boundary-note'),
    communityNote('boundary-farmer', { latitude: boundaryLatitude, longitude: 24 }),
  ));
});

test('BR-06 rejects a note over 25 km away and prevents using another farmer farm location', async () => {
  await seedFarm('local-farmer', { latitude: -29, longitude: 24 });
  await seedFarm('remote-farmer', { latitude: -22, longitude: 30 });
  const firestore = testEnvironment.authenticatedContext('local-farmer').firestore();

  await assertFails(setDoc(
    doc(firestore, 'communityObservations', 'too-far'),
    communityNote('local-farmer', { latitude: -28.77, longitude: 24 }),
  ));
  await assertFails(setDoc(
    doc(firestore, 'communityObservations', 'using-remote-farm'),
    communityNote('local-farmer', { latitude: -22, longitude: 30 }),
  ));
});

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

test('community report documents can only be read or written by their reporter', async () => {
  await seedObservation();
  assert.equal(await reportObservation('report-owner'), true);

  const owner = testEnvironment.authenticatedContext('report-owner').firestore();
  const report = doc(owner, 'communityReports', 'report-owner', 'reports', observationId);
  await assertSucceeds(getDoc(report));

  const other = testEnvironment.authenticatedContext('other-reporter').firestore();
  const otherView = doc(other, 'communityReports', 'report-owner', 'reports', observationId);
  await assertFails(getDoc(otherView));
  await assertFails(setDoc(otherView, {
    observationId,
    createdAt: serverTimestamp(),
  }));
  await assertFails(updateDoc(otherView, { observationId }));
  await assertFails(deleteDoc(otherView));
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
