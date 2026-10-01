export type ProcessingStatus = 'idle' | 'analyzing' | 'processing' | 'done' | 'error';

export type SubjectCategory = 'auto' | 'portrait' | 'product' | 'animal' | 'graphic' | 'other';

export interface AISubjectAnalysis {
  fallback?: boolean;
  subjectName?: string;
  category?: string;
  boundingBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  backgroundType?: string;
  suggestedEdgeFeather?: number;
  subjectForegroundSeeds?: [number, number][]; // [y, x] 0-1000
  backgroundSeeds?: [number, number][];
  foregroundDominantColor?: string;
  backgroundDominantColor?: string;
  clarityScore?: number;
}

export type BackgroundType = 'transparent' | 'color' | 'gradient' | 'image' | 'blur';

export interface BackgroundConfig {
  type: BackgroundType;
  color: string;
  gradient: string;
  imageUrl?: string;
  imageName?: string;
  blurAmount: number; // 0 to 50 px
}

export interface BrushConfig {
  mode: 'erase' | 'restore';
  size: number; // 5 to 100 px
  hardness: number; // 0 to 1
  opacity: number; // 0 to 1
}

export interface HistoryStep {
  maskSnapshot: Uint8ClampedArray;
}

export interface ImageItem {
  id: string;
  file?: File;
  name: string;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  fileSize: number;
  mimeType: string;
  status: ProcessingStatus;
  progress: number;
  category: SubjectCategory;
  aiAnalysis?: AISubjectAnalysis;
  rawMask?: Uint8ClampedArray; // Full resolution alpha mask (length = width * height)
  resultUrl?: string; // Transparent PNG data URL at full resolution
  errorMessage?: string;
}

export interface PresetBackground {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
}
