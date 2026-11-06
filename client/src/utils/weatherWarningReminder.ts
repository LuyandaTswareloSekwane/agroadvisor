import type { FarmLocation } from '../types/farm';

export const WARNING_REMINDER_MS = 60 * 60 * 1000;

export interface WarningDismissal {
  location: string;
  alertId: string;
  remindAt: number;
}

export function warningLocationKey(location: FarmLocation): string {
  return JSON.stringify([location.latitude, location.longitude]);
}

export function readWarningDismissal(
  stored: string | null,
  location: string,
  now: number,
): WarningDismissal | null {
  if (!stored) return null;
  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch {
    return null;
  }
  if (
    typeof value !== 'object' || value === null ||
    !('location' in value) || value.location !== location ||
    !('alertId' in value) || typeof value.alertId !== 'string' || !value.alertId ||
    !('remindAt' in value) || typeof value.remindAt !== 'number' ||
    !Number.isFinite(value.remindAt) || value.remindAt <= now
  ) return null;
  return { location, alertId: value.alertId, remindAt: value.remindAt };
}
