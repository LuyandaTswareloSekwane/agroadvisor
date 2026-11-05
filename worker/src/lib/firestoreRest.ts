import type { Env } from '../types/env';

export type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { referenceValue: string }
  | { bytesValue: string }
  | { geoPointValue: { latitude: number; longitude: number } }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

export interface FirestoreDocument {
  name?: string;
  fields: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

export interface FirestoreListResult {
  documents: FirestoreDocument[];
  nextPageToken?: string;
}

export interface FirestoreAuth {
  kind: 'user' | 'service-account';
  accessToken: string;
}

export interface FirestoreListOptions {
  pageSize?: number;
  pageToken?: string;
}

export class FirestoreRestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'FirestoreRestError';
  }
}

export interface FirestoreStructuredQuery {
  from: Array<{ collectionId: string; allDescendants?: boolean }>;
  select?: { fields: Array<{ fieldPath: string }> };
  where?: Record<string, unknown>;
  orderBy?: Array<Record<string, unknown>>;
  startAt?: Record<string, unknown>;
  endAt?: Record<string, unknown>;
  offset?: number;
  limit?: number;
}

const FIRESTORE_API = 'https://firestore.googleapis.com/v1';

function encodeDocumentPath(path: string): string {
  const segments = path.split('/');
  if (!path.trim() || segments.some((segment) => !segment)) {
    throw new Error('A Firestore document or collection path must not be empty or contain empty segments.');
  }
  return segments.map(encodeURIComponent).join('/');
}

function documentsUrl(env: Env, path = ''): string {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID is not configured for the Worker.');
  }

  const base = `${FIRESTORE_API}/projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents`;
  return path ? `${base}/${encodeDocumentPath(path)}` : base;
}

async function firestoreRequest<T>(
  url: string,
  auth: FirestoreAuth,
  init: RequestInit = {},
): Promise<T> {
  if (!auth.accessToken.trim()) {
    throw new Error('A Firestore access token is required.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${auth.accessToken}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers });
  const responseText = await response.text();
  if (!response.ok) {
    throw new FirestoreRestError(
      `Firestore REST API returned ${response.status}: ${responseText || response.statusText}`,
      response.status,
    );
  }
  if (!responseText) {
    throw new Error('Firestore REST API returned an empty response.');
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error('Firestore REST API returned invalid JSON.');
  }
}

export function getDocument(
  env: Env,
  auth: FirestoreAuth,
  documentPath: string,
): Promise<FirestoreDocument> {
  return firestoreRequest(documentsUrl(env, documentPath), auth);
}

export function listDocuments(
  env: Env,
  auth: FirestoreAuth,
  collectionPath: string,
  options: FirestoreListOptions = {},
): Promise<FirestoreListResult> {
  const url = new URL(documentsUrl(env, collectionPath));
  if (options.pageSize !== undefined) {
    url.searchParams.set('pageSize', String(options.pageSize));
  }
  if (options.pageToken) {
    url.searchParams.set('pageToken', options.pageToken);
  }
  return firestoreRequest<unknown>(url.toString(), auth).then((result) => {
    if (typeof result !== 'object' || result === null) {
      throw new Error('Firestore returned an invalid document list.');
    }
    const data = result as { documents?: unknown; nextPageToken?: unknown };
    if (data.documents !== undefined && !Array.isArray(data.documents)) {
      throw new Error('Firestore returned an invalid document list.');
    }
    if (data.nextPageToken !== undefined && typeof data.nextPageToken !== 'string') {
      throw new Error('Firestore returned an invalid pagination token.');
    }
    return {
      documents: (data.documents ?? []) as FirestoreDocument[],
      ...(data.nextPageToken ? { nextPageToken: data.nextPageToken } : {}),
    };
  });
}

export function createDocument(
  env: Env,
  auth: FirestoreAuth,
  collectionPath: string,
  document: FirestoreDocument,
  documentId?: string,
): Promise<FirestoreDocument> {
  const url = new URL(documentsUrl(env, collectionPath));
  if (documentId) {
    url.searchParams.set('documentId', documentId);
  }
  return firestoreRequest(url.toString(), auth, {
    method: 'POST',
    body: JSON.stringify(document),
  });
}

export function updateDocument(
  env: Env,
  auth: FirestoreAuth,
  documentPath: string,
  document: FirestoreDocument,
  updateMask?: string[],
): Promise<FirestoreDocument> {
  const url = new URL(documentsUrl(env, documentPath));
  for (const fieldPath of updateMask ?? []) {
    url.searchParams.append('updateMask.fieldPaths', fieldPath);
  }
  return firestoreRequest(url.toString(), auth, {
    method: 'PATCH',
    body: JSON.stringify(document),
  });
}

export function queryDocuments(
  env: Env,
  auth: FirestoreAuth,
  query: FirestoreStructuredQuery,
): Promise<unknown[]> {
  return firestoreRequest<unknown>(`${documentsUrl(env)}:runQuery`, auth, {
    method: 'POST',
    body: JSON.stringify({ structuredQuery: query }),
  }).then((result) => {
    if (!Array.isArray(result)) {
      throw new Error('Firestore returned an invalid query response.');
    }
    return result;
  });
}
