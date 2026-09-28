import { Router, Request, Response } from 'express';
import { db, AnalyticsEventRecord, DiagnosticRecord } from '../db';
import { requireRole } from '../security';

export const analyticsRouter = Router();

// POST /api/analytics/event - Privacy-conscious gameplay event ingestion
analyticsRouter.post('/event', (req: Request, res: Response) => {
  const { event, game, lesson, word, isCorrect, score, durationMs, deviceCategory, anonymousSessionId, metadata } =
    req.body;

  if (!event) {
    return res.status(400).json({ error: 'Event name is required.' });
  }

  const record: AnalyticsEventRecord = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    event,
    game,
    lesson,
    word,
    isCorrect: typeof isCorrect === 'boolean' ? isCorrect : undefined,
    score: typeof score === 'number' ? score : undefined,
    durationMs: typeof durationMs === 'number' ? durationMs : undefined,
    deviceCategory: deviceCategory === 'mobile' || deviceCategory === 'tablet' ? deviceCategory : 'desktop',
    anonymousSessionId: anonymousSessionId || 'anon_session',
    timestamp: Date.now(),
    metadata: metadata && typeof metadata === 'object' ? metadata : undefined,
  };

  const analytics = db.get('analytics');
  analytics.push(record);
  // Cap at 5000 items
  if (analytics.length > 5000) analytics.splice(0, analytics.length - 5000);
  db.set('analytics', analytics);

  return res.status(204).end();
});

// POST /api/analytics/diagnostics - Usability friction & touch diagnostics
analyticsRouter.post('/diagnostics', (req: Request, res: Response) => {
  const { type, screen, game, deviceCategory, coordinateX, coordinateY, description, possibleIssue } = req.body;

  if (!type || !screen) {
    return res.status(400).json({ error: 'Diagnostic type and screen are required.' });
  }

  const diagnostics = db.get('diagnostics');
  // Check if an existing diagnostic within the last 10 minutes matches
  const recent = diagnostics.find(
    (d) => d.type === type && d.screen === screen && Date.now() - d.timestamp < 10 * 60 * 1000
  );

  if (recent) {
    recent.occurrences += 1;
    recent.timestamp = Date.now();
  } else {
    const record: DiagnosticRecord = {
      id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type,
      screen,
      game,
      deviceCategory: deviceCategory || 'mobile',
      coordinateX: typeof coordinateX === 'number' ? Math.round(coordinateX) : undefined,
      coordinateY: typeof coordinateY === 'number' ? Math.round(coordinateY) : undefined,
      description: description || 'Users repeatedly tapped an area with no response.',
      possibleIssue: possibleIssue || 'Touch target may be missing or too small.',
      occurrences: 1,
      timestamp: Date.now(),
    };
    diagnostics.unshift(record);
    if (diagnostics.length > 500) diagnostics.length = 500;
  }

  db.set('diagnostics', diagnostics);
  return res.status(204).end();
});

// GET /api/analytics/summary - Aggregated product & usability metrics
analyticsRouter.get(
  '/summary',
  requireRole(['teacher', 'moderator', 'admin', 'super_admin']),
  (req: Request, res: Response) => {
    const events = db.get('analytics');
    const diagnostics = db.get('diagnostics');
    const feedback = db.get('feedback');
    const users = db.get('users');

    // Calculate aggregated metrics
    const totalEvents = events.length;
    let gamesPlayed = 0;
    let questionsAnswered = 0;
    let questionsCorrect = 0;
    const gamePopularity: Record<string, number> = {};
    const missedWords: Record<string, number> = {};
    const masteredWords: Record<string, number> = {};
    const devices: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };

    for (const e of events) {
      if (e.deviceCategory) {
        devices[e.deviceCategory] = (devices[e.deviceCategory] || 0) + 1;
      }
      if (e.event === 'game_completed' || e.event === 'game_started') {
        gamesPlayed++;
        if (e.game) {
          gamePopularity[e.game] = (gamePopularity[e.game] || 0) + 1;
        }
      }
      if (e.event === 'question_answered') {
        questionsAnswered++;
        if (e.isCorrect) {
          questionsCorrect++;
        } else if (e.word) {
          missedWords[e.word] = (missedWords[e.word] || 0) + 1;
        }
      }
      if (e.event === 'word_mastered' && e.word) {
        masteredWords[e.word] = (masteredWords[e.word] || 0) + 1;
      }
    }

    const accuracyRate =
      questionsAnswered > 0 ? Math.round((questionsCorrect / questionsAnswered) * 100) : 0;

    // Sort most missed words
    const topMissed = Object.entries(missedWords)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Sort game popularity
    const topGames = Object.entries(gamePopularity)
      .map(([game, count]) => ({ game, count }))
      .sort((a, b) => b.count - a.count);

    return res.json({
      summary: {
        totalUsers: users.length,
        activeUsersPastWeek: users.filter((u) => u.lastLoginAt && Date.now() - u.lastLoginAt < 7 * 86400000).length,
        gamesPlayed,
        questionsAnswered,
        accuracyRate,
        feedbackCount: feedback.length,
        openBugsCount: feedback.filter((f) => f.category === 'Bug' && f.status !== 'Resolved' && f.status !== 'Closed').length,
      },
      devices,
      topGames,
      topMissed,
      diagnostics: diagnostics.slice(0, 10),
    });
  }
);
