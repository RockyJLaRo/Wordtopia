import { ShopItem } from '../types';
import { AVATARS, SPRITE_ITEMS, ALL_COMBOS, SpriteLayer } from './avatarSprites';

export function mapLayerToCategory(layer: SpriteLayer): string {
  switch (layer) {
    case 'HEAD': return 'Headwear';
    case 'FACE': return 'Face';
    case 'NECK': return 'Neck';
    case 'BODY': return 'Outfit';
    case 'BACK': return 'Back';
    case 'TAIL': return 'Tail';
    case 'HAND': return 'Hand';
    case 'TEXTURE': return 'Aura';
    default: return 'Outfit';
  }
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'Mythic': return 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-400';
    case 'Legendary': return 'bg-amber-100 text-amber-900 border-amber-400';
    case 'Epic': return 'bg-purple-100 text-purple-900 border-purple-300';
    case 'Rare': return 'bg-blue-100 text-blue-900 border-blue-300';
    case 'Uncommon': return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    default: return 'bg-slate-100 text-slate-800 border-slate-300';
  }
}

/**
 * Returns dynamic ShopItems for the 8 canonical Pixel Avatars,
 * dynamically styled for boy or girl base sprites.
 */
export function getPixelAvatarShopItems(style: 'girl' | 'boy' = 'girl'): ShopItem[] {
  return AVATARS.map((avatar) => ({
    id: avatar.id,
    name: avatar.name,
    category: 'Avatar',
    collection: 'Pixel Companions',
    rarity: 'Common',
    price: 0,
    description: `${avatar.description} (${avatar.personality})`,
    emoji: avatar.emoji,
    imageUrl: `/sprites/${style}/${avatar.id}/sprites/base/base_${avatar.id}.png`,
    color: 'bg-amber-100 text-amber-900',
  }));
}

/**
 * Returns dynamic Wardrobe ShopItems rendered on the selected avatar base
 * and matching boy/girl style.
 */
export function getPixelWardrobeShopItems(
  avatarId: string = 'black_cat',
  preferredStyle: 'girl' | 'boy' = 'girl'
): ShopItem[] {
  const aid = avatarId || 'black_cat';
  return Object.values(SPRITE_ITEMS).map((item) => {
    const styleFolder = item.style === 'boy' ? 'boy' : (item.style === 'girl' ? 'girl' : preferredStyle);
    return {
      id: item.id,
      name: item.name,
      category: mapLayerToCategory(item.layer),
      collection: item.categoryName,
      rarity: item.rarity,
      price: item.price,
      description: `${item.name} (${item.style.toUpperCase()} Style - ${item.categoryName})`,
      emoji: '✨',
      imageUrl: `/sprites/${styleFolder}/${aid}/sprites/equipped/${item.id}.png`,
      color: getRarityColor(item.rarity),
      style: item.style,
      layer: item.layer,
    };
  });
}

/**
 * Returns dynamic Combo Sets rendered on the selected avatar base
 * and matching boy/girl style.
 */
export function getPixelComboShopItems(
  avatarId: string = 'black_cat',
  _preferredStyle: 'girl' | 'boy' = 'girl'
): ShopItem[] {
  const aid = avatarId || 'black_cat';
  return ALL_COMBOS.map((combo) => {
    const rawFileId = combo.id.replace(/_(girl|boy)$/, '');
    return {
      id: combo.id,
      name: combo.name,
      category: 'Combos',
      collection: `${combo.style.toUpperCase()} Sets`,
      rarity: 'Legendary',
      price: combo.price,
      description: `Complete Outfit: ${combo.items.map((i) => SPRITE_ITEMS[i]?.name || i).join(', ')}`,
      emoji: '👑',
      imageUrl: `/sprites/${combo.style}/${aid}/sprites/combos/${rawFileId}.png`,
      color: 'bg-purple-100 text-purple-900 border-purple-400',
      style: combo.style,
      items: combo.items,
    };
  });
}

/**
 * Builds the complete list of store items customized for the active avatar and gender style.
 * Only includes authentic sprite items from the official sprite repository.
 */
export function getStoreItemsForAvatar(
  avatarId: string = 'black_cat',
  genderStyle: 'girl' | 'boy' = 'girl'
): ShopItem[] {
  return [
    ...getPixelAvatarShopItems(genderStyle),
    ...getPixelWardrobeShopItems(avatarId, genderStyle),
    ...getPixelComboShopItems(avatarId, genderStyle),
  ];
}

// Default export list for backward compatibility (matches black_cat / girl default)
export const PIXEL_AVATAR_SHOP_ITEMS: ShopItem[] = getPixelAvatarShopItems('girl');
export const PIXEL_WARDROBE_SHOP_ITEMS: ShopItem[] = getPixelWardrobeShopItems('black_cat', 'girl');
export const PIXEL_COMBO_SHOP_ITEMS: ShopItem[] = getPixelComboShopItems('black_cat', 'girl');

// Only authentic sprite items are included in the store!
export const SHOP_ITEMS: ShopItem[] = [
  ...PIXEL_AVATAR_SHOP_ITEMS,
  ...PIXEL_WARDROBE_SHOP_ITEMS,
  ...PIXEL_COMBO_SHOP_ITEMS,
];
