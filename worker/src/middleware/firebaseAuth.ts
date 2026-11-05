import { createRemoteJWKSet, errors, jwtVerify } from 'jose';
import type { MiddlewareHandler } from 'hono';
import { fail } from '../lib/response';
import type { AppEnv } from '../types/env';

const firebaseJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

/** Verifies a Firebase ID token and exposes its authenticated UID to protected routes. */
export const requireFirebaseAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const projectId = c.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error('FIREBASE_PROJECT_ID is not configured for the Worker.');
    return fail(c, 'Authentication is not configured', 500);
  }

  const authorization = c.req.header('Authorization');
  const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) {
    return fail(c, 'A valid Firebase ID token is required', 401);
  }

  try {
    const { payload } = await jwtVerify(token, firebaseJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      return fail(c, 'The Firebase ID token has no user identifier', 401);
    }

    c.set('firebaseUser', {
      uid: payload.sub,
      ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
    });
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      return fail(c, 'The Firebase ID token is invalid or expired', 401);
    }
    console.error('Firebase token verification failed:', error);
    return fail(c, 'Authentication could not be verified', 503);
  }

  await next();
};
