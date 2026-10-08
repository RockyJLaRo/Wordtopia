import React, { useState, useMemo } from 'react';
import { useProgressStore } from '../store/useProgressStore';
import { getStoreItemsForAvatar } from '../data/shopItems';
import { AVATARS, SPRITE_ITEMS, SpriteLayer } from '../data/avatarSprites';
import { PixelAvatar } from '../components/PixelAvatar';
import { ShopItem } from '../types';
import { resolveEquippedItemForLayer, normalizeLayerName } from '../utils/avatarRenderer';
import {
  Coins,
  Sparkles,
  CheckCircle2,
  Lock,
  Eye,
  X,
  AlertCircle,
  Search,
  Shirt,
  ShoppingBag,
  RotateCcw,
  SlidersHorizontal,
  PackageSearch,
  Layers,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { confetti } from '../utils/confetti';
import { GameGraphic } from '../components/GameGraphic';
import { haptic } from '../utils/haptics';
import { playClickSound, playTabSound, playMascotSound } from '../utils/audio';

const RARITY_COLORS: Record<string, string> = {
  Common: 'bg-slate-100 border-slate-300 text-slate-700',
  Uncommon: 'bg-green-100 border-green-300 text-green-700',
  Rare: 'bg-blue-100 border-blue-300 text-blue-700',
  Epic: 'bg-purple-100 border-purple-300 text-purple-700',
  Legendary: 'bg-orange-100 border-orange-300 text-orange-700',
  Mythic: 'bg-red-100 border-red-300 text-red-700',
};

const RARITY_WEIGHTS: Record<string, number> = {
  Mythic: 6,
  Legendary: 5,
  Epic: 4,
  Rare: 3,
  Uncommon: 2,
  Common: 1,
};

type OwnershipFilter = 'all' | 'not_purchased' | 'purchased';
type SortOption = 'default' | 'price_asc' | 'price_desc' | 'name_asc' | 'rarity_desc';

const QUICK_SEARCH_CHIPS = [
  { label: '👑 Crowns', query: 'crown' },
  { label: '✨ Celestial', query: 'celestial' },
  { label: '🧙 Wizard', query: 'wizard' },
  { label: '⚡ Trails', query: 'trail' },
  { label: '💎 Mythic', query: 'mythic' },
  { label: '🔥 Legendary', query: 'legendary' },
  { label: '👕 Outfits', query: 'outfit' },
  { label: '❄️ Winter', query: 'winter' },
];

export function Shop() {
  const {
    coins,
    spendCoins,
    unlockItem,
    inventory,
    equipped,
    equipItem,
    equipCombo,
    unlockedAvatars,
    mascotBaseId,
    setMascotBase,
    unlockAvatar,
  } = useProgressStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [styleFilter, setStyleFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRarity, setSelectedRarity] = useState<string>('All');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // Modals
  const [inspectItem, setInspectItem] = useState<ShopItem | null>(null);
  const [buyItem, setBuyItem] = useState<ShopItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const currentAvatarId = mascotBaseId || 'black_cat';
  const effectiveGenderStyle: 'girl' | 'boy' = styleFilter === 'boy' ? 'boy' : 'girl';

  // Dynamic store items that update when mascotBaseId or styleFilter changes
  const activeStoreItems = useMemo(() => {
    return getStoreItemsForAvatar(currentAvatarId, effectiveGenderStyle);
  }, [currentAvatarId, effectiveGenderStyle]);

  // Helper to determine ownership
  const isItemOwned = (item: ShopItem): boolean => {
    if (inventory.includes(item.id)) return true;
    const rawId = item.id.replace(/_(girl|boy)$/, '');
    if (inventory.includes(rawId)) return true;
    if (item.category === 'Avatar') {
      const rawAvatarId = item.id.replace(/^avatar_/, '');
      return (
        (unlockedAvatars || []).includes(item.id) ||
        (unlockedAvatars || []).includes(rawAvatarId)
      );
    }
    if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      return item.items.every((it) => inventory.includes(it));
    }
    return false;
  };

  // Helper to determine equipped state
  const isItemEquipped = (item: ShopItem): boolean => {
    if (item.category === 'Avatar') {
      const rawId = item.id.replace(/^avatar_/, '');
      return mascotBaseId === rawId || mascotBaseId === item.id;
    }
    if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      return item.items.every((it) => {
        const meta = SPRITE_ITEMS[it];
        return meta && resolveEquippedItemForLayer(meta.layer, equipped) === it;
      });
    }
    const layer = (item.layer as SpriteLayer) || normalizeLayerName(item.category) || 'BODY';
    return resolveEquippedItemForLayer(layer, equipped) === item.id;
  };

  // Unique categories list
  const categories = useMemo(() => {
    const set = new Set(activeStoreItems.map((i) => i.category));
    return ['All', ...Array.from(set)];
  }, [activeStoreItems]);

  // Filter items based on Category, Rarity, and Search Query
  const baseFilteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return activeStoreItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Style pack filter (Boy items vs Girl items)
      if (styleFilter !== 'all') {
        if (item.category !== 'Avatar') {
          if (item.style && item.style !== 'neutral' && item.style !== styleFilter) {
            return false;
          }
        }
      }

      // Rarity filter
      if (selectedRarity !== 'All' && item.rarity !== selectedRarity) {
        return false;
      }

      // Search Query filter
      if (q) {
        const owned = isItemOwned(item);
        const equippedStatus = isItemEquipped(item);

        const matchesText =
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.collection.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.rarity.toLowerCase().includes(q);

        // Smart keyword searches
        const matchesKeyword =
          ((q === 'purchased' || q === 'owned' || q === 'bought') && owned) ||
          ((q === 'not purchased' || q === 'unpurchased' || q === 'available' || q === 'store' || q === 'buy') && !owned) ||
          (q === 'equipped' && equippedStatus) ||
          ((q === 'affordable' || q === 'can afford') && !owned && coins >= item.price);

        if (!matchesText && !matchesKeyword) {
          return false;
        }
      }

      return true;
    });
  }, [activeStoreItems, searchQuery, selectedCategory, styleFilter, selectedRarity, inventory, unlockedAvatars, equipped, mascotBaseId, coins]);

  // Live item counts by ownership under active query & filters
  const countAll = baseFilteredItems.length;
  const countNotPurchased = useMemo(
    () => baseFilteredItems.filter((i) => !isItemOwned(i)).length,
    [baseFilteredItems, inventory, unlockedAvatars]
  );
  const countPurchased = useMemo(
    () => baseFilteredItems.filter((i) => isItemOwned(i)).length,
    [baseFilteredItems, inventory, unlockedAvatars]
  );

  // Total catalog counts (unfiltered) for headline badges
  const totalCatalogAll = activeStoreItems.length;
  const totalCatalogPurchased = useMemo(
    () => activeStoreItems.filter((i) => isItemOwned(i)).length,
    [activeStoreItems, inventory, unlockedAvatars]
  );
  const totalCatalogNotPurchased = totalCatalogAll - totalCatalogPurchased;

  // Items after applying ownership tab filter
  const displayedItems = useMemo(() => {
    let items = baseFilteredItems;

    if (ownershipFilter === 'not_purchased') {
      items = items.filter((i) => !isItemOwned(i));
    } else if (ownershipFilter === 'purchased') {
      items = items.filter((i) => isItemOwned(i));
    }

    // Apply sorting
    const sorted = [...items];
    if (sortOption === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name_asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'rarity_desc') {
      sorted.sort((a, b) => (RARITY_WEIGHTS[b.rarity] || 0) - (RARITY_WEIGHTS[a.rarity] || 0));
    }

    return sorted;
  }, [baseFilteredItems, ownershipFilter, sortOption, inventory, unlockedAvatars]);

  const handleConfirmBuy = () => {
    if (!buyItem || isPurchasing) return;
    if (isItemOwned(buyItem)) {
      setBuyItem(null);
      return;
    }
    setIsPurchasing(true);
    if (spendCoins(buyItem.price, `Purchased ${buyItem.name}`)) {
      haptic.purchase();
      unlockItem(buyItem.id);
      const rawId = buyItem.id.replace(/_(girl|boy)$/, '');
      if (rawId !== buyItem.id) {
        unlockItem(rawId);
      }
      if (buyItem.items && Array.isArray(buyItem.items)) {
        for (const it of buyItem.items) {
          unlockItem(it);
        }
      }
      if (buyItem.category === 'Avatar') {
        const rawAvatarId = buyItem.id.replace(/^avatar_/, '');
        unlockAvatar(rawAvatarId);
      }
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#38bdf8', '#fbbf24', '#f472b6'],
      });
      setBuyItem(null);
      if (inspectItem?.id === buyItem.id) setInspectItem(null);
    } else {
      haptic.error();
    }
    setIsPurchasing(false);
  };

  const handleEquip = (item: ShopItem) => {
    if (!isItemOwned(item)) return;
    haptic.equip();
    if (item.category === 'Avatar') {
      const rawId = item.id.replace(/^avatar_/, '');
      setMascotBase(rawId);
    } else if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      equipCombo(item.items);
    } else {
      const slot = item.layer || item.category;
      equipItem(slot, item.id);
    }
  };

  const handleResetFilters = () => {
    haptic.light();
    setSearchQuery('');
    setOwnershipFilter('all');
    setStyleFilter('all');
    setSelectedCategory('All');
    setSelectedRarity('All');
    setSortOption('default');
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Header & Balance Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-800 flex items-center gap-2 sm:gap-3">
            <Sparkles className="text-yellow-500 w-7 h-7 sm:w-9 sm:h-9" />
            Marketplace
          </h1>
          <p className="text-slate-500 font-medium text-xs sm:text-base mt-0.5 sm:mt-1">
            Search and collect avatar accessories, hats, outfits, and auras!
          </p>
        </div>

        <div 
          className="bg-amber-100 border-2 sm:border-4 border-amber-300 rounded-2xl p-3 sm:p-4 flex items-center gap-3 self-stretch sm:self-auto shadow-sm"
          title="Current Coin Balance Available To Spend"
        >
          <div className="bg-amber-400 p-1.5 sm:p-2 rounded-full shrink-0">
            <Coins className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-amber-800 font-bold text-xs sm:text-sm leading-none">Your Balance</p>
            <p className="text-amber-600 font-black text-xl sm:text-2xl leading-none mt-1">
              {coins} Coins
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH BAR & DUAL STATUS DISCOVERY */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm mb-5 space-y-4">
        {/* Main Search Input */}
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, rarity, category, or collection (e.g. 'crown', 'celestial', 'wizard')..."
            className="w-full pl-11 pr-10 py-3 sm:py-3.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-2 border-slate-200 focus:border-sky-400 rounded-2xl text-sm sm:text-base font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:ring-4 focus:ring-sky-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear Search Query"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Quick Search Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <SlidersHorizontal size={12} /> Popular:
          </span>
          {QUICK_SEARCH_CHIPS.map((chip) => {
            const isActive = searchQuery.toLowerCase() === chip.query;
            return (
              <button
                key={chip.query}
                onClick={() => {
                  haptic.selection();
                  setSearchQuery(isActive ? '' : chip.query);
                }}
                className={cn(
                  'px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all border shrink-0',
                  isActive
                    ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* OWNERSHIP TABS: All Items, Not Purchased (Store), Purchased (My Items) */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-full md:w-auto overflow-x-auto scrollbar-hide">
            <button
              onClick={() => {
                haptic.selection();
                setOwnershipFilter('all');
              }}
              className={cn(
                'flex-1 md:flex-initial px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center justify-center gap-1.5',
                ownershipFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Sparkles size={14} className={ownershipFilter === 'all' ? 'text-amber-500' : 'text-slate-400'} />
              <span>All Items</span>
              <span
                className={cn(
                  'text-[10px] sm:text-xs px-2 py-0.2 rounded-full font-bold ml-1',
                  ownershipFilter === 'all'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-slate-200/80 text-slate-500'
                )}
              >
                {countAll}
              </span>
            </button>

            <button
              onClick={() => {
                haptic.selection();
                setOwnershipFilter('not_purchased');
              }}
              className={cn(
                'flex-1 md:flex-initial px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center justify-center gap-1.5',
                ownershipFilter === 'not_purchased'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <ShoppingBag size={14} />
              <span>Available to Buy</span>
              <span
                className={cn(
                  'text-[10px] sm:text-xs px-2 py-0.2 rounded-full font-bold ml-1',
                  ownershipFilter === 'not_purchased'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200/80 text-slate-500'
                )}
              >
                {countNotPurchased}
              </span>
            </button>

            <button
              onClick={() => {
                haptic.selection();
                setOwnershipFilter('purchased');
              }}
              className={cn(
                'flex-1 md:flex-initial px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center justify-center gap-1.5',
                ownershipFilter === 'purchased'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <CheckCircle2 size={14} />
              <span>Purchased</span>
              <span
                className={cn(
                  'text-[10px] sm:text-xs px-2 py-0.2 rounded-full font-bold ml-1',
                  ownershipFilter === 'purchased'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200/80 text-slate-500'
                )}
              >
                {countPurchased}
              </span>
            </button>
          </div>

          {/* Sort & Rarity Controls */}
          <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto">
            {/* Rarity selector */}
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="flex-1 md:flex-initial px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Rarities</option>
              <option value="Mythic">Mythic</option>
              <option value="Legendary">Legendary</option>
              <option value="Epic">Epic</option>
              <option value="Rare">Rare</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Common">Common</option>
            </select>

            {/* Sort selector */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="flex-1 md:flex-initial px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="default">Sort: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="rarity_desc">Rarity: Highest First</option>
            </select>

            {(searchQuery || selectedCategory !== 'All' || selectedRarity !== 'All' || sortOption !== 'default' || ownershipFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                title="Reset All Filters"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AVATAR SELECTOR & BOY/GIRL TOGGLE BAR */}
      <div className="mb-4 bg-white border-2 border-amber-200 rounded-3xl p-3 sm:p-4 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-amber-500 shrink-0" />
            <div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Fitting Avatar: <strong className="text-amber-600">{AVATARS.find(a => a.id === currentAvatarId)?.name || 'Black Cat'}</strong>
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                Selecting an avatar changes all store previews and items to fit your companion!
              </p>
            </div>
          </div>

          {/* Boy / Girl Gender Toggle right near avatar selector */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Style:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  playTabSound();
                  setStyleFilter('boy');
                }}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1',
                  styleFilter === 'boy'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                )}
                title="Filter To Boy Items & Sprites"
              >
                👦 Boy
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  playTabSound();
                  setStyleFilter('girl');
                }}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1',
                  styleFilter === 'girl'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                )}
                title="Filter To Girl Items & Sprites"
              >
                👧 Girl
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  playTabSound();
                  setStyleFilter('all');
                }}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1',
                  styleFilter === 'all'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                )}
                title="Show All Items"
              >
                ✨ All
              </button>
            </div>
          </div>
        </div>

        {/* 8 Pixel Companions Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {AVATARS.map((avatar) => {
            const isSelected = currentAvatarId === avatar.id;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  playMascotSound();
                  setMascotBase(avatar.id);
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 transition-all shrink-0 cursor-pointer',
                  isSelected
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100'
                )}
                title={`Switch Store Items To ${avatar.name}`}
              >
                <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                  <PixelAvatar
                    avatarId={avatar.id}
                    style={styleFilter === 'boy' ? 'boy' : 'girl'}
                    size={32}
                  />
                </div>
                <div className="text-left">
                  <p className={cn('text-xs font-black leading-tight', isSelected ? 'text-amber-900' : 'text-slate-700')}>
                    {avatar.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold leading-none">
                    {isSelected ? 'Active Fit' : 'Click to Fit'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CATEGORY CHIPS */}
      <div className="flex gap-2 overflow-x-auto pb-3 sm:pb-4 scrollbar-hide mb-3 sm:mb-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                haptic.selection();
                playTabSound();
                setSelectedCategory(cat);
              }}
              className={cn(
                'px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95 border-2',
                isSelected
                  ? 'bg-sky-100 text-sky-700 shadow-sm border-sky-300'
                  : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* RESULT STATUS BANNER */}
      {searchQuery && (
        <div className="mb-4 flex items-center justify-between bg-sky-50 border border-sky-200 rounded-2xl px-4 py-2.5 text-xs text-sky-800">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-sky-600" />
            <span>
              Searching for <strong>"{searchQuery}"</strong> • Showing <strong>{displayedItems.length}</strong> {ownershipFilter === 'all' ? 'items' : ownershipFilter === 'purchased' ? 'purchased items' : 'items available to buy'}
            </span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="text-sky-600 hover:text-sky-900 font-bold underline text-xs"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* ITEM GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 pb-20">
        {/* CROSS-TAB SMART SUGGESTION: If on Purchased tab with 0 matches, but matching items exist in Store */}
        {displayedItems.length === 0 && ownershipFilter === 'purchased' && countNotPurchased > 0 && (
          <div className="col-span-full py-10 px-6 bg-white border-2 border-dashed border-amber-200 rounded-3xl text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl mx-auto flex items-center justify-center">
              <ShoppingBag size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800">
              No Purchased Items Match {searchQuery ? `"${searchQuery}"` : 'This Filter'}
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              You haven't purchased these items yet, but <strong>{countNotPurchased} item{countNotPurchased !== 1 ? 's' : ''}</strong> matching your search {countNotPurchased === 1 ? 'is' : 'are'} available in the Store!
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  haptic.medium();
                  setOwnershipFilter('not_purchased');
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5"
              >
                <ShoppingBag size={16} />
                <span>View {countNotPurchased} Available in Store</span>
              </button>
            </div>
          </div>
        )}

        {/* CROSS-TAB SMART SUGGESTION: If on Store tab with 0 matches, but matching items already owned */}
        {displayedItems.length === 0 && ownershipFilter === 'not_purchased' && countPurchased > 0 && (
          <div className="col-span-full py-10 px-6 bg-white border-2 border-dashed border-emerald-200 rounded-3xl text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800">You Already Own Matching Items!</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              You have already purchased <strong>{countPurchased} item{countPurchased !== 1 ? 's' : ''}</strong> matching {searchQuery ? `"${searchQuery}"` : 'your search'}.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  haptic.medium();
                  setOwnershipFilter('purchased');
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>View My Purchased Items ({countPurchased})</span>
              </button>
            </div>
          </div>
        )}

        {/* GENERAL EMPTY STATE: 0 items anywhere */}
        {displayedItems.length === 0 && (ownershipFilter === 'all' || (countNotPurchased === 0 && countPurchased === 0)) && (
          <div className="col-span-full py-12 px-6 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
              <PackageSearch size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800">No Store Items Found</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              {searchQuery
                ? `No items found matching "${searchQuery}". Try searching for synonyms or checking other categories.`
                : "No items match your active filters."}
            </p>
            <div className="pt-2">
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all active:scale-95 inline-flex items-center gap-1.5"
              >
                <RotateCcw size={15} />
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* ITEM CARDS */}
        {displayedItems.map((item) => {
          const isOwned = isItemOwned(item);
          const isEquipped = isItemEquipped(item);
          const canAfford = coins >= item.price;

          return (
            <div
              key={`${item.id}_${item.style || ''}_${item.category}`}
              className={cn(
                'relative bg-white rounded-3xl p-5 border-4 transition-all duration-300 flex flex-col group',
                isOwned
                  ? 'border-emerald-100 hover:border-emerald-300 hover:shadow-lg'
                  : 'border-slate-100 hover:border-amber-200 hover:-translate-y-1 hover:shadow-xl'
              )}
            >
              {/* Card Badges: Rarity, Ownership Status, Category */}
              <div className="flex justify-between items-start mb-3 gap-1">
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                    RARITY_COLORS[item.rarity] || 'bg-slate-100 text-slate-700'
                  )}
                >
                  {item.rarity}
                </span>

                <div className="flex items-center gap-1">
                  {/* Ownership Status Badge */}
                  {isOwned ? (
                    isEquipped ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-700 border border-sky-300 flex items-center gap-1">
                        <Sparkles size={11} /> Equipped
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Purchased
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1">
                      <Coins size={11} /> Available
                    </span>
                  )}

                  <span className="text-slate-400 text-[11px] font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Preview Avatar / Item Square */}
              <div
                className={cn(
                  'w-full aspect-square rounded-2xl mb-4 flex items-center justify-center text-7xl shadow-inner transition-transform group-hover:scale-105 relative overflow-hidden p-4',
                  item.color
                )}
              >
                <GameGraphic
                  type={item.category === 'Avatar' ? 'avatar' : 'item'}
                  name={item.name}
                  emoji={item.emoji}
                  category={item.category}
                  src={item.imageUrl}
                  size="xl"
                  className="w-full h-full bg-transparent border-0 shadow-none text-6xl"
                />

                {/* Inspect Button overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                  <button
                    onClick={() => {
                      haptic.medium();
                      setInspectItem(item);
                    }}
                    className="bg-white text-slate-800 p-3 rounded-full hover:scale-110 transition-transform shadow-lg"
                    title="Inspect Item In 3D View"
                  >
                    <Eye size={22} />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="flex-1">
                <h3 className="font-black text-lg text-slate-800 leading-tight mb-1">{item.name}</h3>
                <p className="text-sky-600 text-xs font-bold mb-1.5 uppercase tracking-wide">
                  {item.collection}
                </p>
                <p className="text-slate-500 text-xs sm:text-sm font-medium leading-snug line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* Action Buttons: Equip or Purchase */}
              <div className="mt-4 pt-4 border-t-2 border-slate-100">
                {isOwned ? (
                  <button
                    onClick={() => handleEquip(item)}
                    disabled={isEquipped}
                    title={isEquipped ? 'Currently Equipped' : `Equip ${item.name}`}
                    className={cn(
                      'w-full py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs sm:text-sm',
                      isEquipped
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                    )}
                  >
                    {isEquipped ? (
                      <>
                        <CheckCircle2 size={16} />
                        Equipped
                      </>
                    ) : (
                      <>
                        <Shirt size={16} />
                        Equip Item
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      haptic.medium();
                      setBuyItem(item);
                    }}
                    disabled={!canAfford}
                    title={
                      canAfford
                        ? `Purchase ${item.name} For ${item.price} Coins`
                        : `Need ${item.price - coins} More Coins To Purchase`
                    }
                    className={cn(
                      'w-full py-2.5 sm:py-3 rounded-xl font-black flex items-center justify-center gap-1.5 transition-all text-xs sm:text-sm',
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-md shadow-amber-500/20 active:scale-95'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    )}
                  >
                    {!canAfford && <Lock size={15} className="mr-0.5" />}
                    <Coins size={16} className={canAfford ? 'text-amber-100' : 'text-slate-300'} />
                    <span>{item.price} Coins</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* INSPECT MODAL */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 max-w-sm w-full shadow-2xl relative border-4 sm:border-8 border-white max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectItem(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-slate-100 text-slate-500 p-1.5 sm:p-2 rounded-full hover:bg-slate-200 transition-colors z-10"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>

            <div className="text-center">
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4 sm:mb-6">
                <span
                  className={cn(
                    'inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-bold border-2',
                    RARITY_COLORS[inspectItem.rarity] || 'bg-slate-100'
                  )}
                >
                  {inspectItem.rarity} {inspectItem.category}
                </span>

                {isItemOwned(inspectItem) ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-emerald-100 text-emerald-800 border-2 border-emerald-300">
                    <CheckCircle2 size={14} /> Purchased
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-amber-100 text-amber-800 border-2 border-amber-300">
                    <Coins size={14} /> Available
                  </span>
                )}
              </div>

              {/* 3D Showcase Area */}
              <div
                className={cn(
                  'w-36 h-36 sm:w-48 sm:h-48 mx-auto rounded-full mb-4 sm:mb-8 flex items-center justify-center text-7xl sm:text-9xl shadow-inner border-4 border-white',
                  inspectItem.color
                )}
                style={{ perspective: '800px' }}
              >
                <div
                  className="animate-spin"
                  style={{
                    animationDuration: '8s',
                    animationTimingFunction: 'linear',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div
                    style={{
                      transform: 'rotateY(-20deg) rotateX(10deg)',
                      filter: 'drop-shadow(0 15px 10px rgba(0,0,0,0.2))',
                    }}
                  >
                    <GameGraphic
                      type={inspectItem.category === 'Avatar' ? 'avatar' : 'item'}
                      name={inspectItem.name}
                      emoji={inspectItem.emoji}
                      category={inspectItem.category}
                      src={inspectItem.imageUrl}
                      size="2xl"
                      className="w-24 h-24 sm:w-32 sm:h-32 bg-transparent border-0 shadow-none text-5xl sm:text-7xl"
                    />
                  </div>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-1 sm:mb-2">
                {inspectItem.name}
              </h2>
              <p className="text-amber-500 font-bold mb-2 sm:mb-4 uppercase tracking-widest text-xs sm:text-sm">
                {inspectItem.collection}
              </p>
              <p className="text-slate-600 font-medium text-sm sm:text-base bg-slate-50 p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6">
                "{inspectItem.description}"
              </p>

              {/* Action in Inspect Modal */}
              {isItemOwned(inspectItem) ? (
                <button
                  onClick={() => {
                    handleEquip(inspectItem);
                    setInspectItem(null);
                  }}
                  disabled={isItemEquipped(inspectItem)}
                  className={cn(
                    'w-full py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all',
                    isItemEquipped(inspectItem)
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20 active:scale-95'
                  )}
                >
                  {isItemEquipped(inspectItem) ? (
                    <>
                      <CheckCircle2 size={20} />
                      Currently Equipped
                    </>
                  ) : (
                    <>
                      <Shirt size={20} />
                      Equip Item Now
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setBuyItem(inspectItem)}
                  disabled={coins < inspectItem.price}
                  className={cn(
                    'w-full py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all',
                    coins >= inspectItem.price
                      ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-xl shadow-amber-500/20 active:scale-95'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {coins < inspectItem.price
                    ? 'Not Enough Coins'
                    : `Buy for ${inspectItem.price} Coins`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BUY CONFIRMATION MODAL */}
      {buyItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border-4 border-amber-200 text-center animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <AlertCircle size={28} className="sm:w-8 sm:h-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-1 sm:mb-2">
              Confirm Purchase
            </h3>
            <p className="text-slate-600 mb-4 sm:mb-6 font-medium text-xs sm:text-sm">
              Are you sure you want to buy{' '}
              <span className="font-bold text-slate-800">{buyItem.name}</span>?
            </p>

            <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col gap-2 text-xs sm:text-sm">
              <div className="flex justify-between font-bold text-slate-500">
                <span>Current Balance</span>
                <span className="text-amber-600">{coins} Coins</span>
              </div>
              <div className="flex justify-between font-bold text-slate-500">
                <span>Item Cost</span>
                <span className="text-red-500">-{buyItem.price} Coins</span>
              </div>
              <div className="h-px bg-slate-200 my-1"></div>
              <div className="flex justify-between font-black text-slate-800">
                <span>New Balance</span>
                <span className="text-emerald-600">{coins - buyItem.price} Coins</span>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setBuyItem(null)}
                className="flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors text-xs sm:text-base"
              >
                Cancel
              </button>
              <button
                disabled={isPurchasing}
                onClick={handleConfirmBuy}
                className="flex-1 py-2.5 sm:py-3 rounded-xl font-black text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-50 shadow-lg shadow-amber-500/30 transition-transform active:scale-95 text-xs sm:text-base cursor-pointer disabled:cursor-not-allowed"
              >
                {isPurchasing ? 'Purchasing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
