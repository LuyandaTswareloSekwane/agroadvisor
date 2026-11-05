import type { ApiResponse } from '../types/api';
import { auth } from '../config/firebase';

const workerUrl = import.meta.env.VITE_WORKER_URL?.trim().replace(/\/+$/, '') ?? '';

export class WorkerApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'WorkerApiError';
  }
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof value.success === 'boolean' &&
    'data' in value &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

/** Sends an authenticated request to an AgroAdvisor Worker API route. */
export async function requestWorker<T>(
  path: `/api/${string}`,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const user = auth?.currentUser;
  if (!user) {
    throw new WorkerApiError('Sign in before calling the AgroAdvisor API.', 401);
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${workerUrl}${path}`, { ...init, headers });
  } catch (error) {
    throw new WorkerApiError(
      error instanceof Error ? `Could not reach the AgroAdvisor API: ${error.message}` : 'Could not reach the AgroAdvisor API.',
      0,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WorkerApiError('The AgroAdvisor API returned an invalid response.', response.status);
  }

  if (!isApiResponse(payload)) {
    throw new WorkerApiError('The AgroAdvisor API returned an invalid response.', response.status);
  }
  if (!response.ok || !payload.success) {
    throw new WorkerApiError(payload.message, response.status);
  }

  return payload as ApiResponse<T>;
}
