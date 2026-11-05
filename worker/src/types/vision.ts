export type VisionItemType = 'crop_product' | 'livestock';

export type VisionRecognition =
  | {
      status: 'identified';
      itemName: string;
      confidence: number;
      alternatives: string[];
    }
  | {
      status: 'uncertain';
      itemName: string | null;
      confidence: number;
      alternatives: string[];
    }
  | {
      status: 'unknown';
      itemName: null;
      confidence: number;
      alternatives: [];
    };
