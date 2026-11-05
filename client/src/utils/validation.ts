import type { LoginInput, RegisterFormValues } from '../types/auth';
import type { FarmFormValues } from '../types/farm';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** Firebase requires at least 6 characters; 8 gives farmers' accounts better protection. */
export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address, like name@example.com.';
  return undefined;
}

export function validateLogin(values: LoginInput): FieldErrors<LoginInput> {
  return {
    email: validateEmail(values.email),
    password: values.password ? undefined : 'Enter your password.',
  };
}

export function validateRegister(values: RegisterFormValues): FieldErrors<RegisterFormValues> {
  let password: string | undefined;
  if (!values.password) password = 'Create a password.';
  else if (values.password.length < PASSWORD_MIN_LENGTH)
    password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;

  let confirmPassword: string | undefined;
  if (!values.confirmPassword) confirmPassword = 'Enter your password again.';
  else if (values.confirmPassword !== values.password) confirmPassword = 'Passwords do not match.';

  return {
    fullName: values.fullName.trim() ? undefined : 'Enter your full name.',
    email: validateEmail(values.email),
    password,
    confirmPassword,
  };
}

/**
 * Farm profile input limits. These are data-quality limits, not agronomic rules, and are
 * enforced again in firestore.rules (keep both in sync).
 */
export const FARM_LIMITS = {
  nameMaxLength: 80,
  locationNameMaxLength: 100,
  /** Generous upper bound: smallholdings are usually under 20 ha. */
  maxSizeHectares: 10_000,
  maxAnimalsPerType: 100_000,
  maxCrops: 50,
  maxCropNameLength: 60,
} as const;

function validateRequiredText(value: string, emptyMessage: string, maxLength: number) {
  if (!value.trim()) return emptyMessage;
  if (value.trim().length > maxLength) return `Use ${maxLength} characters or fewer.`;
  return undefined;
}

function validateCoordinate(value: string, label: string, limit: number) {
  if (!value.trim()) return `Choose your farm on the map or enter its ${label}.`;
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number) > limit) {
    return `Enter a ${label} between -${limit} and ${limit}.`;
  }
  return undefined;
}

export function validateFarm(values: FarmFormValues): FieldErrors<FarmFormValues> {
  const size = Number(values.sizeHectares);
  let sizeHectares: string | undefined;
  if (!values.sizeHectares.trim()) sizeHectares = 'Enter the size of your farm.';
  else if (!Number.isFinite(size) || size <= 0 || size > FARM_LIMITS.maxSizeHectares)
    sizeHectares = `Enter a size between 0 and ${FARM_LIMITS.maxSizeHectares.toLocaleString()} hectares.`;

  const entries = Object.entries(values.livestock).filter(([, count]) => count !== undefined && count.trim() !== '');
  const counts = entries.map(([, count]) => count);
  const livestock = counts.every((count) => {
    const number = Number(count);
    return Number.isInteger(number) && number >= 0 && number <= FARM_LIMITS.maxAnimalsPerType;
  })
    ? undefined
    : 'Enter whole numbers of animals (0 if you do not keep that animal).';
  const hasLivestock = counts.some((count) => Number(count) > 0);

  const cropsValid =
    values.crops.length <= FARM_LIMITS.maxCrops &&
    values.crops.every((crop) => crop.trim().length > 0 && crop.trim().length <= FARM_LIMITS.maxCropNameLength);

  return {
    name: validateRequiredText(values.name, 'Enter a name for your farm.', FARM_LIMITS.nameMaxLength),
    locationName: validateRequiredText(
      values.locationName,
      'Enter the nearest town or village.',
      FARM_LIMITS.locationNameMaxLength,
    ),
    latitude: validateCoordinate(values.latitude, 'latitude', 90),
    longitude: validateCoordinate(values.longitude, 'longitude', 180),
    sizeHectares,
    crops: !cropsValid
      ? `Add up to ${FARM_LIMITS.maxCrops} crop names, with no name longer than ${FARM_LIMITS.maxCropNameLength} characters.`
      : values.crops.length > 0 || hasLivestock
        ? undefined
        : 'Select or add at least one crop, or enter the animals you keep, so we can tailor your advice.',
    livestock,
  };
}
