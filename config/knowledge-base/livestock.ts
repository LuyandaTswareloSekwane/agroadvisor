/**
 * Livestock catalogue: the animals a farmer can select on their farm profile.
 *
 * Covers the livestock most commonly kept by South African smallholders. Each type's
 * weather-risk thresholds (heat stress, cold stress, etc.) are added here in the
 * knowledge-base module.
 *
 * Farmers can also add custom livestock names in the same field; those names receive
 * general weather advice until specific agronomic rules are added.
 */
export const LIVESTOCK = [
  { id: 'cattle', label: 'Cattle' },
  { id: 'sheep', label: 'Sheep' },
  { id: 'goats', label: 'Goats' },
  { id: 'pigs', label: 'Pigs' },
  { id: 'poultry', label: 'Poultry' },
] as const;

export type LivestockId = (typeof LIVESTOCK)[number]['id'];
