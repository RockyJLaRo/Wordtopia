import { Router, Request, Response } from 'express';
import { db, ErrorLogRecord } from '../db';
import { requireRole } from '../security';

export const errorsRouter = Router();

// POST /api/errors/log - Ingest application errors/crashes
errorsRouter.post('/log', (req: Request, res: Response) => {
  const { errorType, message, game, component, browser, os, deviceCategory } = req.body;

  const record: ErrorLogRecord = {
    id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    errorType: errorType || 'ClientError',
    message: (message || 'Unknown error').substring(0, 500),
    game,
    component,
    browser: browser || 'Unknown Browser',
    os: os || 'Unknown OS',
    deviceCategory: deviceCategory || 'desktop',
    timestamp: Date.now(),
  };

  const errors = db.get('errors');
  errors.unshift(record);
  if (errors.length > 500) errors.length = 500;
  db.set('errors', errors);

  return res.status(204).end();
});

// GET /api/errors - Admin viewing error logs
errorsRouter.get(
  '/',
  requireRole(['admin', 'super_admin']),
  (req: Request, res: Response) => {
    const errors = db.get('errors');
    return res.json({ errors, total: errors.length });
  }
);
