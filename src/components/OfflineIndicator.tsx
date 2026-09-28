import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-white shadow-xl border border-amber-600 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <WifiOff size={16} className="text-white shrink-0 animate-pulse" />
      <span>Offline Mode — Games, sprites & vocabulary cached locally</span>
    </div>
  );
};
