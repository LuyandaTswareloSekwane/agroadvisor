/** Bindings available to the Worker (vars from wrangler.jsonc / .dev.vars, and secrets). */
export interface Env {
  ALLOWED_ORIGIN: string;
  FIREBASE_PROJECT_ID?: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  GEMINI_API_KEY?: string;
  AZURE_SPEECH_KEY?: string;
  AZURE_SPEECH_REGION?: string;
}

export interface FirebaseUser {
  uid: string;
  email?: string;
}

/** Hono generic for this app, so `c.env` is typed everywhere. */
export interface AppEnv {
  Bindings: Env;
  Variables: {
    firebaseUser: FirebaseUser;
  };
}
