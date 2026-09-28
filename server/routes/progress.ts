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

  const updated: UserProgressRecord = {
    userId,
    stars: typeof stars === 'number' ? Math.max(0, stars) : existing?.stars || 0,
    coins: typeof coins === 'number' ? Math.max(0, coins) : existing?.coins || 0,
    currentStreak: typeof currentStreak === 'number' ? currentStreak : existing?.currentStreak || 0,
    bestStreak: typeof bestStreak === 'number' ? Math.max(bestStreak, existing?.bestStreak || 0) : existing?.bestStreak || 0,
    mascotName: mascotName || existing?.mascotName || 'Aurora Nova',
    mascotBaseId: mascotBaseId || existing?.mascotBaseId || 'cat_aurora',
    mascotHealth: typeof mascotHealth === 'number' ? mascotHealth : existing?.mascotHealth ?? 100,
    mascotHappiness: typeof mascotHappiness === 'number' ? mascotHappiness : existing?.mascotHappiness ?? 100,
    equipped: equipped || existing?.equipped || {},
    inventory: Array.isArray(inventory) ? inventory : existing?.inventory || [],
    activeMicropet: activeMicropet !== undefined ? activeMicropet : existing?.activeMicropet,
    updatedAt: Date.now(),
  };

  progressMap[userId] = updated;
  db.set('progress', progressMap);

  return res.json({ message: 'Progress saved successfully!', progress: updated });
});
