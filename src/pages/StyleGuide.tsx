import React, { useState } from 'react';
import { ChevronLeft, Sparkles, Palette, Eye, Shield, Compass, Layers, Check, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GameGraphic } from '../components/GameGraphic';
import { PixelAvatar } from '../components/PixelAvatar';
import { AVATARS } from '../data/avatarSprites';

export function StyleGuide() {
  const [qaAvatar, setQaAvatar] = useState('black_cat');
  const [qaEquipped, setQaEquipped] = useState<{ HEAD?: string; BODY?: string; BACK?: string }>({
    HEAD: 'pink_bow',
    BODY: 'princess_dress',
    BACK: 'fairy_wings',
  });
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-3 sm:p-6 md:p-12 max-w-6xl mx-auto space-y-6 sm:space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 border-b border-slate-800 pb-4 sm:pb-6">
        <Link
          to="/"
          className="p-2 sm:p-3 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
        >
          <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">Wordtopia Visual Style Guide</h1>
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] sm:text-xs font-bold">
              v1.2 Aurora Standard
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
            Core design constitution, character art guidelines, palette tokens, and asset pipeline standards.
          </p>
        </div>
      </div>

      {/* 1. Flagship Character Model (Inspired by reference photo) */}
      <section className="bg-slate-800/80 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="text-cyan-400" size={24} />
          <h2 className="text-2xl font-black text-white">1. Flagship Character Model: "Aurora"</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Inspired by the cosmic aurora astral cat reference, our character design pairs whimsical celestial themes with readable chibi proportions. Characters must remain cute, friendly, expressive, and easily identifiable down to 32px avatars on mobile screens.
        </p>

        {/* Character Showcase Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Idle Expression */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center space-y-3">
            <div className="w-36 h-36 flex items-center justify-center p-2 bg-slate-950/60 rounded-2xl border border-slate-800">
              <GameGraphic type="avatar" emoji="🐱" size="2xl" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Aurora (Idle Pose)</div>
              <div className="text-xs text-slate-400">Neutral friendly pose with diamond starry gaze</div>
            </div>
          </div>

          {/* Happy / Celebration */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center space-y-3">
            <div className="w-36 h-36 flex items-center justify-center p-2 bg-slate-950/60 rounded-2xl border border-slate-800">
              <GameGraphic type="avatar" emoji="😸" size="2xl" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Aurora (Celebrating)</div>
              <div className="text-xs text-slate-400">Raised white paws, joyful winking star eye & confetti</div>
            </div>
          </div>

          {/* Achievement Crest */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center space-y-3">
            <div className="w-36 h-36 flex items-center justify-center p-2 bg-slate-950/60 rounded-2xl border border-slate-800">
              <GameGraphic type="badge" size="2xl" className="text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Word Master Crest</div>
              <div className="text-xs text-slate-400">Polished golden award with embedded aurora gem</div>
            </div>
          </div>
        </div>

        {/* Proportions & Anatomy Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700/60 text-xs">
          <div className="space-y-2">
            <span className="font-bold uppercase tracking-wider text-cyan-400 text-[11px]">Proportions & Anatomy</span>
            <ul className="space-y-1.5 text-slate-300">
              <li>• <span className="font-bold text-white">Chibi Ratio:</span> 1:1 Head-to-body proportion for high cuteness and mobile screen clarity.</li>
              <li>• <span className="font-bold text-white">White Muzzle & Bib:</span> Muzzle mask peaks between eyes; chest bib features soft feathered tufts.</li>
              <li>• <span className="font-bold text-white">Starry Gaze:</span> Deep sapphire iris containing 4-point diamond star reflection.</li>
              <li>• <span className="font-bold text-white">Mittens & Boots:</span> Clean white paws on front and hind feet with distinct toe separators.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <span className="font-bold uppercase tracking-wider text-purple-400 text-[11px]">Rendering & Lines</span>
            <ul className="space-y-1.5 text-slate-300">
              <li>• <span className="font-bold text-white">Dark Outline Stroke:</span> Espresso `#272138` (stroke-width: 3.5px to 4.5px) prevents bleed on bright backgrounds.</li>
              <li>• <span className="font-bold text-white">Lighting Direction:</span> Gentle top-left celestial sheen; soft radial gradient drop shadow.</li>
              <li>• <span className="font-bold text-white">Swirl Accents:</span> Translucent aurora ribbon stripes overlaying base fur gradients.</li>
              <li>• <span className="font-bold text-white">Scalability:</span> 100% vector SVG rendering ensures crisp fidelity from phone to 4K displays.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2. Color Language Tokens */}
      <section className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Palette className="text-purple-400" size={24} />
          <h2 className="text-2xl font-black text-white">2. Color Language Tokens</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { name: 'Aurora Sky', hex: '#0284C7', desc: 'Base Sky & Outer Fur' },
            { name: 'Cyan Borealis', hex: '#06B6D4', desc: 'Aurora Ribbon Highlights' },
            { name: 'Emerald Sheen', hex: '#10B981', desc: 'Vibrant Green Nebula' },
            { name: 'Astral Indigo', hex: '#4F46E5', desc: 'Deep Cosmic Core' },
            { name: 'Starlight Violet', hex: '#9333EA', desc: 'Ear Outer & Magic' },
            { name: 'Cloud Tuft', hex: '#FFFFFF', desc: 'Bib, Mittens & Muzzle' },
            { name: 'Starlight Gold', hex: '#F59E0B', desc: 'Coins, Stars & Crowns' },
            { name: 'Sweet Nose Pink', hex: '#F43F5E', desc: 'Nose & Inner Ear' },
            { name: 'Cosmic Dark', hex: '#0F172A', desc: 'Sky Night Base' },
            { name: 'Line Espresso', hex: '#272138', desc: 'Crisp Outline Ink' },
          ].map((c) => (
            <div key={c.name} className="p-3 bg-slate-900 border border-slate-700/80 rounded-2xl space-y-2">
              <div className="w-full h-12 rounded-xl shadow-inner border border-white/10" style={{ backgroundColor: c.hex }} />
              <div>
                <div className="font-bold text-white text-xs truncate">{c.name}</div>
                <div className="font-mono text-[10px] text-slate-400">{c.hex}</div>
                <div className="text-[10px] text-slate-500 truncate">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Environment & Background Art */}
      <section className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Layers className="text-emerald-400" size={24} />
          <h2 className="text-2xl font-black text-white">3. Environment Art: Aurora Floating Islands</h2>
        </div>
        <p className="text-sm text-slate-300">
          Environments feature floating voxel islands against dreamy cosmic curtains with glowing starlight crystals and cobblestone paths.
        </p>

        <div className="h-44 rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-900 to-sky-950 border-2 border-slate-700 flex items-center justify-center p-6 text-center shadow-xl">
          <div className="space-y-2">
            <div className="flex justify-center gap-3 text-cyan-400">
              <Compass size={32} />
              <Sparkles size={32} />
            </div>
            <div className="text-sm font-bold text-white">Atmospheric Voxel Backdrop Preview</div>
            <div className="text-xs text-cyan-300/80">Vector-based cosmic gradient system</div>
          </div>
        </div>
      </section>

      {/* 4. Asset Pipeline & Singular Placeholder System */}
      <section className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Compass className="text-amber-400" size={24} />
            <h2 className="text-2xl font-black text-white">4. Singular Placeholder System</h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
            Unified Wireframe Architecture
          </span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          All custom graphics and vector artwork throughout Wordtopia have been substituted with a single universal placeholder wireframe. Every currency badge, avatar silhouette, wearable item, companion pet, and adventure maze element routes through this singular placeholder component.
        </p>

        {/* Mascots & Companions */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400">Animal Companions & Starters</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { name: 'Aurora Celestial Cat', type: 'avatar' as const, emoji: '🌌', tag: 'Flagship' },
              { name: 'Mascot Companion', type: 'avatar' as const, emoji: '🐱', tag: 'Starter' },
              { name: 'Snow Rabbit', type: 'avatar' as const, emoji: '🐰', tag: 'Companion' },
              { name: 'Brown Bear', type: 'avatar' as const, emoji: '🐻', tag: 'Companion' },
              { name: 'Red Fox', type: 'avatar' as const, emoji: '🦊', tag: 'Companion' },
              { name: 'Panda Bear', type: 'avatar' as const, emoji: '🐼', tag: 'Companion' },
              { name: 'Shiba Dog', type: 'avatar' as const, emoji: '🐕', tag: 'Companion' },
              { name: 'Wise Owl', type: 'avatar' as const, emoji: '🦉', tag: 'Academic' },
              { name: 'Penguin', type: 'avatar' as const, emoji: '🐧', tag: 'Companion' },
              { name: 'Tree Frog', type: 'avatar' as const, emoji: '🐸', tag: 'Wild' },
            ].map((item) => (
              <div key={item.name} className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl flex flex-col items-center text-center gap-2 group hover:border-cyan-400/50 transition-colors">
                <div className="w-16 h-16 flex items-center justify-center p-1 bg-slate-950/60 rounded-xl">
                  <GameGraphic type={item.type} emoji={item.emoji} size="md" className="w-12 h-12 text-3xl group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs truncate w-full">{item.name}</div>
                  <div className="text-[10px] text-cyan-400/80 font-mono">{item.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HUD & Currency Rewards */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">Currencies & Achievement Badges</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { name: 'Paw Coin', type: 'coin' as const, desc: 'Study Economy' },
              { name: 'Heart Gem', type: 'heart' as const, desc: 'Mascot Health' },
              { name: 'Star Token', type: 'star' as const, desc: 'Word Mastery' },
              { name: 'Diamond Gem', type: 'gem' as const, desc: 'Adventure Gate' },
              { name: 'Victory Trophy', type: 'trophy' as const, desc: 'Level Complete' },
              { name: 'Streak Flame', type: 'streak' as const, desc: 'Daily Momentum' },
            ].map((item) => (
              <div key={item.name} className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl flex flex-col items-center text-center gap-2">
                <div className="w-14 h-14 flex items-center justify-center p-1 bg-slate-950/60 rounded-xl">
                  <GameGraphic type={item.type} size="md" className="w-10 h-10" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wearables & Equipment */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-purple-400">Wearable Gear & Shop Equipment</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { name: 'Royal Crown', type: 'crown' as const, slot: 'Headwear' },
              { name: 'Scholar Cap', type: 'item' as const, emoji: '🎓', slot: 'Headwear' },
              { name: 'Cool Shades', type: 'item' as const, emoji: '🕶️', slot: 'Headwear' },
              { name: 'Explorer Pack', type: 'item' as const, emoji: '🎒', slot: 'Back' },
              { name: 'Magic Wand', type: 'item' as const, emoji: '🪄', slot: 'Hand' },
              { name: 'Tome of Words', type: 'item' as const, emoji: '📚', slot: 'Hand' },
            ].map((item) => (
              <div key={item.name} className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl flex flex-col items-center text-center gap-2">
                <div className="w-14 h-14 flex items-center justify-center p-1 bg-slate-950/60 rounded-xl">
                  <GameGraphic type={item.type} emoji={item.emoji} size="md" className="w-10 h-10 bg-transparent border-0 shadow-none text-2xl" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs truncate">{item.name}</div>
                  <div className="text-[10px] text-purple-400/80 font-mono">{item.slot}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Adventure & Tileset Assets */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">Adventure & Maze Elements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Treasure Chest', type: 'chest' as const, desc: 'Bonus Loot Tile' },
              { name: 'Finish Portal', type: 'portal' as const, desc: 'Maze Exit Gate' },
              { name: 'Mystery Relic', type: 'item' as const, desc: 'Puzzle Collectible' },
              { name: 'Star Shrine', type: 'star' as const, desc: 'Mastery Waypoint' },
            ].map((item) => (
              <div key={item.name} className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl flex flex-col items-center text-center gap-2">
                <div className="w-14 h-14 flex items-center justify-center p-1 bg-slate-950/60 rounded-xl">
                  <GameGraphic type={item.type} size="md" className="w-10 h-10" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Child-First Usability & Mobile Ergonomics */}
      <section className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="text-amber-400" size={24} />
          <h2 className="text-2xl font-black text-white">5. Child-First Usability & Mobile Ergonomics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700 space-y-1">
            <span className="font-bold text-amber-400 uppercase text-[10px]">Minimum Touch Target</span>
            <p className="text-slate-300">
              All interactive buttons must measure at least <span className="text-white font-bold">48×48 CSS pixels</span> with at least 8px spacing to prevent mis-taps.
            </p>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700 space-y-1">
            <span className="font-bold text-amber-400 uppercase text-[10px]">High Contrast Silhouettes</span>
            <p className="text-slate-300">
              All characters and badges maintain minimum <span className="text-white font-bold">4.5:1 contrast</span> against backgrounds for clear visibility in bright classroom lighting.
            </p>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700 space-y-1">
            <span className="font-bold text-amber-400 uppercase text-[10px]">Zero Copyrighted Elements</span>
            <p className="text-slate-300">
              All textures, characters, and sounds are 100% original. No third-party trademarks or proprietary models.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Section 12 Pixel-Art Quality Assurance Matrix */}
      <section className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <Layers className="text-cyan-400" size={24} />
            <div>
              <h2 className="text-2xl font-black text-white">6. Pixel-Art Avatar QA Matrix (Section 12 Compliance)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Validates nearest-neighbor scaling across all mandatory display sizes (64px to 512px). Zero smoothing, no blurry borders.
              </p>
            </div>
          </div>
          {/* Avatar Switcher */}
          <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-700">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                onClick={() => setQaAvatar(a.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  qaAvatar === a.id
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Verification Checkpoints */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-2xl">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Native 64×64 Composite</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Nearest Neighbor Active</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Paws / Feet Unobstructed</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> 1:1 Aspect Ratio Preserved</span>
        </div>

        {/* Multi-Size Test Render Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Mandatory Display Sizes (§12.21)
          </h3>
          <div className="flex flex-wrap items-end gap-6 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-x-auto">
            {[64, 96, 128, 192, 256, 320, 384].map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex items-center justify-center">
                  <PixelAvatar
                    avatarId={qaAvatar}
                    equipped={qaEquipped}
                    size={size}
                  />
                </div>
                <div className="text-center">
                  <span className="font-mono text-xs font-bold text-cyan-300 block">{size}×{size}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{size / 64}× scale</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
