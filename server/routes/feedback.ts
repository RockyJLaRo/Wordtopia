import { Router, Request, Response } from 'express';
import { db, FeedbackRecord, FeedbackStatus } from '../db';
import { requireRole } from '../security';

export const feedbackRouter = Router();

// POST /api/feedback - Public endpoint for kids/players to send feedback
feedbackRouter.post('/', (req: Request, res: Response) => {
  const { category, message, screenshot, context } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter a message.' });
  }

  const allowedCategories = [
    'Bug',
    'Gameplay',
    'Suggestion',
    'Graphics',
    'Audio',
    'Mobile/Touch',
    'Accessibility',
    'Vocabulary',
    'Other',
  ];

  const validCategory = allowedCategories.includes(category) ? category : 'Other';

  const newFeedback: FeedbackRecord = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: req.user?.id,
    username: req.user?.username || 'Anonymous Player',
    category: validCategory as any,
    message: message.trim(),
    screenshot: typeof screenshot === 'string' && screenshot.startsWith('data:image') ? screenshot : undefined,
    status: 'New',
    createdAt: Date.now(),
    context: {
      game: context?.game || 'Lobby',
      version: context?.version || '1.2.0',
      deviceType: context?.deviceType || 'Desktop',
      browser: context?.browser || 'Browser',
      os: context?.os || 'OS',
      screenResolution: context?.screenResolution || `${windowFallback(req)}`,
      viewport: context?.viewport || 'Unknown',
      touchSupported: Boolean(context?.touchSupported),
      activeLesson: context?.activeLesson,
      wordsCount: context?.wordsCount,
    },
  };

  const allFeedback = db.get('feedback');
  allFeedback.unshift(newFeedback);
  // Cap at 1000 items
  if (allFeedback.length > 1000) allFeedback.length = 1000;
  db.set('feedback', allFeedback);

  return res.status(201).json({
    message: 'Thank you! Your feedback has been received and will help make Wordtopia even better!',
    feedbackId: newFeedback.id,
  });
});

function windowFallback(req: Request): string {
  const ua = req.headers['user-agent'] || '';
  if (/mobile/i.test(ua)) return 'Mobile Device';
  return 'Desktop Display';
}

// GET /api/feedback - Authorized viewing for teachers, moderators, admins
feedbackRouter.get(
  '/',
  requireRole(['teacher', 'moderator', 'admin', 'super_admin']),
  (req: Request, res: Response) => {
    const { status, category, game, search } = req.query;
    let list = db.get('feedback');

    if (status && status !== 'all') {
      list = list.filter((item) => item.status === status);
    }
    if (category && category !== 'all') {
      list = list.filter((item) => item.category === category);
    }
    if (game && game !== 'all') {
      list = list.filter((item) => item.context.game?.toLowerCase() === (game as string).toLowerCase());
    }
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(
        (item) =>
          item.message.toLowerCase().includes(q) ||
          item.username?.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // Identify recurring issue trends
    const countsByCategory: Record<string, number> = {};
    for (const f of list) {
      countsByCategory[f.category] = (countsByCategory[f.category] || 0) + 1;
    }

    return res.json({
      feedback: list,
      totalCount: list.length,
      categoryBreakdown: countsByCategory,
    });
  }
);

// PATCH /api/feedback/:id - Update status / add notes
feedbackRouter.patch(
  '/:id',
  requireRole(['moderator', 'admin', 'super_admin']),
  (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, internalNotes } = req.body;

    const allFeedback = db.get('feedback');
    const item = allFeedback.find((f) => f.id === id);

    if (!item) {
      return res.status(404).json({ error: 'Feedback report not found.' });
    }

    const validStatuses: FeedbackStatus[] = ['New', 'Reviewing', 'In Progress', 'Resolved', 'Closed'];
    if (status && validStatuses.includes(status)) {
      item.status = status;
      if (status === 'Resolved' || status === 'Closed') {
        item.resolvedAt = Date.now();
      }
    }

    if (internalNotes !== undefined) {
      item.internalNotes = internalNotes;
    }

    db.set('feedback', allFeedback);

    db.addAuditLog({
      adminId: req.user!.id,
      adminEmail: req.user!.email,
      action: 'feedback_updated',
      targetResource: id,
      details: `Feedback ${id} marked as "${item.status}". Notes: ${internalNotes || 'none'}`,
    });

    return res.json({ message: 'Feedback report updated.', feedback: item });
  }
);
