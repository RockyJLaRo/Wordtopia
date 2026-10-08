import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Palette,
  Layers,
  Shirt,
  Camera,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProgressStore } from '../store/useProgressStore';
import { AVATARS, SPRITE_ITEMS, LAYER_ORDER } from '../data/avatarSprites';
import {
  createAvatar64Composite,
  createExportAvatarCanvas,
  downloadAvatarPng,
  exportAvatarToBlob,
  resolveEquippedItemForLayer,
} from '../utils/avatarRenderer';
import { playClickSound, playWinSound } from '../utils/audio';

const SCALE_OPTIONS = [
  { scale: 2, label: '2x', px: '128 × 128' },
  { scale: 3, label: '3x', px: '192 × 192' },
  { scale: 4, label: '4x', px: '256 × 256' },
  { scale: 5, label: '5x', px: '320 × 320' },
  { scale: 6, label: '6x', px: '384 × 384' },
  { scale: 7, label: '7x', px: '448 × 448' },
  { scale: 8, label: '8x', px: '512 × 512' },
  { scale: 9, label: '9x', px: '576 × 576' },
  { scale: 10, label: '10x', px: '640 × 640' },
];

const BACKGROUND_OPTIONS = [
  { id: 'transparent', label: 'Transparent', value: '', previewClass: 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px] bg-slate-100' },
  { id: 'white', label: 'White', value: '#FFFFFF', previewClass: 'bg-white border border-slate-300' },
  { id: 'slate', label: 'Dark Slate', value: '#0F172A', previewClass: 'bg-slate-900 border border-slate-700' },
  { id: 'sky', label: 'Sky Blue', value: '#E0F2FE', previewClass: 'bg-sky-100 border border-sky-300' },
  { id: 'amber', label: 'Sunset Amber', value: '#FEF3C7', previewClass: 'bg-amber-100 border border-amber-300' },
  { id: 'pink', label: 'Rose Pink', value: '#FFE4E6', previewClass: 'bg-rose-100 border border-rose-300' },
  { id: 'emerald', label: 'Mint Emerald', value: '#D1FAE5', previewClass: 'bg-emerald-100 border border-emerald-300' },
];

export function AvatarExportModal() {
  const {
    isAvatarExportOpen,
    setAvatarExportOpen,
    mascotBaseId,
    mascotName,
    equipped,
    wardrobeStyle = 'girl',
  } = useProgressStore();

  const [selectedScale, setSelectedScale] = useState<number>(4); // Default 4x (256x256)
  const [selectedBg, setSelectedBg] = useState<string>('transparent');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeAvatarId = mascotBaseId || 'black_cat';
  const activeStyle: 'girl' | 'boy' = wardrobeStyle === 'boy' ? 'boy' : 'girl';
  const avatarMeta = AVATARS.find((a) => a.id === activeAvatarId);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAvatarExportOpen) {
        setAvatarExportOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAvatarExportOpen, setAvatarExportOpen]);

  // Render live preview on canvas
  useEffect(() => {
    if (!isAvatarExportOpen || !canvasRef.current) return;

    let isCancelled = false;

    async function updatePreview() {
      try {
        const bgOption = BACKGROUND_OPTIONS.find((b) => b.id === selectedBg);
        const exportCanvas = await createExportAvatarCanvas({
          avatarId: activeAvatarId,
          equipped,
          style: activeStyle,
          scale: selectedScale,
          transparent: selectedBg === 'transparent',
          backgroundColor: bgOption?.value,
        });

        if (isCancelled || !canvasRef.current) return;

        const target = canvasRef.current;
        target.width = exportCanvas.width;
        target.height = exportCanvas.height;

        const ctx = target.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, target.width, target.height);
        ctx.drawImage(exportCanvas, 0, 0);
      } catch (err) {
        console.error('[AvatarExportModal] Preview render failed:', err);
      }
    }

    updatePreview();

    return () => {
      isCancelled = true;
    };
  }, [isAvatarExportOpen, activeAvatarId, JSON.stringify(equipped), activeStyle, selectedScale, selectedBg]);

  if (!isAvatarExportOpen) return null;

  const bgOption = BACKGROUND_OPTIONS.find((b) => b.id === selectedBg);
  const targetPx = selectedScale * 64;

  // List of equipped item names for summary
  const equippedList = LAYER_ORDER.map((layer) => {
    const itemId = resolveEquippedItemForLayer(layer, equipped);
    if (!itemId) return null;
    const itemDef = SPRITE_ITEMS[itemId];
    return {
      layer,
      id: itemId,
      name: itemDef?.name || itemId.replace(/_/g, ' '),
    };
  }).filter(Boolean);

  const handleDownload = async () => {
    setIsDownloading(true);
    playWinSound();

    const cleanName = (mascotName || 'companion').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const filename = `${cleanName}_${activeAvatarId}_${selectedScale}x_${targetPx}px.png`;

    const success = await downloadAvatarPng({
      avatarId: activeAvatarId,
      equipped,
      style: activeStyle,
      scale: selectedScale,
      transparent: selectedBg === 'transparent',
      backgroundColor: bgOption?.value,
      filename,
    });

    if (success) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#f59e0b', '#ec4899', '#10b981'],
      });
    }

    setIsDownloading(false);
  };

  const handleCopyToClipboard = async () => {
    try {
      playClickSound();
      const blob = await exportAvatarToBlob({
        avatarId: activeAvatarId,
        equipped,
        style: activeStyle,
        scale: selectedScale,
        transparent: selectedBg === 'transparent',
        backgroundColor: bgOption?.value,
      });

      if (blob && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } else {
        // Fallback to downloading if clipboard image write isn't supported
        handleDownload();
      }
    } catch (err) {
      console.warn('[AvatarExportModal] Clipboard write failed, falling back to download:', err);
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-100 via-amber-50 to-sky-50 border-b-2 border-amber-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
                <span>Save Avatar as PNG</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                  64x64 Pixel Art
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                Export {mascotName || 'companion'} at high-resolution 2x to 10x nearest-neighbor scales!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setAvatarExportOpen(false);
            }}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Close Modal (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Top Section: Live Canvas Preview and Info Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-6 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
            {/* Live Canvas Preview with Checkerboard Background */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div
                className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl flex items-center justify-center p-2 shadow-inner border-2 border-slate-300 overflow-hidden ${
                  selectedBg === 'transparent'
                    ? 'bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0] bg-white'
                    : ''
                }`}
                style={{
                  backgroundColor: selectedBg === 'transparent' ? undefined : bgOption?.value,
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain pixel-art shadow-xs"
                  style={{ imageRendering: 'pixelated' }}
                />

                {/* Corner Resolution Watermark */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-black rounded-md select-none">
                  {targetPx} × {targetPx} px
                </div>
              </div>

              <span className="text-[11px] font-black text-slate-500 mt-2">
                Preview at {selectedScale}x resolution
              </span>
            </div>

            {/* Mascot Meta Details */}
            <div className="flex-1 flex flex-col justify-between w-full">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-xl font-black text-slate-800">
                    {mascotName || 'Shadow'}
                  </h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                    {avatarMeta?.name || 'Black Cat'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-bold mb-3">
                  {avatarMeta?.personality || 'Curious & Playful companion'} • {activeStyle.toUpperCase()} Style
                </p>

                {/* Equipped items summary */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Shirt size={12} /> Equipped Outfit Layers ({equippedList.length}):
                  </span>
                  {equippedList.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Natural look (No items equipped)</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {equippedList.map((item) => (
                        <span
                          key={`${item.layer}_${item.id}`}
                          className="text-[11px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs flex items-center gap-1"
                        >
                          <span className="text-[9px] uppercase font-black text-amber-600 bg-amber-50 px-1 rounded">
                            {item.layer}
                          </span>
                          <span className="truncate max-w-[120px]">{item.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500 shrink-0" />
                <span>Rendered with pixel-perfect nearest-neighbor scaling. Crisp at any size!</span>
              </div>
            </div>
          </div>

          {/* Scale Selector Menu (2x to 10x as requested) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Maximize2 size={14} className="text-sky-600" />
                Choose Export Scale ({selectedScale}x • {targetPx}×{targetPx} px):
              </label>
              <span className="text-[11px] font-bold text-slate-400">
                1x = 64px • 10x = 640px
              </span>
            </div>

            {/* Scale Options Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
              {SCALE_OPTIONS.map((opt) => {
                const isSelected = selectedScale === opt.scale;
                return (
                  <button
                    key={opt.scale}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedScale(opt.scale);
                    }}
                    className={`py-2 px-1 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md font-black scale-105 ring-2 ring-amber-300/50'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 font-bold'
                    }`}
                  >
                    <span className="text-sm font-black leading-none">{opt.label}</span>
                    <span className={`text-[9px] mt-1 ${isSelected ? 'text-amber-100' : 'text-slate-400 font-medium'}`}>
                      {opt.scale * 64}px
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Selector */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Palette size={14} className="text-amber-500" />
              Background Color:
            </label>
            <div className="flex flex-wrap gap-2">
              {BACKGROUND_OPTIONS.map((bg) => {
                const isSelected = selectedBg === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedBg(bg.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl border-2 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-xs ring-2 ring-sky-300/40'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-md shadow-2xs shrink-0 ${bg.previewClass}`} />
                    <span>{bg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-bold text-slate-500">
            Exporting <strong className="text-slate-800">{targetPx} × {targetPx} px</strong> PNG
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Copy to Clipboard Button */}
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm border-2 transition-all active:scale-95 cursor-pointer ${
                isCopied
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
              }`}
            >
              {isCopied ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            {/* Download PNG Button */}
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownload}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Download size={16} />
              <span>Save PNG ({selectedScale}x)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvatarExportModal;
