import React from 'react';
import { cn } from '../lib/utils';

export interface SingularPlaceholderProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number | string;
  label?: string;
}

/**
 * Universal Singular Placeholder
 * Standardized wireframe placeholder component that replaces all graphics,
 * character artwork, item sprites, currency badges, and game illustrations.
 */
export function SingularPlaceholder({ className, size = 'md', label }: SingularPlaceholderProps) {
  const isNumeric = typeof size === 'number';

  const sizeClasses: Record<string, string> = {
    xs: 'w-4 h-4',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
    '2xl': 'w-48 h-48',
  };

  const style = isNumeric ? { width: size, height: size, maxWidth: '100%', maxHeight: '100%', aspectRatio: '1 / 1' } : undefined;
  const dimensionClass = isNumeric ? '' : sizeClasses[size as string] || 'w-12 h-12';

  return (
    <div
      style={style}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-100/90 text-slate-400 shadow-inner',
        dimensionClass,
        className
      )}
      title="Graphic Placeholder"
      aria-label="Graphic Placeholder"
    >
      {/* Wireframe guideline crosses */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-200"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <line x1="0" y1="0" x2="100" y2="100" strokeWidth="1.2" strokeDasharray="3 3" />
        <line x1="100" y1="0" x2="0" y2="100" strokeWidth="1.2" strokeDasharray="3 3" />
      </svg>

      {/* Universal Image Placeholder Symbol */}
      <div className="relative z-10 flex flex-col items-center justify-center p-1 pointer-events-none">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-1/2 h-1/2 max-w-[28px] max-h-[28px] min-w-[8px] min-h-[8px] text-slate-400"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        {label && (
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 truncate max-w-full">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
