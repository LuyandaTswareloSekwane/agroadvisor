/**
 * Crop catalogue: the crops a farmer can select on their farm profile.
 *
 * Chosen for South African smallholder farming systems (field crops plus common
 * vegetables grown for household use and local markets). Each crop's weather-risk
 * thresholds are added here in the knowledge-base module, so a crop and its rules
 * live in one place.
 *
 * Built-in crop ids are stored in Firestore. Farmers can also store their own crop/product
 * names in the same field; those names receive general weather advice until rules are added.
 */
export const CROPS = [
  { id: 'maize', label: 'Maize' },
  { id: 'sorghum', label: 'Sorghum' },
  { id: 'wheat', label: 'Wheat' },
  { id: 'dry-beans', label: 'Dry beans' },
  { id: 'groundnuts', label: 'Groundnuts' },
  { id: 'sunflower', label: 'Sunflower' },
  { id: 'potatoes', label: 'Potatoes' },
  { id: 'tomatoes', label: 'Tomatoes' },
  { id: 'cabbage', label: 'Cabbage' },
  { id: 'spinach', label: 'Spinach' },
  { id: 'pumpkin', label: 'Pumpkin and butternut' },
  { id: 'onions', label: 'Onions' },
] as const;

export type CropId = string;
