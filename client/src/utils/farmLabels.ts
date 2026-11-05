import { CROPS } from '../../../config/knowledge-base/crops';
import { LIVESTOCK } from '../../../config/knowledge-base/livestock';

const cropLabels = new Map<string, string>(CROPS.map((crop) => [crop.id, crop.label]));
const livestockLabels = new Map<string, string>(LIVESTOCK.map((animal) => [animal.id, animal.label]));

export function getCropLabel(id: string): string {
  return cropLabels.get(id) ?? id;
}

export function getLivestockLabel(id: string): string {
  return livestockLabels.get(id) ?? id;
}
