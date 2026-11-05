/** Where farmers land after signing in when they were not sent from a protected page. */
export const DEFAULT_SIGNED_IN_PATH = '/dashboard';

/** Router state set by ProtectedRoute so login can return the farmer to the page they wanted. */
export interface RedirectState {
  from: string;
}

export function getRedirectPath(state: unknown): string {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'string' &&
    state.from.startsWith('/')
  ) {
    return state.from;
  }
  return DEFAULT_SIGNED_IN_PATH;
}
