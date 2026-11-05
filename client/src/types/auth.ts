/** The signed-in farmer, reduced to the fields the app uses. */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export type AuthProviderName = 'google' | 'microsoft';

/** Registration form fields: the input plus a confirmation that never leaves the form. */
export interface RegisterFormValues extends RegisterInput {
  confirmPassword: string;
}
