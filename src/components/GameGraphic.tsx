import React, { useState } from 'react';
import { cn } from '../lib/utils';
import {
  CoinGraphic,
  StarGraphic,
  StreakGraphic,
  HeartGraphic,
  GemGraphic,
  ChestGraphic,
  CrownGraphic,
  TrophyGraphic,
  PortalGraphic,
  BadgeGraphic,
  AvatarFaceGraphic,
  ItemBoxGraphic,
} from './assets/UIGraphics';

export type GraphicType =
  | 'avatar'
  | 'item'
  | 'currency'
  | 'heart'
  | 'star'
  | 'coin'
  | 'streak'
  | 'gem'
  | 'trophy'
  | 'crown'
  | 'chest'
  | 'portal'
  | 'badge'
  | 'companion';

export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const TYPE_TITLES: Record<GraphicType, string> = {
  coin: 'Coins',
  gem: 'Gems',
  heart: 'Health',
  star: 'Stars',
  streak: 'Daily Streak',
  chest: 'Treasure Chest',
  crown: 'Crown',
  trophy: 'Trophy',
  portal: 'Portal',
  badge: 'Badge',
  avatar: 'Avatar',
  companion: 'Companion',
  currency: 'Currency',
  item: 'Item',
};

export interface GameGraphicProps {
  type?: GraphicType;
  name?: string;
  emoji?: string;
  src?: string;
  category?: string;
  className?: string;
  iconClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showLabel?: boolean;
  title?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  xs: 'w-4 h-4',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
  '2xl': 'w-40 h-40',
};

/**
 * Universal GameGraphic
 * Renders high-fidelity 3D-voxel vector assets for currencies, status HUDs,
 * items, and characters with seamless image file support and fallback.
 */
export const GameGraphic: React.FC<GameGraphicProps> = ({
  type = 'currency',
  name,
  emoji,
  src,
  className,
  iconClassName,
  size = 'md',
  showLabel = false,
  title,
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [attempt, setAttempt] = useState(0);
  const [imgError, setImgError] = useState(false);
  const sizeClass = SIZE_CLASSES[size] || 'w-12 h-12';

  const computedTitle = React.useMemo(() => {
    if (title !== undefined) {
      return title ? toTitleCase(title) : undefined;
    }
    if (name) {
      return toTitleCase(name);
    }
    return TYPE_TITLES[type] || toTitleCase(type);
  }, [title, name, type]);

  React.useEffect(() => {
    setCurrentSrc(src);
    setAttempt(0);
    setImgError(!src);
  }, [src]);

  const handleImageError = () => {
    if (src && src.startsWith('/sprites/') && attempt === 0) {
      setAttempt(1);
      setCurrentSrc(`https://raw.githubusercontent.com/RockyJLaRo/RockyJLaRo.github.io/main/Vocab_Sprites${src}`);
    } else if (src && src.startsWith('/sprites/') && attempt === 1) {
      setAttempt(2);
      setCurrentSrc(`https://rockyjlaro.github.io/Vocab_Sprites${src}`);
    } else {
      setImgError(true);
    }
  };

  // Helper to render the appropriate 3D graphic component based on type
  const renderGraphicContent = () => {
    // If an external image source is provided and hasn't errored
    if (currentSrc && !imgError) {
      return (
        <img
          src={currentSrc}
          alt={name || type}
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className={cn('w-full h-full object-contain filter drop-shadow pixel-art', iconClassName)}
          style={{ imageRendering: 'pixelated' }}
        />
      );
    }

    switch (type) {
      case 'coin':
      case 'currency':
        return <CoinGraphic className={iconClassName} />;
      case 'star':
        return <StarGraphic className={iconClassName} />;
      case 'streak':
        return <StreakGraphic className={iconClassName} />;
      case 'heart':
        return <HeartGraphic className={iconClassName} />;
      case 'gem':
        return <GemGraphic className={iconClassName} />;
      case 'chest':
        return <ChestGraphic className={iconClassName} />;
      case 'crown':
        return <CrownGraphic className={iconClassName} />;
      case 'trophy':
        return <TrophyGraphic className={iconClassName} />;
      case 'portal':
        return <PortalGraphic className={iconClassName} />;
      case 'badge':
        return <BadgeGraphic className={iconClassName} />;
      case 'avatar':
      case 'companion':
        return <AvatarFaceGraphic emoji={emoji} className={iconClassName} />;
      case 'item':
      default:
        return <ItemBoxGraphic emoji={emoji} className={iconClassName} />;
    }
  };

  return (
    <div
      className={cn(
        'relative inline-flex flex-col items-center justify-center shrink-0 select-none transition-transform',
        sizeClass,
        className
      )}
      title={computedTitle}
    >
      <div className="w-full h-full flex items-center justify-center">
        {renderGraphicContent()}
      </div>
      {showLabel && name && (
        <span className="text-[10px] font-bold text-slate-600 mt-1 truncate max-w-full text-center">
          {name}
        </span>
      )}
    </div>
  );
};
