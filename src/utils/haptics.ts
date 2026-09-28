import { useSettingsStore } from '../store/useSettingsStore';

export type HapticPreset =
  | 'light'
  | 'selection'
  | 'medium'
  | 'heavy'
  | 'step'
  | 'bump'
  | 'success'
  | 'error'
  | 'win'
  | 'coin'
  | 'purchase'
  | 'equip'
  | 'streak';

/**
 * Standardized tactile vibration patterns (durations in milliseconds).
 * Calibrated specifically for mobile web browsers to provide crisp, distinct haptics.
 */
export const HAPTIC_PATTERNS: Record<HapticPreset, number | number[]> = {
  // Ultra-crisp light tap for key buttons, d-pad steps, quick taps
  light: 15,
  // Subtle tick for tabs, switches, sliders
  selection: 10,
  // Solid tap for card flips, modal triggers, item inspection
  medium: 35,
  // Strong impact for significant alerts or reset actions
  heavy: 65,
  // Snappy footstep in maze exploration
  step: 12,
  // Distinct bump when hitting a wall, obstacle, or invalid tile
  bump: [30, 25, 30],
  // Upbeat, delightful double-pulse for correct answers and matches
  success: [35, 45, 45],
  // Warning buzz rumble for incorrect answers, out of time, or mistakes
  error: [55, 45, 75],
  // Celebration fanfare pattern for game victory, case closed, or maze escape
  win: [45, 45, 55, 45, 75, 45, 110],
  // Reward coin pickup / star burst
  coin: [25, 35, 45],
  // Store purchase register feel
  purchase: [30, 40, 55],
  // Wardrobe / avatar equipment snap
  equip: 30,
  // Combo streak milestone
  streak: [30, 35, 45, 35, 60],
};

/**
 * Checks whether the current browser / hardware supports the Web Vibration API.
 */
export const isVibrationSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  );
};

/**
 * Core vibration trigger with safety guards:
 * - Checks user preference in useSettingsStore (hapticsEnabled).
 * - Verifies navigator.vibrate availability.
 * - Catches any browser permission or context exceptions.
 */
export const triggerHaptic = (typeOrPattern: HapticPreset | number | number[]): boolean => {
  try {
    const settings = useSettingsStore.getState();
    // Honor user toggle in Settings
    if (settings && settings.hapticsEnabled === false) {
      return false;
    }

    if (isVibrationSupported()) {
      let pattern: number | number[];
      if (typeof typeOrPattern === 'string') {
        pattern = HAPTIC_PATTERNS[typeOrPattern] ?? 15;
      } else {
        pattern = typeOrPattern;
      }
      return navigator.vibrate(pattern);
    }
  } catch (err) {
    // Gracefully ignore environments where vibration is prohibited
  }
  return false;
};

/**
 * Semantic tactile feedback methods for key touch interactions and game events.
 */
export const haptic = {
  light: () => triggerHaptic('light'),
  selection: () => triggerHaptic('selection'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  step: () => triggerHaptic('step'),
  bump: () => triggerHaptic('bump'),
  success: () => triggerHaptic('success'),
  error: () => triggerHaptic('error'),
  win: () => triggerHaptic('win'),
  coin: () => triggerHaptic('coin'),
  purchase: () => triggerHaptic('purchase'),
  equip: () => triggerHaptic('equip'),
  streak: () => triggerHaptic('streak'),
  custom: (pattern: number | number[]) => triggerHaptic(pattern),
};

/**
 * Initializes global touchstart tactile feedback for interactive UI elements.
 * Provides immediate physical responsiveness when tapping buttons, links, or navigation chips.
 * Respects data-haptic="none" to prevent conflicts with custom game event choreography.
 */
export function initGlobalHapticFeedback() {
  if (typeof window === 'undefined') return;

  const handleTouchStart = (e: TouchEvent) => {
    try {
      const target = (e.target as HTMLElement)?.closest(
        'button, a, [role="button"], input[type="button"], input[type="submit"]'
      );
      if (!target) return;

      const override = target.getAttribute('data-haptic');
      if (override === 'none') {
        return;
      }

      if (override && override in HAPTIC_PATTERNS) {
        triggerHaptic(override as HapticPreset);
      } else {
        // Fast, gentle 10ms selection tick for standard UI touch
        triggerHaptic('selection');
      }
    } catch {
      // Ignore
    }
  };

  window.addEventListener('touchstart', handleTouchStart, { passive: true });
}
