import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, UserRecord, UserRole } from './db';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
    }
  }
}

// In-memory active sessions: token -> { userId, expiresAt }
interface SessionData {
  userId: string;
  expiresAt: number;
}

const sessions = new Map<string, SessionData>();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Rate limiting state: key -> { count, firstAttempt }
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 mins
const MAX_ATTEMPTS = 10;

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry) {
    rateLimitMap.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_ATTEMPTS;
}

export function resetRateLimit(key: string) {
  rateLimitMap.delete(key);
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    userId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

export function revokeSession(token: string) {
  sessions.delete(token);
}

export function getSessionUser(token: string): AuthenticatedUser | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  const users = db.get('users');
  const user = users.find((u) => u.id === session.userId);
  if (!user || user.status === 'suspended') return null;
  return sanitizeUser(user);
}

export function sanitizeUser(user: UserRecord): AuthenticatedUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check Authorization header or cookie
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.vocab_session) {
    token = req.cookies.vocab_session;
  }

  if (token) {
    const user = getSessionUser(token);
    if (user) {
      req.user = user;
      req.sessionId = token;
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}] permissions.`,
      });
    }
    next();
  };
}
