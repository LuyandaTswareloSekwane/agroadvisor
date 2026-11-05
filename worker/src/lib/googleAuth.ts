import type { Env } from '../types/env';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';
const TOKEN_LIFETIME_SECONDS = 3600;
const TOKEN_REFRESH_BUFFER_SECONDS = 60;

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;
let pendingToken: Promise<string> | null = null;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function encodeJson(value: object): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodePrivateKey(pem: string): Uint8Array {
  const encoded = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  if (!encoded) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is empty.');
  }

  const binary = atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function isTokenResponse(value: unknown): value is { access_token: string; expires_in: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'access_token' in value &&
    typeof value.access_token === 'string' &&
    'expires_in' in value &&
    typeof value.expires_in === 'number'
  );
}

async function requestAccessToken(env: Env): Promise<string> {
  const serviceAccountEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyPem = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!serviceAccountEmail || !privateKeyPem) {
    throw new Error('Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in Worker secrets.');
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: 'RS256', typ: 'JWT' });
  const claims = encodeJson({
    iss: serviceAccountEmail,
    scope: FIRESTORE_SCOPE,
    aud: TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + TOKEN_LIFETIME_SECONDS,
  });
  const unsignedAssertion = `${header}.${claims}`;
  const signingKey = await crypto.subtle.importKey(
    'pkcs8',
    decodePrivateKey(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signingKey,
    new TextEncoder().encode(unsignedAssertion),
  );
  const assertion = `${unsignedAssertion}.${toBase64Url(new Uint8Array(signature))}`;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || !isTokenResponse(body)) {
    console.error('Google OAuth token request failed:', response.status, body);
    throw new Error('Could not obtain a Google service-account access token.');
  }

  cachedToken = {
    accessToken: body.access_token,
    expiresAt: Date.now() + Math.max(0, body.expires_in - TOKEN_REFRESH_BUFFER_SECONDS) * 1000,
  };
  return body.access_token;
}

/** Exchanges a service-account key for a cached Firestore OAuth access token. */
export async function getServiceAccountAccessToken(env: Env): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }
  if (!pendingToken) {
    pendingToken = requestAccessToken(env).finally(() => {
      pendingToken = null;
    });
  }
  return pendingToken;
}
