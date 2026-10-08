import { Router, Request, Response } from 'express';
import { db, UserProgressRecord } from '../db';
import { requireAuth } from '../security';

export const progressRouter = Router();

// GET /api/progress - Fetch user's saved game progress
progressRouter.get('/', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const progressMap = db.get('progress');
  const userProgress = progressMap[userId];

  if (!userProgress) {
    return res.json({ progress: null });
  }

  return res.json({ progress: userProgress });
});

// POST /api/progress/sync - Save or merge user's game progress
progressRouter.post('/sync', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    stars,
    coins,
    currentStreak,
    bestStreak,
    mascotName,
    mascotBaseId,
    mascotHealth,
    mascotHappiness,
    equipped,
    inventory,
    activeMicropet,
  } = req.body;

  const progressMap = db.get('progress');
  const existing = progressMap[userId];

  // Untrusted client input: keep numbers finite and in range, strings short, collections typed.
  const num = (v: unknown, fallback: number, min = 0, max = 10_000_000) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
  const str = (v: unknown, fallback: string, maxLen: number) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, maxLen) : fallback;
  const safeEquipped =
    equipped && typeof equipped === 'object' && !Array.isArray(equipped)
      ? Object.fromEntries(
          Object.entries(equipped as Record<string, unknown>)
            .filter(([k, v]) => typeof v === 'string' && k.length <= 40 && v.length <= 80)
            .slice(0, 20)
        ) as Record<string, string>
      : undefined;
  const safeInventory = Array.isArray(inventory)
    ? inventory.filter((i: unknown): i is string => typeof i === 'string' && i.length <= 80).slice(0, 2000)
    : undefined;

  const updated: UserProgressRecord = {
    userId,
    stars: num(stars, existing?.stars || 0),
    coins: num(coins, existing?.coins || 0),
    currentStreak: num(currentStreak, existing?.currentStreak || 0),
    bestStreak: Math.max(num(bestStreak, 0), existing?.bestStreak || 0),
    mascotName: str(mascotName, existing?.mascotName || 'Aurora Nova', 40),
    mascotBaseId: str(mascotBaseId, existing?.mascotBaseId || 'cat_aurora', 40),
    mascotHealth: num(mascotHealth, existing?.mascotHealth ?? 100, 0, 100),
    mascotHappiness: num(mascotHappiness, existing?.mascotHappiness ?? 100, 0, 100),
    equipped: safeEquipped || existing?.equipped || {},
    inventory: safeInventory || existing?.inventory || [],
    activeMicropet: typeof activeMicropet === 'string' ? activeMicropet.slice(0, 40) : existing?.activeMicropet,
    updatedAt: Date.now(),
  };

  progressMap[userId] = updated;
  db.set('progress', progressMap);

  return res.json({ message: 'Progress saved successfully!', progress: updated });
});
