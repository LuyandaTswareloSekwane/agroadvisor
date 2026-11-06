export type VisionItemType = 'crop_product' | 'livestock';

export type VisionRecognition =
  | {
      status: 'identified';
      itemName: string;
      confidence: number;
      alternatives: string[];
      localName?: string | null;
    }
  | {
      status: 'uncertain';
      itemName: string | null;
      confidence: number;
      alternatives: string[];
      localName?: string | null;
    }
  | {
      status: 'unknown';
      itemName: null;
      confidence: number;
      alternatives: [];
    };
