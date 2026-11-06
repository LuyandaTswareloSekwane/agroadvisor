import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  identifyFarmImage,
  InvalidVisionInputError,
  VisionProviderError,
} from '../../worker/src/services/visionService';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function imageResult(overrides: Record<string, unknown> = {}) {
  return {
    steps: [{
      type: 'model_output',
      content: [{
        text: JSON.stringify({
          itemName: 'maize',
          confidence: 0.9,
          alternatives: [],
          localName: '',
          isRelevant: true,
          ...overrides,
        }),
      }],
    }],
  };
}

function setSuccessfulResponse(body: unknown) {
  globalThis.fetch = async () => new Response(JSON.stringify(body), { status: 200 });
}

test('BR-09 accepts JPEG, PNG and WebP files up to the 6 MB limit', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify(imageResult()), { status: 200 });
  const env = { GEMINI_API_KEY: 'test-key' } as Parameters<typeof identifyFarmImage>[0];

  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    const file = new File([new Uint8Array([1])], 'farm-image', { type });
    const result = await identifyFarmImage(env, file, 'crop_product');
    assert.equal(result.status, 'identified', type);
  }

  const limitSizedFile = new File([new Uint8Array(6 * 1024 * 1024)], 'limit.jpg', { type: 'image/jpeg' });
  assert.equal((await identifyFarmImage(env, limitSizedFile, 'livestock')).status, 'identified');
});

test('BR-09 rejects empty, unsupported and larger-than-6-MB images before making a provider request', async () => {
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify(imageResult()), { status: 200 });
  };
  const env = { GEMINI_API_KEY: 'test-key' } as Parameters<typeof identifyFarmImage>[0];

  const invalidFiles = [
    new File([], 'empty.jpg', { type: 'image/jpeg' }),
    new File([new Uint8Array([1])], 'text.txt', { type: 'text/plain' }),
    new File([new Uint8Array(6 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' }),
  ];
  for (const file of invalidFiles) {
    await assert.rejects(
      identifyFarmImage(env, file, 'crop_product'),
      InvalidVisionInputError,
    );
  }
  assert.equal(fetchCalls, 0);
});

test('BR-09 maps confidence below 0.5 to unknown, 0.5-0.79 to uncertain and 0.8+ to identified', async () => {
  const env = { GEMINI_API_KEY: 'test-key' } as Parameters<typeof identifyFarmImage>[0];
  const image = new File([new Uint8Array([1])], 'crop.jpg', { type: 'image/jpeg' });

  setSuccessfulResponse(imageResult({ confidence: 0.49 }));
  assert.deepEqual(await identifyFarmImage(env, image, 'crop_product'), {
    status: 'unknown',
    itemName: null,
    confidence: 0.49,
    alternatives: [],
  });

  setSuccessfulResponse(imageResult({ confidence: 0.5, alternatives: ['sorghum'] }));
  assert.deepEqual(await identifyFarmImage(env, image, 'crop_product'), {
    status: 'uncertain',
    itemName: 'maize',
    confidence: 0.5,
    alternatives: ['sorghum'],
    localName: null,
  });

  setSuccessfulResponse(imageResult({ confidence: 0.79 }));
  assert.equal((await identifyFarmImage(env, image, 'livestock')).status, 'uncertain');
  setSuccessfulResponse(imageResult({ confidence: 0.8 }));
  assert.equal((await identifyFarmImage(env, image, 'livestock')).status, 'identified');
});

test('BR-09 returns unknown for irrelevant images and rejects malformed provider results', async () => {
  const env = { GEMINI_API_KEY: 'test-key' } as Parameters<typeof identifyFarmImage>[0];
  const image = new File([new Uint8Array([1])], 'photo.jpg', { type: 'image/jpeg' });

  setSuccessfulResponse(imageResult({ isRelevant: false }));
  assert.equal((await identifyFarmImage(env, image, 'crop_product')).status, 'unknown');

  setSuccessfulResponse(imageResult({ confidence: 1.1 }));
  await assert.rejects(
    identifyFarmImage(env, image, 'crop_product'),
    VisionProviderError,
  );
});
