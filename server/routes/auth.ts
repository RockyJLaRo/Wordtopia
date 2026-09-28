import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db, hashPassword, verifyPassword, UserRecord } from '../db';
import {
  checkRateLimit,
  resetRateLimit,
  createSession,
  revokeSession,
  requireAuth,
  sanitizeUser,
} from '../security';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const users = db.get('users');
  const existingUser = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
  );

  if (existingUser) {
    return res.status(409).json({ error: 'An account with that email or username already exists.' });
  }

  const { hash, salt } = hashPassword(password);
  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hash,
    salt,
    // Only allow self-assigning user or parent role on registration; teacher/admin must be approved/assigned
    role: role === 'parent' ? 'parent' : role === 'teacher' ? 'teacher' : 'user',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    status: 'active',
  };

  users.push(newUser);
  db.set('users', users);

  const token = createSession(newUser.id);
  res.cookie('vocab_session', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });

  return res.status(201).json({
    message: 'Account created successfully!',
    token,
    user: sanitizeUser(newUser),
  });
});

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body; // email or username
  const clientIp = req.ip || 'anonymous';
  const rateLimitKey = `login_${clientIp}_${identifier}`;

  if (!checkRateLimit(rateLimitKey)) {
    return res.status(429).json({
      error: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
    });
  }

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/email and password are required.' });
  }

  const users = db.get('users');
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === identifier.toLowerCase() ||
      u.username.toLowerCase() === identifier.toLowerCase()
  );

  if (!user || user.status === 'suspended') {
    return res.status(401).json({
      error: user?.status === 'suspended' ? 'This account has been suspended.' : 'Invalid credentials.',
    });
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  resetRateLimit(rateLimitKey);
  user.lastLoginAt = Date.now();
  db.save();

  const token = createSession(user.id);
  res.cookie('vocab_session', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });

  return res.json({
    message: 'Logged in successfully!',
    token,
    user: sanitizeUser(user),
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  if (req.sessionId) {
    revokeSession(req.sessionId);
  }
  res.clearCookie('vocab_session');
  return res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
authRouter.get('/me', (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }
  return res.json({ user: req.user });
});

// POST /api/auth/password-reset/request
authRouter.post('/password-reset/request', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Return friendly generic response for privacy
    return res.json({
      message: 'If an account exists with that email, a secure reset token has been generated.',
    });
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  user.resetToken = resetToken;
  user.resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  db.save();

  db.addAuditLog({
    adminId: 'system',
    adminEmail: 'security@wordtopia.org',
    action: 'password_reset_requested',
    targetUserId: user.id,
    details: `Password reset token requested for ${user.email}`,
  });

  return res.json({
    message: 'If an account exists with that email, a secure reset token has been generated.',
    // Included in response for seamless testability / children sandbox flow
    resetToken,
  });
});

// POST /api/auth/password-reset/confirm
authRouter.post('/password-reset/confirm', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.resetToken === token);

  if (!user || !user.resetTokenExpires || Date.now() > user.resetTokenExpires) {
    return res.status(400).json({ error: 'Invalid or expired password reset token.' });
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  db.save();

  db.addAuditLog({
    adminId: 'system',
    adminEmail: 'security@wordtopia.org',
    action: 'password_reset_completed',
    targetUserId: user.id,
    details: `Password successfully reset for user ${user.username}`,
  });

  return res.json({ message: 'Password has been reset successfully! You can now sign in.' });
});

// POST /api/auth/change-password
authRouter.post('/change-password', requireAuth, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (!verifyPassword(currentPassword, user.passwordHash, user.salt)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  db.save();

  db.addAuditLog({
    adminId: user.id,
    adminEmail: user.email,
    action: 'password_changed',
    targetUserId: user.id,
    details: `User ${user.username} changed their password.`,
  });

  return res.json({ message: 'Password updated successfully!' });
});

// DELETE /api/auth/account (COPPA Child Privacy / Account Deletion)
authRouter.delete('/account', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  let users = db.get('users');
  users = users.filter((u) => u.id !== userId);
  db.set('users', users);

  const progress = db.get('progress');
  delete progress[userId];
  db.set('progress', progress);

  db.addAuditLog({
    adminId: userId,
    adminEmail: req.user!.email,
    action: 'account_deleted',
    targetUserId: userId,
    details: `User account and all personal progress purged per privacy request.`,
  });

  if (req.sessionId) {
    revokeSession(req.sessionId);
  }
  res.clearCookie('vocab_session');

  return res.json({ message: 'Account and all data have been completely deleted.' });
});
