import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiResponse } from '../types/api';

/** Send a successful response in the standard { success, data, message } shape. */
export function ok<T>(c: Context, data: T, message = 'OK', status: ContentfulStatusCode = 200) {
  const body: ApiResponse<T> = { success: true, data, message };
  return c.json(body, status);
}

/** Send an error response in the standard { success, data, message } shape. */
export function fail(c: Context, message: string, status: ContentfulStatusCode = 400) {
  const body: ApiResponse<null> = { success: false, data: null, message };
  return c.json(body, status);
}
