// Privacy-Conscious Gameplay Analytics & UI Interaction Diagnostics

function getAnonymousSessionId(): string {
  let sessId = sessionStorage.getItem('vocab_anon_sess');
  if (!sessId) {
    sessId = `sess_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('vocab_anon_sess', sessId);
  }
  return sessId;
}

function getDeviceCategory(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function trackGameEvent(
  event: string,
  data?: {
    game?: string;
    lesson?: string;
    word?: string;
    isCorrect?: boolean;
    score?: number;
    durationMs?: number;
    metadata?: Record<string, any>;
  }
) {
  try {
    const payload = {
      event,
      game: data?.game,
      lesson: data?.lesson,
      word: data?.word,
      isCorrect: data?.isCorrect,
      score: data?.score,
      durationMs: data?.durationMs,
      deviceCategory: getDeviceCategory(),
      anonymousSessionId: getAnonymousSessionId(),
      metadata: data?.metadata,
    };

    // Use sendBeacon if available, fallback to fetch
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/event', body);
    } else {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

export function reportDiagnostic(data: {
  type: 'rapid_non_interactive_taps' | 'missed_button_tap' | 'disabled_control_tap' | 'zoom_attempt' | 'excessive_back';
  screen: string;
  game?: string;
  coordinateX?: number;
  coordinateY?: number;
  description?: string;
  possibleIssue?: string;
}) {
  try {
    fetch('/api/analytics/diagnostics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        deviceCategory: getDeviceCategory(),
      }),
    }).catch(() => {});
  } catch {}
}

export function logApplicationError(error: Error | string, component?: string, game?: string) {
  try {
    const message = typeof error === 'string' ? error : error.message;
    const errorType = typeof error === 'string' ? 'AppError' : error.name;

    fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorType,
        message,
        game,
        component,
        browser: navigator.userAgent.split(' ')[0],
        os: navigator.platform || 'Unknown OS',
        deviceCategory: getDeviceCategory(),
      }),
    }).catch(() => {});
  } catch {}
}

// Global Interaction Diagnostics Listener (Monitors rapid non-interactive taps & disabled clicks)
export function initInteractionDiagnostics() {
  if (typeof window === 'undefined') return;

  let tapHistory: { x: number; y: number; time: number }[] = [];

  const handlePointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const isInteractive = Boolean(
      target.closest('button, a, input, select, textarea, [role="button"], [data-clickable="true"]')
    );

    const now = Date.now();
    const x = e.clientX;
    const y = e.clientY;

    // Check for disabled button clicks
    const disabledButton = target.closest('button:disabled');
    if (disabledButton) {
      reportDiagnostic({
        type: 'disabled_control_tap',
        screen: window.location.pathname,
        coordinateX: x,
        coordinateY: y,
        description: 'User tapped a disabled control button.',
        possibleIssue: 'Player may not understand what prerequisite is needed to enable this button.',
      });
      return;
    }

    if (!isInteractive) {
      // Check for rapid non-interactive taps in same ~40px area
      tapHistory = tapHistory.filter((t) => now - t.time < 1500);
      tapHistory.push({ x, y, time: now });

      const closeTaps = tapHistory.filter(
        (t) => Math.abs(t.x - x) < 40 && Math.abs(t.y - y) < 40
      );

      if (closeTaps.length >= 3) {
        tapHistory = [];
        reportDiagnostic({
          type: 'rapid_non_interactive_taps',
          screen: window.location.pathname,
          coordinateX: x,
          coordinateY: y,
          description: 'Repeated rapid taps detected on a non-interactive screen element.',
          possibleIssue: 'Player expected a button, action, or continue prompt here.',
        });
      }
    }
  };

  window.addEventListener('pointerdown', handlePointerDown, { passive: true });
}
