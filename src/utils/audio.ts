import { soundManager, SoundEffectType } from './soundManager';

export { soundManager };
export type { SoundEffectType };

export const playCorrectSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('correct');
};

export const playIncorrectSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('incorrect');
};

export const playStepSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('step');
};

export const playBumpSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('bump');
};

export const playWinSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('gameWin');
};

export const playClickSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('click');
};

export const playTabSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('tab');
};

export const playCoinSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('coin');
};

export const playPurchaseSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('purchase');
};

export const playStarSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('star');
};

export const playMascotSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('mascot');
};

export const playEquipSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('equip');
};

export const playUnequipSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('unequip');
};

export const playStreakSound = (enabled = true) => {
  if (enabled === false) return;
  soundManager.play('streak');
};
