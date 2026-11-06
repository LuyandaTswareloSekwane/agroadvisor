import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const candidates = [
  ['farm-layout', 'Farm layout', 'PLANNING YOUR HOMESTEAD LAYOUT | Using GOOGLE EARTH', 'ghmRXT4_osE', 399, 'Fuller Farms TX'],
  ['fencing', 'Fencing', 'Livestock Cattle Panel Fence Installation', 'cvmYJ3obUds', 131, 'One Man Fencing'],
  ['garden-planning', 'Garden planning', 'Planning a Vegetable Garden for Beginners: The 5 Golden Rules', '9R-utqpmwmE', 305, 'GrowVeg'],
  ['small-farm-business', 'Small-farm business', 'Vegetable Farming Business in South Africa: How to Start and Grow Successfully', 'JuphSL52GuM', 343, 'Douw Steyn'],
  ['frost-protection', 'Frost protection', 'Extend Your Garden Season with Interplanting and Frost Protection', '13WRqaZzktY', 276, 'Virginia Farm Bureau'],
  ['heat-protection', 'Heat protection', 'How Shade Cloth Can Save Your Cool Season Crops', 'FVjtJ2k02Cc', 301, 'OklahomaGardening'],
];

export function lessonDrafts() {
  return candidates.map(([topicId, topicLabel, title, youtubeId, durationSeconds, sourceChannel]) => ({
    topicId, topicLabel, title, youtubeId, durationSeconds, sourceChannel,
    language: '',
    summary: '',
    keySteps: [],
    visualOnly: null,
    fallbackPriority: null,
    reviewed: false,
    published: false,
  }));
}

export function parseArguments(args) {
  if (args.length !== 4 || args[0] !== '--project' || args[2] !== '--confirm-fresh-project') {
    throw new Error('Usage: npm run seed:lessons -- --project PROJECT_ID --confirm-fresh-project PROJECT_ID');
  }
  const projectId = args[1];
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId) || projectId !== args[3]) {
    throw new Error('Provide a valid Firebase project ID and repeat it exactly for --confirm-fresh-project.');
  }
  return projectId;
}

/** Create all six documents atomically, failing rather than replacing an existing document. */
export async function seedLessons(db) {
  const batch = db.batch();
  for (const draft of lessonDrafts()) {
    batch.create(db.collection('lessons').doc(draft.youtubeId), draft);
  }
  await batch.commit();
}

async function main() {
  const projectId = parseArguments(process.argv.slice(2));
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST is set. Unset it before targeting the selected Firebase project.');
  }
  const { applicationDefault, initializeApp, deleteApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const app = initializeApp({ credential: applicationDefault(), projectId });
  try {
    console.log(`Creating six unpublished, unreviewed drafts in project "${projectId}".`);
    await seedLessons(getFirestore(app));
    console.log('Created all six drafts. None are reviewed or published.');
  } finally {
    await deleteApp(app);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Lesson seed failed: ${error.message}`);
    console.error('No existing lesson document is overwritten. Check the project, ADC permissions, and existing document IDs before retrying.');
    process.exitCode = 1;
  });
}
