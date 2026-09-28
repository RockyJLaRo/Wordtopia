import { useState, useMemo } from 'react';
import { useProgressStore } from '../store/useProgressStore';
import { useAuthStore } from '../store/useAuthStore';
import { getStoreItemsForAvatar } from '../data/shopItems';
import { AVATARS, SPRITE_ITEMS, ALL_COMBOS, SpriteLayer } from '../data/avatarSprites';
import { PixelAvatar } from '../components/PixelAvatar';
import {
  Sparkles,
  Shirt,
  ChevronLeft,
  Search,
  Pencil,
  Check,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkle,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { playTabSound, playMascotSound, playClickSound } from '../utils/audio';

const WARDROBE_SLOT_TABS: { id: string; label: string; layer?: SpriteLayer }[] = [
  { id: 'All', label: 'All Items' },
  { id: 'Combos', label: 'Outfit Sets' },
  { id: 'Headwear', label: 'Headwear', layer: 'HEAD' },
  { id: 'Face', label: 'Face', layer: 'FACE' },
  { id: 'Neck', label: 'Neck', layer: 'NECK' },
  { id: 'Outfit', label: 'Outfits', layer: 'BODY' },
  { id: 'Back', label: 'Wings & Back', layer: 'BACK' },
  { id: 'Tail', label: 'Tails', layer: 'TAIL' },
  { id: 'Hand', label: 'Handheld', layer: 'HAND' },
  { id: 'Aura', label: 'Textures & Auras', layer: 'TEXTURE' },
  { id: 'Avatar', label: 'Avatars' },
];

export function Wordrobe() {
  const {
    inventory,
    equipped,
    equipItem,
    clearEquipped,
    equipCombo,
    unlockedAvatars,
    mascotBaseId,
    setMascotBase,
    mascotName,
    setMascotName,
    wardrobeStyle = 'all',
    setWardrobeStyle,
  } = useProgressStore();

  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('All');
  const [styleFilter, setStyleFilter] = useState<'all' | 'neutral' | 'girl' | 'boy'>('all');
  const [closetMode, setClosetMode] = useState<'owned' | 'all'>('owned');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(3); // 1=64px, 2=128px, 3=192px, 4=256px
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(mascotName || 'Shadow');

  const currentAvatarId = mascotBaseId || 'black_cat';

  const handleSaveName = async () => {
    const finalName = tempName.trim() || 'Shadow';
    setMascotName(finalName);
    setIsRenaming(false);
    if (token) {
      try {
        await fetch('/api/progress/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ mascotName: finalName }),
        });
      } catch {}
    }
  };

  // Build the list of available items based on inventory, tab, style, and search
  const availableItems = useMemo(() => {
    const ownedSet = new Set(inventory);
    const preferredGender = styleFilter === 'boy' ? 'boy' : 'girl';
    const storeItems = getStoreItemsForAvatar(currentAvatarId, preferredGender);

    return storeItems.filter((item) => {
      // 1. Tab category filter
      if (activeTab === 'Combos') {
        if (item.category !== 'Combos') return false;
      } else if (activeTab !== 'All' && item.category !== activeTab) {
        return false;
      }

      // 2. Style pack filter (neutral, girl, boy)
      if (styleFilter !== 'all' && item.style) {
        if (item.style !== 'neutral' && item.style !== styleFilter) return false;
      }

      // 3. Ownership: for wardrobe items, check if player owns (unless in try-on all mode)
      if (closetMode === 'owned') {
        if (item.category !== 'Avatar' && item.category !== 'Combos') {
          if (!ownedSet.has(item.id)) return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.collection.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [inventory, activeTab, styleFilter, closetMode, searchQuery, currentAvatarId]);

  // Handle equipping or unequipping items
  const handleItemClick = (item: any) => {
    if (item.category === 'Avatar') {
      setMascotBase(item.id);
    } else if (item.category === 'Combos') {
      if (item.items && item.items.length > 0) {
        equipCombo(item.items);
      }
    } else {
      const slot = item.layer || item.category;
      equipItem(slot, item.id);
    }
  };

  const isItemEquipped = (item: any) => {
    if (item.category === 'Avatar') {
      return currentAvatarId === item.id;
    }
    if (item.category === 'Combos') {
      if (!item.items) return false;
      return item.items.every((id: string) => {
        const meta = SPRITE_ITEMS[id];
        return meta && equipped[meta.layer] === id;
      });
    }
    const slot = item.layer || item.category;
    return equipped[slot] === item.id;
  };

  const handleClearEquipment = () => {
    // Clear all equipped wardrobe layers except the base avatar
    clearEquipped();
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-3 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="p-2 sm:p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-50 transition-colors text-slate-600 shrink-0 border border-slate-200"
          >
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-800 flex items-center gap-2">
              <Shirt className="text-amber-500 w-6 h-6 sm:w-8 sm:h-8" />
              The Wordrobe
            </h1>
            <p className="text-slate-500 font-bold text-xs sm:text-base">
              Dress up your authentic 64x64 pixel-art companion!
            </p>
          </div>
        </div>

        {/* Mode & Style Selectors */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {/* Closet Mode Selector: My Closet vs Try-On Catalog */}
          <div className="flex items-center bg-white p-1 rounded-2xl border-2 border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => setClosetMode('owned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                closetMode === 'owned'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🎒 My Closet
            </button>
            <button
              type="button"
              onClick={() => setClosetMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                closetMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              ✨ Try-On All
            </button>
          </div>

          {/* Style Pack Selector: All / Boy / Girl / Neutral */}
          <div className="flex items-center bg-white p-1 rounded-2xl border-2 border-slate-200 shadow-sm">
            <span className="text-xs font-black text-slate-400 px-2.5 hidden md:inline">Style:</span>
            {[
              { id: 'all', label: '✨ All' },
              { id: 'boy', label: '👦 Boy Items' },
              { id: 'girl', label: '👧 Girl Items' },
              { id: 'neutral', label: '🌟 Neutral' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  const style = id as 'all' | 'neutral' | 'girl' | 'boy';
                  setStyleFilter(style);
                  setWardrobeStyle(style);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  styleFilter === id
                    ? id === 'boy'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : id === 'girl'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Mascot Live Stage & Controls */}
        <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0">
          <div className="bg-white rounded-3xl p-5 border-4 border-amber-200 shadow-xl flex flex-col items-center relative overflow-hidden">
            {/* Background stage glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-100/60 via-amber-50/30 to-white pointer-events-none" />

            {/* Stage Top Bar: Renaming & Zoom Controls */}
            <div className="relative z-10 w-full flex items-center justify-between mb-3">
              {/* Mascot Name Editor */}
              {isRenaming ? (
                <div className="flex items-center gap-1 bg-white rounded-xl border-2 border-amber-400 p-1 shadow-sm">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={14}
                    className="text-xs sm:text-sm font-black text-slate-800 px-2 py-0.5 outline-none w-24 sm:w-28"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempName(mascotName || 'Shadow');
                    setIsRenaming(true);
                  }}
                  className="flex items-center gap-1.5 bg-amber-100/80 hover:bg-amber-200 text-amber-900 px-3 py-1 rounded-xl text-xs font-black transition-colors"
                  title="Rename Companion"
                >
                  <span>{mascotName || 'Shadow'}</span>
                  <Pencil size={12} className="opacity-70" />
                </button>
              )}

              {/* Pixel Art Zoom Controls (Section 12.17) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 1))}
                  disabled={zoomLevel <= 1}
                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-[11px] font-black text-slate-600 px-1 select-none">
                  {zoomLevel}x
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(5, z + 1))}
                  disabled={zoomLevel >= 5}
                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            {/* Mascot Live Display (Nearest-Neighbor 64x64 Composite) */}
            <div className="relative z-10 my-2 flex items-center justify-center p-3 bg-gradient-to-b from-amber-50/50 to-amber-100/50 rounded-2xl border-2 border-amber-200 shadow-inner">
              <PixelAvatar
                avatarId={currentAvatarId}
                equipped={equipped}
                style={styleFilter === 'boy' ? 'boy' : 'girl'}
                size={64}
                zoom={zoomLevel}
                animated
              />
            </div>

            {/* Pedestal Shadow */}
            <div className="w-36 h-3 bg-amber-900/10 rounded-full blur-xs -mt-1 mb-3" />

            {/* Quick Actions */}
            <div className="relative z-10 w-full flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-500">
                Avatar: <strong className="text-slate-800">{AVATARS.find(a => a.id === currentAvatarId)?.name || 'Black Cat'}</strong>
              </span>
              <button
                onClick={handleClearEquipment}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-600 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                title="Remove All Clothing And Accessories"
              >
                <RotateCcw size={12} />
                Unequip All
              </button>
            </div>
          </div>

          {/* Avatar Switcher Carousel (The 8 canonical avatars) */}
          <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-amber-500" />
                Switch Avatar Base (8 Pets)
              </h3>

              {/* Boy / Girl Gender Toggle right near avatar selector */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    playTabSound();
                    setStyleFilter('boy');
                    setWardrobeStyle('boy');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                    styleFilter === 'boy'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title="Switch To Boy Style Avatar & Items"
                >
                  👦 Boy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTabSound();
                    setStyleFilter('girl');
                    setWardrobeStyle('girl');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                    styleFilter === 'girl' || styleFilter === 'all'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title="Switch To Girl Style Avatar & Items"
                >
                  👧 Girl
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map((avatar) => {
                const isSelected = currentAvatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      playMascotSound();
                      setMascotBase(avatar.id);
                    }}
                    className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                    title={`Switch Mascot Companion To ${avatar.name}`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <PixelAvatar 
                        avatarId={avatar.id} 
                        style={styleFilter === 'boy' ? 'boy' : 'girl'} 
                        size={40} 
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-700 truncate max-w-full mt-1">
                      {avatar.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Wardrobe Item Inventory & Categories */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Slot / Category Tabs */}
          <div className="bg-white rounded-2xl p-2 border-2 border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {WARDROBE_SLOT_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playTabSound();
                      setActiveTab(tab.id);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search bar & count info */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, sets, colors..."
                className="w-full bg-white pl-9 pr-4 py-2 rounded-xl border-2 border-slate-200 text-xs sm:text-sm font-bold text-slate-700 outline-none focus:border-amber-400 transition-colors shadow-sm"
              />
            </div>
            <div className="text-xs font-bold text-slate-500">
              Showing <strong className="text-slate-800">{availableItems.length}</strong> items
            </div>
          </div>

          {/* Items Grid */}
          {availableItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center my-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3 text-2xl">
                🎒
              </div>
              <h3 className="text-base font-black text-slate-700 mb-1">
                No items found
              </h3>
              <p className="text-xs font-medium text-slate-500 max-w-sm mb-4">
                {activeTab === 'Combos'
                  ? 'No matching outfit combos. Try clearing the search or switching style packs.'
                  : 'You have not unlocked any items in this category yet. Earn gold in games and visit the Marketplace!'}
              </p>
              <Link
                to="/shop"
                className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all"
              >
                Visit Shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {availableItems.map((item) => {
                const equippedActive = isItemEquipped(item);
                const isCombo = item.category === 'Combos';

                return (
                  <button
                    key={`${item.id}_${item.style || ''}_${item.category}`}
                    onClick={() => handleItemClick(item)}
                    title={`${item.name} (${item.category}${item.style ? ` - ${item.style.charAt(0).toUpperCase() + item.style.slice(1)}` : ''})`}
                    className={`relative p-3 rounded-2xl border-3 transition-all flex flex-col items-center gap-2 text-center group active:scale-95 ${
                      equippedActive
                        ? 'bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-300/40'
                        : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Equipped Badge */}
                    {equippedActive && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-sm z-10">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}

                    {/* Style Tag (Neutral / Girl / Boy) */}
                    {item.style && (
                      <span
                        className={`absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          item.style === 'boy'
                            ? 'bg-blue-100 text-blue-700'
                            : item.style === 'girl'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.style}
                      </span>
                    )}

                    {/* Thumbnail: Authentic Pixel Art Asset Preview */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl flex items-center justify-center p-1 border border-slate-100 group-hover:scale-105 transition-transform overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain pixel-art"
                          style={{ imageRendering: 'pixelated' }}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.includes('/sprites/') && !target.src.includes('githubusercontent.com') && !target.src.includes('rockyjlaro.github.io')) {
                              target.src = `https://raw.githubusercontent.com/RockyJLaRo/RockyJLaRo.github.io/main/Vocab_Sprites${item.imageUrl}`;
                            } else if (target.src.includes('githubusercontent.com')) {
                              target.src = `https://rockyjlaro.github.io/Vocab_Sprites${item.imageUrl}`;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-3xl">{item.emoji || '✨'}</span>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="w-full">
                      <h4 className="font-black text-slate-800 text-xs sm:text-sm leading-tight truncate">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">
                        {item.collection || item.category}
                      </p>
                      {isCombo && item.items && (
                        <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full inline-block mt-1">
                          {item.items.length} items look
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
