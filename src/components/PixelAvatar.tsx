import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { useProgressStore } from '../store/useProgressStore';
import { createAvatar64Composite, drawAvatarToCanvas } from '../utils/avatarRenderer';
import { SpriteLayer } from '../data/avatarSprites';

export interface PixelAvatarProps {
  avatarId?: string;
  equipped?: Partial<Record<SpriteLayer | string, string>>;
  style?: 'girl' | 'boy';
  size?: number;
  className?: string;
  animated?: boolean;
  zoom?: number;
  onClick?: () => void;
}

/**
 * PixelAvatar Component
 * Authoritative Nearest-Neighbor 64x64 Pixel Art Mascot Renderer.
 * Conforms to Section 12 of the Integration Guide:
 * - 64x64 native composite resolution
 * - Nearest Neighbor scaling exclusively
 * - 1:1 aspect ratio preserved
 * - Crisp pixel borders with no smoothing or blur
 */
export const PixelAvatar: React.FC<PixelAvatarProps> = ({
  avatarId: propAvatarId,
  equipped: propEquipped,
  style: propStyle,
  size = 128,
  className,
  animated = false,
  zoom = 1,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const storeMascotBaseId = useProgressStore((state) => state.mascotBaseId);
  const storeEquipped = useProgressStore((state) => state.equipped);
  const storeWardrobeStyle = useProgressStore((state) => (state as any).wardrobeStyle);

  const activeAvatarId = propAvatarId || storeMascotBaseId || 'black_cat';
  const activeEquipped = propEquipped || storeEquipped || {};
  const activeStyle = propStyle || (storeWardrobeStyle === 'boy' ? 'boy' : 'girl');

  const displaySize = Math.round(size * zoom);

  useEffect(() => {
    let isCancelled = false;

    async function render() {
      try {
        const composite64 = await createAvatar64Composite(
          activeAvatarId,
          activeEquipped,
          activeStyle
        );

        if (isCancelled || !canvasRef.current) return;

        drawAvatarToCanvas(canvasRef.current, composite64, displaySize);
        setIsLoaded(true);
      } catch (err) {
        console.error('[PixelAvatar] Render failure:', err);
      }
    }

    render();

    return () => {
      isCancelled = true;
    };
  }, [activeAvatarId, JSON.stringify(activeEquipped), activeStyle, displaySize]);

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center select-none overflow-hidden',
        animated && 'animate-bounce-subtle',
        onClick && 'cursor-pointer hover:scale-105 active:scale-95 transition-transform',
        className
      )}
      style={{
        width: displaySize,
        height: displaySize,
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: '1 / 1',
      }}
    >
      {/* Native Canvas with Explicit Nearest-Neighbor CSS */}
      <canvas
        ref={canvasRef}
        width={displaySize}
        height={displaySize}
        className={cn(
          'w-full h-full pixel-art',
          !isLoaded && 'opacity-0 transition-opacity duration-150',
          isLoaded && 'opacity-100'
        )}
        style={{
          imageRendering: 'pixelated',
        }}
      />

      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/60 dark:bg-slate-800/60 rounded-xl animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
};
