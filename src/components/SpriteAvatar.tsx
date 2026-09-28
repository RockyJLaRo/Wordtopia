import React from 'react';
import { SingularPlaceholder } from './SingularPlaceholder';

interface SpriteAvatarProps {
  spriteSheetUrl?: string;
  columns?: number;
  rows?: number;
  combinationIndex?: number;
  className?: string;
}

/**
 * SpriteAvatar
 * Renders the singular placeholder instead of external sprite sheet graphics.
 */
export function SpriteAvatar({ className }: SpriteAvatarProps) {
  return <SingularPlaceholder className={className} />;
}
