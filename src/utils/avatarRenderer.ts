import {
  AvatarId,
  LAYER_ORDER,
  SpriteLayer,
  SPRITE_ITEMS,
  getAvatarBaseUrl,
  getDefaultTailUrl,
  getItemStandaloneUrl,
  getItemEquippedPreviewUrl,
} from '../data/avatarSprites';

// Image loading cache for raw HTMLImageElements
const imageElementCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageElementCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // If local /sprites/... fails, fallback to GitHub repository CDN / raw assets
      if (src.startsWith('/sprites/')) {
        const ghRaw = `https://raw.githubusercontent.com/RockyJLaRo/RockyJLaRo.github.io/main/Vocab_Sprites${src}`;
        const ghPages = `https://rockyjlaro.github.io/Vocab_Sprites${src}`;

        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => {
          const finalImg = new Image();
          finalImg.crossOrigin = 'anonymous';
          finalImg.onload = () => resolve(finalImg);
          finalImg.onerror = (finalErr) => reject(finalErr);
          finalImg.src = ghPages;
        };
        fallbackImg.src = ghRaw;
      } else {
        reject(new Error(`Failed to load image: ${src}`));
      }
    };
    img.src = src;
  });

  imageElementCache.set(src, promise);
  return promise;
}

// 64x64 composite cache to avoid re-compositing identical states
// Key: `${avatarId}|${style}|${sortedEquippedPairs}`
const compositeCanvasCache = new Map<string, HTMLCanvasElement>();

export function getCompositeCacheKey(
  avatarId: string,
  equipped: Partial<Record<SpriteLayer | string, string>>,
  style: 'girl' | 'boy' = 'girl'
): string {
  const sortedPairs = Object.entries(equipped)
    .filter(([_, itemId]) => Boolean(itemId))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([layer, itemId]) => `${layer}:${itemId}`)
    .join(',');
  return `${avatarId}|${style}|${sortedPairs}`;
}

/**
 * Creates the canonical 64x64 composite canvas at native resolution.
 * Strictly adheres to Section 6, 9 & 12 of the Avatar Asset Integration Guide:
 * Back-to-front layer order: BACK -> TAIL -> BASE -> TEXTURE -> BODY -> NECK -> HAND -> FACE -> HEAD
 * TAIL: If no tail equipped, renders layer_TAIL_default.png; otherwise renders equipped tail only.
 */
export async function createAvatar64Composite(
  avatarId: string = 'black_cat',
  equipped: Partial<Record<SpriteLayer | string, string>> = {},
  style: 'girl' | 'boy' = 'girl'
): Promise<HTMLCanvasElement> {
  const cacheKey = getCompositeCacheKey(avatarId, equipped, style);
  const cached = compositeCanvasCache.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // NEAREST NEIGHBOR rule: disable all smoothing at the native composite level
  ctx.imageSmoothingEnabled = false;

  const hasEquippedTail = Boolean(equipped.TAIL || equipped.tail);

  for (const layer of LAYER_ORDER) {
    try {
      if (layer === 'BASE') {
        const url = getAvatarBaseUrl(avatarId, style);
        const img = await loadImage(url);
        ctx.drawImage(img, 0, 0, 64, 64);
      } else if (layer === 'TAIL') {
        const equippedTailId = equipped.TAIL || equipped.tail;
        if (equippedTailId) {
          const url =
            getItemEquippedPreviewUrl(equippedTailId, avatarId, style) ||
            getItemStandaloneUrl(equippedTailId, avatarId, style);
          if (url) {
            const img = await loadImage(url);
            ctx.drawImage(img, 0, 0, 64, 64);
          }
        } else {
          // Draw default tail for this avatar
          const url = getDefaultTailUrl(avatarId, style);
          const img = await loadImage(url);
          ctx.drawImage(img, 0, 0, 64, 64);
        }
      } else {
        // Any other equippable slot: BACK, TEXTURE, BODY, NECK, HAND, FACE, HEAD
        const itemId = equipped[layer] || equipped[layer.toLowerCase()];
        if (itemId) {
          const url =
            getItemEquippedPreviewUrl(itemId, avatarId, style) ||
            getItemStandaloneUrl(itemId, avatarId, style);
          if (url) {
            const img = await loadImage(url);
            ctx.drawImage(img, 0, 0, 64, 64);
          }
        }
      }
    } catch (e) {
      console.warn(`[AvatarRenderer] Could not load sprite layer "${layer}" for ${avatarId}:`, e);
    }
  }

  compositeCanvasCache.set(cacheKey, canvas);
  return canvas;
}

/**
 * Draws the completed 64x64 composite onto a target canvas at the requested display size.
 * MANDATORY: Applies nearest-neighbor scaling (ctx.imageSmoothingEnabled = false)
 * and maintains 1:1 aspect ratio.
 */
export function drawAvatarToCanvas(
  targetCanvas: HTMLCanvasElement,
  composite64: HTMLCanvasElement,
  displaySize: number
) {
  targetCanvas.width = displaySize;
  targetCanvas.height = displaySize;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  // Explicitly ensure nearest-neighbor filtering (Section 12.2 & 12.4)
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, displaySize, displaySize);

  // Draw 64x64 directly scaled up to displaySize
  ctx.drawImage(composite64, 0, 0, 64, 64, 0, 0, displaySize, displaySize);
}

/**
 * Converts a slot name to canonical SpriteLayer
 */
export function normalizeLayerName(layerName: string): SpriteLayer | null {
  const upper = layerName.toUpperCase();
  if (LAYER_ORDER.includes(upper as SpriteLayer)) {
    return upper as SpriteLayer;
  }
  // Mappings for UI legacy terms
  if (upper === 'HEADWEAR' || upper === 'HATS' || upper === 'HORNS') return 'HEAD';
  if (upper === 'OUTFIT' || upper === 'CLOTHING' || upper === 'SHIRT' || upper === 'DRESS') return 'BODY';
  if (upper === 'AURA' || upper === 'SKIN') return 'TEXTURE';
  if (upper === 'GLASSES') return 'FACE';
  if (upper === 'SCARF' || upper === 'COLLAR') return 'NECK';
  if (upper === 'WINGS' || upper === 'CAPE' || upper === 'BACKPACK') return 'BACK';
  return null;
}
