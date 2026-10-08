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

/**
 * Resolves which item ID is equipped for a given canonical SpriteLayer.
 * Bulletproof mapping supporting canonical layer names, lowercase, UI categories, and aliases.
 */
export function resolveEquippedItemForLayer(
  layer: SpriteLayer,
  equipped: Partial<Record<SpriteLayer | string, string>> = {}
): string | undefined {
  if (!equipped) return undefined;

  // 1. Exact canonical key (e.g. 'HEAD', 'BODY', 'NECK', 'FACE', 'BACK', 'TAIL', 'HAND', 'TEXTURE')
  if (equipped[layer]) return equipped[layer];
  if (equipped[layer.toLowerCase()]) return equipped[layer.toLowerCase()];

  // 2. Comprehensive alias dictionary
  const aliases: Record<SpriteLayer, string[]> = {
    BACK: ['back', 'Back', 'wings', 'Wings', 'cape', 'Cape', 'backpack', 'Backpack', 'Wings & Back'],
    TAIL: ['tail', 'Tail', 'Tails'],
    BASE: ['base', 'Base'],
    TEXTURE: ['texture', 'Texture', 'aura', 'Aura', 'skin', 'Skin', 'Textures & Auras'],
    BODY: ['body', 'Body', 'outfit', 'Outfit', 'Outfits', 'clothing', 'Clothing', 'shirt', 'Shirt', 'dress', 'Dress'],
    NECK: ['neck', 'Neck', 'scarf', 'Scarf', 'collar', 'Collar', 'necklace', 'Necklace'],
    HAND: ['hand', 'Hand', 'handheld', 'Handheld'],
    FACE: ['face', 'Face', 'glasses', 'Glasses'],
    HEAD: ['head', 'Head', 'headwear', 'Headwear', 'hat', 'Hat', 'hats', 'Hats', 'horns', 'Horns', 'crown', 'Crown'],
  };

  const candidateKeys = aliases[layer] || [];
  for (const key of candidateKeys) {
    if (equipped[key]) return equipped[key];
  }

  // 3. Fallback: inspect any item in equipped whose defined SPRITE_ITEMS layer matches this layer
  for (const [key, val] of Object.entries(equipped)) {
    if (val && typeof val === 'string') {
      const itemDef = SPRITE_ITEMS[val];
      if (itemDef && itemDef.layer === layer) {
        return val;
      }
    }
  }

  return undefined;
}

// 64x64 composite cache to avoid re-compositing identical states
// Key: `${avatarId}|${style}|${sortedEquippedPairs}`
const compositeCanvasCache = new Map<string, HTMLCanvasElement>();

export function getCompositeCacheKey(
  avatarId: string,
  equipped: Partial<Record<SpriteLayer | string, string>>,
  style: 'girl' | 'boy' = 'girl'
): string {
  const sortedPairs = LAYER_ORDER.map((layer) => {
    const item = resolveEquippedItemForLayer(layer, equipped);
    return item ? `${layer}:${item}` : '';
  })
    .filter(Boolean)
    .sort()
    .join(',');
  return `${avatarId}|${style}|${sortedPairs}`;
}

/**
 * Creates the canonical 64x64 composite canvas at native resolution.
 * Strictly adheres to Section 6, 9 & 12 of the Avatar Asset Integration Guide:
 * Back-to-front layer order: BACK -> TAIL -> BASE -> TEXTURE -> BODY -> NECK -> HAND -> FACE -> HEAD
 * TAIL: If custom tail is equipped, renders custom tail sprite; otherwise renders layer_TAIL_default.png.
 * BASE: Renders layer_BASE_no_tail.png so default tail does not clash or duplicate.
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

  const equippedTailId = resolveEquippedItemForLayer('TAIL', equipped);

  for (const layer of LAYER_ORDER) {
    try {
      if (layer === 'TAIL') {
        if (equippedTailId) {
          const equippedUrl = getItemEquippedPreviewUrl(equippedTailId, avatarId, style);
          const standaloneUrl = getItemStandaloneUrl(equippedTailId, avatarId, style);
          let img: HTMLImageElement | null = null;
          if (equippedUrl) {
            try {
              img = await loadImage(equippedUrl);
            } catch {
              if (standaloneUrl) {
                try {
                  img = await loadImage(standaloneUrl);
                } catch {}
              }
            }
          }
          if (img) {
            ctx.drawImage(img, 0, 0, 64, 64);
          }
        } else {
          // Draw default tail for this avatar behind body
          const defaultTailUrl = getDefaultTailUrl(avatarId, style);
          try {
            const tailImg = await loadImage(defaultTailUrl);
            ctx.drawImage(tailImg, 0, 0, 64, 64);
          } catch (e) {
            // Optional fallback
          }
        }
      } else if (layer === 'BASE') {
        // Render base without tail so default tail is never duplicated over custom tail
        const baseNoTailUrl = `/sprites/${style}/${avatarId}/sprites/base/layer_BASE_no_tail.png`;
        try {
          const baseImg = await loadImage(baseNoTailUrl);
          ctx.drawImage(baseImg, 0, 0, 64, 64);
        } catch {
          // Fallback to standard base_{avatarId}.png
          const fallbackBaseUrl = getAvatarBaseUrl(avatarId, style);
          const baseImg = await loadImage(fallbackBaseUrl);
          ctx.drawImage(baseImg, 0, 0, 64, 64);
        }
      } else {
        // Any other equippable slot: BACK, TEXTURE, BODY, NECK, HAND, FACE, HEAD
        const itemId = resolveEquippedItemForLayer(layer, equipped);
        if (itemId) {
          const equippedUrl = getItemEquippedPreviewUrl(itemId, avatarId, style);
          const standaloneUrl = getItemStandaloneUrl(itemId, avatarId, style);
          let img: HTMLImageElement | null = null;
          if (equippedUrl) {
            try {
              img = await loadImage(equippedUrl);
            } catch {
              if (standaloneUrl) {
                try {
                  img = await loadImage(standaloneUrl);
                } catch {}
              }
            }
          } else if (standaloneUrl) {
            try {
              img = await loadImage(standaloneUrl);
            } catch {}
          }

          if (img) {
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
  if (upper === 'HEADWEAR' || upper === 'HATS' || upper === 'HORNS' || upper === 'CROWN') return 'HEAD';
  if (upper === 'OUTFIT' || upper === 'OUTFITS' || upper === 'CLOTHING' || upper === 'SHIRT' || upper === 'DRESS') return 'BODY';
  if (upper === 'AURA' || upper === 'SKIN' || upper === 'TEXTURES & AURAS') return 'TEXTURE';
  if (upper === 'GLASSES') return 'FACE';
  if (upper === 'SCARF' || upper === 'COLLAR' || upper === 'NECKLACE') return 'NECK';
  if (upper === 'WINGS' || upper === 'CAPE' || upper === 'BACKPACK' || upper === 'WINGS & BACK') return 'BACK';
  if (upper === 'TAIL' || upper === 'TAILS') return 'TAIL';
  if (upper === 'HAND' || upper === 'HANDHELD') return 'HAND';
  return null;
}

// -------------------------------------------------------------
// Avatar PNG Export Functions with Scale Multipliers (2x to 10x)
// -------------------------------------------------------------

export interface ExportAvatarOptions {
  avatarId?: string;
  equipped?: Partial<Record<SpriteLayer | string, string>>;
  style?: 'girl' | 'boy';
  scale: number; // 1 to 10
  transparent?: boolean;
  backgroundColor?: string;
}

/**
 * Generates an exported Avatar PNG canvas at specified scale (1x = 64px up to 10x = 640px)
 * using pristine nearest-neighbor scaling.
 */
export async function createExportAvatarCanvas(
  options: ExportAvatarOptions
): Promise<HTMLCanvasElement> {
  const {
    avatarId = 'black_cat',
    equipped = {},
    style = 'girl',
    scale = 4,
    transparent = true,
    backgroundColor,
  } = options;

  const composite64 = await createAvatar64Composite(avatarId, equipped, style);
  const clampedScale = Math.max(1, Math.min(10, Math.round(scale)));
  const targetDimension = clampedScale * 64;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = targetDimension;
  exportCanvas.height = targetDimension;

  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return exportCanvas;

  // NEAREST-NEIGHBOR: Crisp pixel edges
  ctx.imageSmoothingEnabled = false;

  if (!transparent && backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetDimension, targetDimension);
  } else {
    ctx.clearRect(0, 0, targetDimension, targetDimension);
  }

  // Draw nearest-neighbor scaled sprite
  ctx.drawImage(composite64, 0, 0, 64, 64, 0, 0, targetDimension, targetDimension);
  return exportCanvas;
}

/**
 * Exports avatar as Data URL string (PNG)
 */
export async function exportAvatarToDataUrl(options: ExportAvatarOptions): Promise<string> {
  const canvas = await createExportAvatarCanvas(options);
  return canvas.toDataURL('image/png');
}

/**
 * Exports avatar as Blob (PNG)
 */
export async function exportAvatarToBlob(options: ExportAvatarOptions): Promise<Blob | null> {
  const canvas = await createExportAvatarCanvas(options);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}

/**
 * Triggers client-side browser download for avatar PNG at chosen scale
 */
export async function downloadAvatarPng(
  options: ExportAvatarOptions & { filename?: string }
): Promise<boolean> {
  try {
    const dataUrl = await exportAvatarToDataUrl(options);
    if (!dataUrl) return false;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download =
      options.filename ||
      `avatar_${options.avatarId || 'mascot'}_${options.scale}x_${options.scale * 64}px.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('[AvatarRenderer] Failed to download avatar PNG:', err);
    return false;
  }
}

