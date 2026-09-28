import React from 'react';
import { cn } from '../../lib/utils';

interface GraphicBaseProps {
  className?: string;
  size?: number | string;
}

/**
 * 3D Chunky Voxel Golden Coin (Vocab Gold)
 * Features an embossed "V", 3D extruded depth edge, metallic rim, and sparkle glint.
 */
export const CoinGraphic: React.FC<GraphicBaseProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={cn('w-full h-full drop-shadow-md select-none', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* Outer 3D edge bevel gradient */}
      <linearGradient id="coinBevel" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      {/* Front face gold gradient */}
      <radialGradient id="coinFace" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="45%" stopColor="#FBBF24" />
        <stop offset="85%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#B45309" />
      </radialGradient>
      {/* Inner recessed plate gradient */}
      <linearGradient id="coinInner" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      {/* Letter V embossed gold */}
      <linearGradient id="coinLetter" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="60%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>

    {/* 3D Extrusion Shadow (Bottom Depth) */}
    <path
      d="M50 96 C24 96 6 80 6 56 L6 50 C6 74 24 90 50 90 C76 90 94 74 94 50 L94 56 C94 80 76 96 50 96 Z"
      fill="#78350F"
    />
    <path
      d="M50 92 C26 92 8 77 8 53 L8 47 C8 71 26 86 50 86 C74 86 92 71 92 47 L92 53 C92 77 74 92 50 92 Z"
      fill="url(#coinBevel)"
    />

    {/* Main Coin Face (Slightly tilted isometric coin) */}
    <ellipse cx="50" cy="46" rx="42" ry="38" fill="url(#coinFace)" />
    
    {/* Outer Rim Highlight */}
    <ellipse
      cx="50"
      cy="46"
      rx="41"
      ry="37"
      stroke="#FEF08A"
      strokeWidth="2"
      strokeDasharray="90 30"
      opacity="0.9"
    />
    
    {/* Inner Recessed Ring */}
    <ellipse cx="50" cy="46" rx="33" ry="29" fill="url(#coinInner)" stroke="#92400E" strokeWidth="1.5" />
    
    {/* Embossed Bold "V" in Center */}
    <path
      d="M38 31 L44 31 L50 54 L56 31 L62 31 L53 62 L47 62 Z"
      fill="url(#coinLetter)"
      stroke="#78350F"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    
    {/* Glossy Curved Glint on Upper Left */}
    <path
      d="M20 40 C22 28 34 20 48 18 C38 20 28 28 24 38 C22 41 21 44 20 40 Z"
      fill="#FFFFFF"
      opacity="0.6"
    />

    {/* Sparkle Glint on Top Right */}
    <g transform="translate(74, 18)">
      <path
        d="M0 -8 Q0 0 8 0 Q0 0 0 8 Q0 0 -8 0 Q0 0 0 -8 Z"
        fill="#FFFFFF"
      />
      <circle cx="0" cy="0" r="2.5" fill="#FEF08A" />
    </g>
  </svg>
);

/**
 * 3D Faceted Mastery Crystal Star
 * Rich gold/yellow faceted star with dimensional highlights and floating sparkle diamonds.
 */
export const StarGraphic: React.FC<GraphicBaseProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={cn('w-full h-full drop-shadow-md select-none', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="starLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
      <linearGradient id="starMid" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="starDark" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#B45309" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
    </defs>

    {/* 3D Drop Shadow Extrusion */}
    <path
      d="M50 14 L62 38 L88 42 L69 61 L74 88 L50 75 L26 88 L31 61 L12 42 L38 38 Z"
      fill="#92400E"
      transform="translate(0, 5)"
    />

    {/* Star Outer Base */}
    <path
      d="M50 10 L62 34 L88 38 L69 57 L74 84 L50 71 L26 84 L31 57 L12 38 L38 34 Z"
      fill="#F59E0B"
      stroke="#B45309"
      strokeWidth="2"
      strokeLinejoin="round"
    />

    {/* Center Facets for 3D Diamond / Crystal Look */}
    {/* Top Tip Left (Light) & Right (Mid) */}
    <path d="M50 10 L50 49 L38 34 Z" fill="url(#starLight)" />
    <path d="M50 10 L62 34 L50 49 Z" fill="url(#starMid)" />

    {/* Right Tip Top (Light) & Bottom (Dark) */}
    <path d="M62 34 L88 38 L50 49 Z" fill="url(#starLight)" />
    <path d="M88 38 L69 57 L50 49 Z" fill="url(#starDark)" />

    {/* Bottom Right Tip (Dark) */}
    <path d="M69 57 L74 84 L50 49 Z" fill="url(#starMid)" />
    <path d="M74 84 L50 71 L50 49 Z" fill="url(#starDark)" />

    {/* Bottom Left Tip (Dark / Mid) */}
    <path d="M50 71 L26 84 L50 49 Z" fill="url(#starDark)" />
    <path d="M26 84 L31 57 L50 49 Z" fill="url(#starMid)" />

    {/* Left Tip Bottom (Dark) & Top (Light) */}
    <path d="M31 57 L12 38 L50 49 Z" fill="url(#starDark)" />
    <path d="M12 38 L38 34 L50 49 Z" fill="url(#starLight)" />

    {/* Center Gleam Star Point */}
    <circle cx="50" cy="49" r="4" fill="#FFFBEB" />
    <circle cx="50" cy="49" r="2" fill="#FFFFFF" />

    {/* Sparkle Glint on Top Tip */}
    <g transform="translate(50, 10)">
      <path d="M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6 Z" fill="#FFFFFF" />
    </g>
    {/* Small Side Sparkle */}
    <g transform="translate(86, 26)">
      <path d="M0 -4 Q0 0 4 0 Q0 0 0 4 Q0 0 -4 0 Q0 0 0 -4 Z" fill="#FFFFFF" />
    </g>
  </svg>
);

/**
 * 3D Stylized Streak Flame Torch
 * Fiery campfire torch flame with layered amber core, red-orange mantle, and floating ember particles.
 */
export const StreakGraphic: React.FC<GraphicBaseProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={cn('w-full h-full drop-shadow-md select-none', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="flameOuter" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="40%" stopColor="#EA580C" />
        <stop offset="85%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
      <linearGradient id="flameMid" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#EA580C" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#FDE047" />
      </linearGradient>
      <linearGradient id="flameCore" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="60%" stopColor="#FEF08A" />
        <stop offset="100%" stopColor="#FFFFFF" />
      </linearGradient>
    </defs>

    {/* 3D Depth Base Silhouette */}
    <path
      d="M50 94 C26 94 14 74 20 54 C24 40 34 32 38 20 C46 32 50 36 58 26 C64 42 78 40 82 56 C86 76 74 94 50 94 Z"
      fill="#7F1D1D"
      transform="translate(0, 3)"
    />

    {/* Outer Flame Body */}
    <path
      d="M50 92 C26 92 14 72 20 52 C24 38 34 30 38 18 C46 30 50 34 58 24 C64 40 78 38 82 54 C86 74 74 92 50 92 Z"
      fill="url(#flameOuter)"
      stroke="#991B1B"
      strokeWidth="1.5"
    />

    {/* Secondary Layer Flame */}
    <path
      d="M50 86 C32 86 24 72 28 58 C32 46 40 42 42 34 C48 42 54 44 60 38 C64 50 72 50 74 62 C76 76 68 86 50 86 Z"
      fill="url(#flameMid)"
    />

    {/* Inner Glowing White-Yellow Core */}
    <path
      d="M50 82 C38 82 32 72 36 62 C38 54 46 50 48 44 C52 50 56 52 60 48 C62 56 66 60 66 68 C66 78 60 82 50 82 Z"
      fill="url(#flameCore)"
    />

    {/* Floating Flame Embers */}
    <circle cx="28" cy="22" r="3" fill="#FBBF24" />
    <circle cx="68" cy="16" r="3.5" fill="#F97316" />
    <circle cx="48" cy="8" r="2.5" fill="#FEF08A" />
  </svg>
);

/**
 * 3D Voxel Ruby Red Heart Gemstone
 * High-gloss ruby heart with 3D depth, specular shine, and rich red-crimson gradient.
 */
export const HeartGraphic: React.FC<GraphicBaseProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={cn('w-full h-full drop-shadow-md select-none', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="heartBase" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="45%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
      <linearGradient id="heartDepth" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#881337" />
        <stop offset="100%" stopColor="#4C0519" />
      </linearGradient>
    </defs>

    {/* 3D Extrusion Depth Bottom */}
    <path
      d="M50 88 C46 84 10 60 10 32 C10 16 24 8 36 8 C44 8 48 14 50 18 C52 14 56 8 64 8 C76 8 90 16 90 32 C90 60 54 84 50 88 Z"
      fill="url(#heartDepth)"
      transform="translate(0, 6)"
    />

    {/* Main Heart Gem Body */}
    <path
      d="M50 84 C46 80 12 56 12 30 C12 14 26 6 38 6 C45 6 49 11 50 15 C51 11 55 6 62 6 C74 6 88 14 88 30 C88 56 54 80 50 84 Z"
      fill="url(#heartBase)"
      stroke="#881337"
      strokeWidth="2"
      strokeLinejoin="round"
    />

    {/* Specular Top Lobe Gloss Highlights */}
    <path
      d="M36 12 C28 12 18 18 18 28 C18 34 22 40 28 44 C24 38 24 24 34 16 C36 14 38 13 36 12 Z"
      fill="#FFFFFF"
      opacity="0.8"
    />
    <ellipse cx="64" cy="18" rx="8" ry="4" fill="#FFFFFF" opacity="0.6" transform="rotate(-15, 64, 18)" />

    {/* Sparkle Glint on Upper Lobe */}
    <g transform="translate(30, 20)">
      <path d="M0 -5 Q0 0 5 0 Q0 0 0 5 Q0 0 -5 0 Q0 0 0 -5 Z" fill="#FFFFFF" />
    </g>
  </svg>
);

/**
 * 3D Isometric Cyan Gem / Diamond
 */
export const GemGraphic: React.FC<GraphicBaseProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={cn('w-full h-full drop-shadow-md select-none', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="gemTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <linearGradient id="gemMid" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="gemDark" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0369A1" />
        <stop offset="100%" stopColor="#0C4A6E" />
      </linearGradient>
    </defs>

    {/* Bottom Depth Shadow */}
    <path d="M50 94 L88 40 L70 18 L30 18 L12 40 Z" fill="#082F49" transform="translate(0, 4)" />

    {/* Gem Outline */}
    <path d="M50 90 L88 38 L70 16 L30 16 L12 38 Z" fill="url(#gemMid)" stroke="#0C4A6E" strokeWidth="2" />

    {/* Top Table / Facets */}
    <polygon points="30,16 70,16 80,38 20,38" fill="url(#gemTop)" />
    <polygon points="30,16 42,26 58,26 70,16" fill="#F0F9FF" opacity="0.9" />

    {/* Lower Pavilion Facets */}
    <polygon points="20,38 50,90 50,38" fill="url(#gemMid)" />
    <polygon points="50,38 50,90 80,38" fill="url(#gemDark)" />
    <polygon points="12,38 20,38 50,90" fill="#0284C7" />
    <polygon points="88,38 80,38 50,90" fill="#075985" />

    {/* Gleam Sparkle */}
    <g transform="translate(42, 22)">
      <path d="M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6 Z" fill="#FFFFFF" />
    </g>
  </svg>
);

/**
 * 3D Voxel Wooden Treasure Chest
 * Oak planks, studded brass corner bands, and golden keyhole lock.
 */
export const ChestGraphic: React.FC<GraphicBaseProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={cn('w-full h-full drop-shadow-md select-none', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="chestWood" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#B45309" />
        <stop offset="50%" stopColor="#92400E" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="chestGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>

    {/* Shadow */}
    <rect x="12" y="74" width="76" height="14" rx="7" fill="#451A03" opacity="0.6" />

    {/* Chest Lower Box */}
    <rect x="14" y="44" width="72" height="38" rx="6" fill="url(#chestWood)" stroke="#451A03" strokeWidth="2.5" />
    
    {/* Chest Arched Lid */}
    <path
      d="M12 44 C12 28 26 22 50 22 C74 22 88 28 88 44 Z"
      fill="url(#chestWood)"
      stroke="#451A03"
      strokeWidth="2.5"
    />

    {/* Wood Plank Lines */}
    <line x1="14" y1="62" x2="86" y2="62" stroke="#451A03" strokeWidth="1.5" />
    <line x1="20" y1="36" x2="80" y2="36" stroke="#451A03" strokeWidth="1.5" opacity="0.7" />

    {/* Gold / Brass Reinforcement Straps */}
    <rect x="24" y="24" width="10" height="58" fill="url(#chestGold)" stroke="#78350F" strokeWidth="1" />
    <rect x="66" y="24" width="10" height="58" fill="url(#chestGold)" stroke="#78350F" strokeWidth="1" />
    
    {/* Studs on Straps */}
    <circle cx="29" cy="30" r="1.5" fill="#451A03" />
    <circle cx="29" cy="50" r="1.5" fill="#451A03" />
    <circle cx="29" cy="72" r="1.5" fill="#451A03" />
    <circle cx="71" cy="30" r="1.5" fill="#451A03" />
    <circle cx="71" cy="50" r="1.5" fill="#451A03" />
    <circle cx="71" cy="72" r="1.5" fill="#451A03" />

    {/* Gold Lock Plate & Keyhole */}
    <rect x="42" y="38" width="16" height="20" rx="3" fill="url(#chestGold)" stroke="#78350F" strokeWidth="1.5" />
    <circle cx="50" cy="46" r="3" fill="#451A03" />
    <polygon points="48,46 52,46 51,54 49,54" fill="#451A03" />

    {/* Sparkle on Golden Lock */}
    <g transform="translate(56, 38)">
      <path d="M0 -4 Q0 0 4 0 Q0 0 0 4 Q0 0 -4 0 Q0 0 0 -4 Z" fill="#FFFFFF" />
    </g>
  </svg>
);

/**
 * 3D Golden Royal Crown
 * 3-pointed crown with embedded ruby and sapphire jewels.
 */
export const CrownGraphic: React.FC<GraphicBaseProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={cn('w-full h-full drop-shadow-md select-none', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="crownGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="45%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>

    {/* Crown Base Cushion */}
    <ellipse cx="50" cy="76" rx="36" ry="8" fill="#991B1B" stroke="#7F1D1D" strokeWidth="2" />

    {/* Crown Body with 3 Peaks */}
    <path
      d="M16 72 L18 36 L36 52 L50 20 L64 52 L82 36 L84 72 Z"
      fill="url(#crownGold)"
      stroke="#78350F"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />

    {/* Beaded Pearls on Tips */}
    <circle cx="18" cy="34" r="5" fill="#FEF08A" stroke="#B45309" strokeWidth="1.5" />
    <circle cx="50" cy="18" r="6.5" fill="#FFFBEB" stroke="#B45309" strokeWidth="1.5" />
    <circle cx="82" cy="34" r="5" fill="#FEF08A" stroke="#B45309" strokeWidth="1.5" />

    {/* Crown Rim Band */}
    <path
      d="M16 66 C26 70 74 70 84 66 L84 74 C74 78 26 78 16 74 Z"
      fill="#D97706"
      stroke="#78350F"
      strokeWidth="1.5"
    />

    {/* Inset Gems on Rim Band */}
    <circle cx="32" cy="71" r="3.5" fill="#38BDF8" stroke="#0369A1" strokeWidth="1" />
    <polygon points="50,66 54,71 50,76 46,71" fill="#E11D48" stroke="#881337" strokeWidth="1" />
    <circle cx="68" cy="71" r="3.5" fill="#38BDF8" stroke="#0369A1" strokeWidth="1" />

    {/* Center Sparkle */}
    <g transform="translate(50, 18)">
      <path d="M0 -4 Q0 0 4 0 Q0 0 0 4 Q0 0 -4 0 Q0 0 0 -4 Z" fill="#FFFFFF" />
    </g>
  </svg>
);

/**
 * 3D Golden Championship Trophy
 */
export const TrophyGraphic: React.FC<GraphicBaseProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={cn('w-full h-full drop-shadow-md select-none', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="trophyGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="40%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>

    {/* Pedestal Base */}
    <rect x="30" y="80" width="40" height="12" rx="3" fill="#334155" stroke="#1E293B" strokeWidth="2" />
    <rect x="36" y="74" width="28" height="6" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
    <rect x="44" y="58" width="12" height="16" fill="url(#trophyGold)" stroke="#B45309" strokeWidth="1" />

    {/* Trophy Cup Winged Handles */}
    <path
      d="M28 26 C12 26 12 46 28 50 L32 50 C20 46 20 32 30 32 Z"
      fill="url(#trophyGold)"
      stroke="#B45309"
      strokeWidth="1.5"
    />
    <path
      d="M72 26 C88 26 88 46 72 50 L68 50 C80 46 80 32 70 32 Z"
      fill="url(#trophyGold)"
      stroke="#B45309"
      strokeWidth="1.5"
    />

    {/* Cup Chalice Body */}
    <path
      d="M28 20 C28 20 28 58 50 58 C72 58 72 20 72 20 Z"
      fill="url(#trophyGold)"
      stroke="#92400E"
      strokeWidth="2"
    />

    {/* Top Rim */}
    <ellipse cx="50" cy="20" rx="22" ry="5" fill="#FEF08A" stroke="#B45309" strokeWidth="1.5" />

    {/* Star Medallion on Cup */}
    <g transform="translate(50, 38) scale(0.35)">
      <polygon
        points="0,-16 4,-4 16,-4 7,4 10,16 0,8 -10,16 -7,4 -16,-4 -4,-4"
        fill="#FFFFFF"
      />
    </g>

    {/* Sparkle */}
    <g transform="translate(68, 16)">
      <path d="M0 -5 Q0 0 5 0 Q0 0 0 5 Q0 0 -5 0 Q0 0 0 -5 Z" fill="#FFFFFF" />
    </g>
  </svg>
);

/**
 * 3D Obsidian Adventure Portal
 * Dark obsidian block frame with swirling cosmic cyan/indigo portal vortex.
 */
export const PortalGraphic: React.FC<GraphicBaseProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={cn('w-full h-full drop-shadow-md select-none', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="portalVortex" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#67E8F9" />
        <stop offset="35%" stopColor="#A855F7" />
        <stop offset="70%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </radialGradient>
      <linearGradient id="obsidian" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#312E81" />
        <stop offset="50%" stopColor="#1E1B4B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    </defs>

    {/* Obsidian Arch Frame */}
    <rect x="18" y="10" width="64" height="80" rx="8" fill="url(#obsidian)" stroke="#6366F1" strokeWidth="2.5" />

    {/* Runic Etchings */}
    <rect x="22" y="14" width="6" height="6" fill="#C084FC" opacity="0.6" />
    <rect x="72" y="14" width="6" height="6" fill="#C084FC" opacity="0.6" />
    <rect x="22" y="80" width="6" height="6" fill="#C084FC" opacity="0.6" />
    <rect x="72" y="80" width="6" height="6" fill="#C084FC" opacity="0.6" />

    {/* Swirling Portal Center */}
    <rect x="28" y="20" width="44" height="60" rx="6" fill="url(#portalVortex)" />
    
    {/* Swirl Spiral Lines */}
    <ellipse cx="50" cy="50" rx="16" ry="22" stroke="#67E8F9" strokeWidth="2" strokeDasharray="30 15" opacity="0.8" />
    <ellipse cx="50" cy="50" rx="8" ry="12" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="15 10" opacity="0.9" />

    {/* Cosmic Sparkles */}
    <circle cx="44" cy="40" r="2" fill="#FFFFFF" />
    <circle cx="56" cy="58" r="1.5" fill="#FFFFFF" />
  </svg>
);

/**
 * Achievement Badge / Medal
 */
export const BadgeGraphic: React.FC<GraphicBaseProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={cn('w-full h-full drop-shadow-md select-none', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="badgeGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>

    {/* Hanging Ribbons */}
    <polygon points="34,50 26,88 38,80 44,88 42,50" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
    <polygon points="66,50 74,88 62,80 56,88 58,50" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />

    {/* Medallion Circle */}
    <circle cx="50" cy="42" r="30" fill="url(#badgeGold)" stroke="#78350F" strokeWidth="2.5" />
    <circle cx="50" cy="42" r="24" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />

    {/* Center Golden Star */}
    <g transform="translate(50, 42) scale(0.55)">
      <polygon
        points="0,-16 4,-4 16,-4 7,4 10,16 0,8 -10,16 -7,4 -16,-4 -4,-4"
        fill="#FEF08A"
        stroke="#B45309"
        strokeWidth="1.5"
      />
    </g>
  </svg>
);

/**
 * Cute Chibi Voxel Mascot Face Graphic
 * Renders an adorable, responsive block-world animal face.
 */
export const AvatarFaceGraphic: React.FC<GraphicBaseProps & { emoji?: string }> = ({ className, emoji }) => {
  return (
    <div className={cn('relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 border-2 border-amber-500 shadow-md select-none', className)}>
      {emoji ? (
        <span className="text-4xl sm:text-5xl filter drop-shadow transform transition-transform hover:scale-110">
          {emoji}
        </span>
      ) : (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          {/* Cat Ears */}
          <polygon points="18,34 32,8 42,30" fill="#F97316" stroke="#C2410C" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="24,30 32,16 38,28" fill="#FED7AA" />
          
          <polygon points="82,34 68,8 58,30" fill="#F97316" stroke="#C2410C" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="76,30 68,16 62,28" fill="#FED7AA" />

          {/* Voxel Head Box */}
          <rect x="18" y="24" width="64" height="60" rx="14" fill="#FB923C" stroke="#C2410C" strokeWidth="2.5" />
          <rect x="26" y="56" width="48" height="24" rx="8" fill="#FFF7ED" />

          {/* Cheerful Eyes */}
          <ellipse cx="36" cy="46" rx="5" ry="6" fill="#1C1917" />
          <circle cx="38" cy="44" r="2" fill="#FFFFFF" />
          
          <ellipse cx="64" cy="46" rx="5" ry="6" fill="#1C1917" />
          <circle cx="66" cy="44" r="2" fill="#FFFFFF" />

          {/* Cute Nose and Mouth */}
          <polygon points="50,56 46,52 54,52" fill="#F43F5E" />
          <path d="M46 60 Q50 64 54 60" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" fill="none" />

          {/* Rosy Cheeks */}
          <circle cx="28" cy="54" r="4" fill="#FB7185" opacity="0.6" />
          <circle cx="72" cy="54" r="4" fill="#FB7185" opacity="0.6" />
        </svg>
      )}
    </div>
  );
};

/**
 * 3D Isometric Item Box (Shop / Inventory)
 */
export const ItemBoxGraphic: React.FC<GraphicBaseProps & { emoji?: string }> = ({ className, emoji }) => {
  if (emoji) {
    return (
      <div className={cn('w-full h-full flex items-center justify-center select-none text-2xl sm:text-3xl filter drop-shadow', className)}>
        {emoji}
      </div>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className={cn('w-full h-full select-none', className)} fill="none">
      <rect x="20" y="32" width="60" height="50" rx="8" fill="#6366F1" stroke="#4338CA" strokeWidth="2.5" />
      <rect x="16" y="24" width="68" height="16" rx="4" fill="#818CF8" stroke="#4338CA" strokeWidth="2" />
      <rect x="44" y="24" width="12" height="58" fill="#FEF08A" stroke="#B45309" strokeWidth="1" />
      <path d="M42 24 C34 14 34 6 46 16 C48 18 50 22 50 24 Z" fill="#FDE047" stroke="#B45309" strokeWidth="1" />
      <path d="M58 24 C66 14 66 6 54 16 C52 18 50 22 50 24 Z" fill="#FDE047" stroke="#B45309" strokeWidth="1" />
    </svg>
  );
};
