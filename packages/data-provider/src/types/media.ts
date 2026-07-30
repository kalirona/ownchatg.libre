export type MediaQuality = 'fast' | 'balanced' | 'best';
export type MediaStyle = 'photo' | 'illustration' | '3d' | 'anime' | 'logo' | 'vector' | 'realistic' | 'fantasy' | 'product' | 'portrait';
export type MediaAspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
export type CameraMotion = 'static' | 'pan' | 'zoom' | 'orbit';
export type MotionStrength = 'low' | 'medium' | 'high';
export type VideoDuration = 5 | 10 | 15;
export type VideoQuality = 'fast' | 'standard' | 'cinema';
export type NumImages = 1 | 2 | 4;

export type MediaPresetId = 'marketing-ad' | 'product-photography' | 'social-media' | 'logo-concept' | 'thumbnail' | 'anime' | 'interior-design' | 'real-estate' | 'fashion' | 'character-design';

export type MediaPreset = {
  id: MediaPresetId;
  name: string;
  description: string;
  icon: string;
  recommendedStyle?: MediaStyle;
  recommendedAspectRatio?: MediaAspectRatio;
};

export type ImageGenerationRequest = {
  preset?: MediaPresetId;
  quality: MediaQuality;
  style: MediaStyle;
  aspectRatio: MediaAspectRatio;
  numImages: NumImages;
  prompt: string;
  negativePrompt?: string;
  seed?: number | null;
  cfg?: number;
  steps?: number;
};

export type VideoGenerationRequest = {
  preset?: MediaPresetId;
  quality: VideoQuality;
  duration: VideoDuration;
  aspectRatio: MediaAspectRatio;
  prompt: string;
  motionStrength: MotionStrength;
  cameraMotion: CameraMotion;
  negativePrompt?: string;
  seed?: number | null;
};

export type CreditCost = {
  fast: number;
  balanced: number;
  best: number;
};

export const MEDIA_CREDIT_COSTS: Record<string, CreditCost> = {
  image: { fast: 5, balanced: 10, best: 20 },
  video: { fast: 15, balanced: 30, best: 60 },
};

export const MEDIA_PRESETS: MediaPreset[] = [
  { id: 'marketing-ad', name: 'Marketing Ad', description: 'High-conversion ad creatives', icon: '📢', recommendedStyle: 'photo', recommendedAspectRatio: '16:9' },
  { id: 'product-photography', name: 'Product Photography', description: 'Professional product shots', icon: '📦', recommendedStyle: 'product', recommendedAspectRatio: '1:1' },
  { id: 'social-media', name: 'Social Media', description: 'Optimized for social platforms', icon: '📱', recommendedStyle: 'illustration', recommendedAspectRatio: '1:1' },
  { id: 'logo-concept', name: 'Logo Concept', description: 'Brand logo ideas and concepts', icon: '🎯', recommendedStyle: 'logo', recommendedAspectRatio: '1:1' },
  { id: 'thumbnail', name: 'Thumbnail', description: 'Click-optimized video thumbnails', icon: '🖼️', recommendedStyle: 'photo', recommendedAspectRatio: '16:9' },
  { id: 'anime', name: 'Anime', description: 'Anime and manga style artwork', icon: '🎨', recommendedStyle: 'anime', recommendedAspectRatio: '3:2' },
  { id: 'interior-design', name: 'Interior Design', description: 'Room and space visualization', icon: '🏠', recommendedStyle: 'photo', recommendedAspectRatio: '16:9' },
  { id: 'real-estate', name: 'Real Estate', description: 'Property and architecture renders', icon: '🏢', recommendedStyle: 'photo', recommendedAspectRatio: '16:9' },
  { id: 'fashion', name: 'Fashion', description: 'Fashion and apparel design', icon: '👗', recommendedStyle: 'portrait', recommendedAspectRatio: '9:16' },
  { id: 'character-design', name: 'Character Design', description: 'Character and OC concepts', icon: '🧙', recommendedStyle: 'fantasy', recommendedAspectRatio: '3:2' },
];

export type GenStatus = 'idle' | 'queued' | 'preparing' | 'generating' | 'upscaling' | 'completed' | 'failed';

export type MediaResultImage = {
  filepath: string;
  fileId: string;
  width?: number;
  height?: number;
};

export type MediaResultVideo = {
  filepath: string;
  fileId: string;
  width?: number;
  height?: number;
  duration?: number;
};

export type MediaHistoryEntry = {
  _id: string;
  type: 'image' | 'video';
  preset?: MediaPresetId;
  quality: string;
  style?: string;
  aspectRatio: string;
  prompt: string;
  negativePrompt?: string;
  images?: MediaResultImage[];
  videos?: MediaResultVideo[];
  favorite: boolean;
  creditsCost: number;
  status: string;
  seed?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type MediaHistoryResponse = {
  records: MediaHistoryEntry[];
  total: number;
  page: number;
  limit: number;
};

export type AdminMediaModel = {
  _id: string;
  name: string;
  internalId: string;
  provider: string;
  type: 'image' | 'video';
  enabled: boolean;
  priority: number;
  creditCost: number;
  maxResolution?: string;
  speed: number;
  qualityScore: number;
  safety: boolean;
  isDefault: boolean;
  hidden: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MediaRoutingRule = {
  _id: string;
  name: string;
  type: 'image' | 'video';
  condition: { field: string; operator: string; value: string };
  targetModelId: string;
  fallbackModelId?: string;
  priority: number;
  enabled: boolean;
};

export type MediaAnalytics = {
  totalImageRequests: number;
  totalVideoRequests: number;
  creditsConsumed: number;
  providerCost: number;
  revenue: number;
  profit: number;
  failures: number;
  averageGenTimeMs: number;
  popularPresets: { preset: string; count: number }[];
  popularStyles: { style: string; count: number }[];
};
