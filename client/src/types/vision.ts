export type VisionItemType = 'crop_product' | 'livestock';

export interface VisionRecognition {
  status: 'identified' | 'uncertain' | 'unknown';
  itemName: string | null;
  confidence: number;
  alternatives: string[];
}
