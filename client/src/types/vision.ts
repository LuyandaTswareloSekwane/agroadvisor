export type VisionItemType = 'crop_product' | 'livestock';

export interface VisionRecognition {
  status: 'identified' | 'uncertain' | 'unknown';
  itemName: string | null;
  confidence: number;
  alternatives: string[];
  /** The item's name in the language the scan was requested in (null for English or when unsure). */
  localName?: string | null;
}
