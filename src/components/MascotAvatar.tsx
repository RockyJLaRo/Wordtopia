import React from 'react';
import { cn } from '../lib/utils';
import { useProgressStore } from '../store/useProgressStore';
import { PixelAvatar } from './PixelAvatar';

interface MascotAvatarProps {
  equipped?: Record<string, string>;
  size?: number;
  className?: string;
  avatarId?: string;
  style?: 'girl' | 'boy';
  animated?: boolean;
  zoom?: number;
  onClick?: () => void;
}

// Maps legacy starter IDs if encountered to the new canonical 8 pixel-art avatars
function normalizeAvatarId(id?: string): string {
  if (!id) return 'black_cat';
  if (id === 'cat_aurora' || id === 'cat_orange' || id === 'cat') return 'black_cat';
  if (id.includes('panda')) return 'red_panda';
  if (id.includes('turtle')) return 'turtle';
  if (id.includes('capy')) return 'capybara';
  if (id.includes('axolotl')) return 'axolotl';
  if (id.includes('frog')) return 'frog';
  if (id.includes('dino')) return 'dinosaur';
  if (id.includes('cow')) return 'cow';
  return id;
}

/**
 * MascotAvatar
 * Primary Mascot Avatar component in Wordtopia.
 * Uses the authentic 64x64 pixel art sprite kits with 9-layer composite and
 * strict nearest-neighbor scaling.
 */
export function MascotAvatar({
  size = 160,
  className,
  equipped: propEquipped,
  avatarId,
  style,
  animated = false,
  zoom = 1,
  onClick,
}: MascotAvatarProps) {
  const storeEquipped = useProgressStore((state) => state.equipped);
  const storeMascotBaseId = useProgressStore((state) => state.mascotBaseId);
  const setAvatarExportOpen = useProgressStore((state) => state.setAvatarExportOpen);

  const activeEquipped = propEquipped || storeEquipped || {};
  const activeAvatarId = normalizeAvatarId(avatarId || storeMascotBaseId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setAvatarExportOpen(true);
    }
  };

  return (
    <PixelAvatar
      avatarId={activeAvatarId}
      equipped={activeEquipped}
      style={style}
      size={size}
      className={className}
      animated={animated}
      zoom={zoom}
      onClick={handleClick}
    />
  );
}
