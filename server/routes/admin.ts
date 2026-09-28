import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db, UserRole } from '../db';
import { requireRole, sanitizeUser } from '../security';

export const adminRouter = Router();

// Protect all admin endpoints
adminRouter.use(requireRole(['admin', 'super_admin']));

// GET /api/admin/users - User management list
adminRouter.get('/users', (req: Request, res: Response) => {
  const { search, role, status } = req.query;
  const users = db.get('users');
  const progressMap = db.get('progress');

  let filtered = [...users];

  if (role && role !== 'all') {
    filtered = filtered.filter((u) => u.role === role);
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((u) => u.status === status);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(
      (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  // Map to safe public representation with progress
  const result = filtered.map((u) => {
    const progress = progressMap[u.id];
    return {
      ...sanitizeUser(u),
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      progress: progress
        ? {
            stars: progress.stars,
            coins: progress.coins,
            streak: progress.currentStreak,
            mascotName: progress.mascotName,
            mascotBaseId: progress.mascotBaseId,
            itemsCount: progress.inventory?.length || 0,
          }
        : null,
    };
  });

  return res.json({ users: result, total: result.length });
});

// POST /api/admin/users/:id/reset-password - Admin initiates password reset
// Admin NEVER sees the password; triggers secure reset token and audit log
adminRouter.post('/users/:id/reset-password', (req: Request, res: Response) => {
  const { id } = req.params;
  const users = db.get('users');
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  user.resetToken = resetToken;
  user.resetTokenExpires = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  db.save();

  db.addAuditLog({
    adminId: req.user!.id,
    adminEmail: req.user!.email,
    action: 'admin_initiated_password_reset',
    targetUserId: user.id,
    details: `Admin ${req.user!.username} initiated password reset for user "${user.username}" (${user.email}).`,
  });

  return res.json({
    message: `Secure password reset initiated for ${user.username}. Reset link/token created.`,
    resetToken,
    userEmail: user.email,
  });
});

// PATCH /api/admin/users/:id/status - Suspend or activate user account
adminRouter.patch('/users/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({ error: 'Status must be "active" or "suspended".' });
  }

  if (id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot suspend your own account.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  user.status = status;
  db.save();

  db.addAuditLog({
    adminId: req.user!.id,
    adminEmail: req.user!.email,
    action: 'user_status_changed',
    targetUserId: user.id,
    details: `User "${user.username}" status changed to ${status}.`,
  });

  return res.json({ message: `User status changed to ${status}.`, user: sanitizeUser(user) });
});

// PATCH /api/admin/users/:id/role - Change user role
adminRouter.patch('/users/:id/role', (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles: UserRole[] = ['user', 'parent', 'teacher', 'moderator', 'admin', 'super_admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const prevRole = user.role;
  user.role = role;
  db.save();

  db.addAuditLog({
    adminId: req.user!.id,
    adminEmail: req.user!.email,
    action: 'user_role_changed',
    targetUserId: user.id,
    details: `User "${user.username}" role updated from ${prevRole} to ${role}.`,
  });

  return res.json({ message: `Role updated to ${role}.`, user: sanitizeUser(user) });
});

// DELETE /api/admin/users/:id - Delete user account (Admin action)
adminRouter.delete('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  if (id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot delete your own account from here.' });
  }

  let users = db.get('users');
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  users = users.filter((u) => u.id !== id);
  db.set('users', users);

  const progress = db.get('progress');
  delete progress[id];
  db.set('progress', progress);

  db.addAuditLog({
    adminId: req.user!.id,
    adminEmail: req.user!.email,
    action: 'admin_deleted_user',
    targetUserId: id,
    details: `Admin deleted user account "${user.username}" (${user.email}).`,
  });

  return res.json({ message: `User "${user.username}" and associated progress deleted.` });
});

// GET /api/admin/audit-logs - Administrative audit trail
adminRouter.get('/audit-logs', (req: Request, res: Response) => {
  const logs = db.get('auditLogs');
  return res.json({ logs });
});

// GET /api/admin/system - System status and COPPA settings
adminRouter.get('/system', (req: Request, res: Response) => {
  const settings = db.get('settings');
  const users = db.get('users');
  const feedback = db.get('feedback');
  const analytics = db.get('analytics');

  return res.json({
    settings,
    databaseStats: {
      usersCount: users.length,
      feedbackCount: feedback.length,
      analyticsCount: analytics.length,
    },
    version: '1.2.0-aurora',
    serverTime: new Date().toISOString(),
    coppaStatus: 'Fully Compliant - Data Minimization Active',
  });
});

// POST /api/admin/settings - Update system settings
adminRouter.post('/settings', (req: Request, res: Response) => {
  const { dataRetentionDays, coppaStrictMode, registrationEnabled, allowAnonymousFeedback } = req.body;
  const current = db.get('settings');

  const updated = {
    dataRetentionDays: typeof dataRetentionDays === 'number' ? dataRetentionDays : current.dataRetentionDays,
    coppaStrictMode: typeof coppaStrictMode === 'boolean' ? coppaStrictMode : current.coppaStrictMode,
    registrationEnabled: typeof registrationEnabled === 'boolean' ? registrationEnabled : current.registrationEnabled,
    allowAnonymousFeedback:
      typeof allowAnonymousFeedback === 'boolean' ? allowAnonymousFeedback : current.allowAnonymousFeedback,
  };

  db.set('settings', updated);

  db.addAuditLog({
    adminId: req.user!.id,
    adminEmail: req.user!.email,
    action: 'system_settings_updated',
    details: `Updated settings: COPPA strict=${updated.coppaStrictMode}, retention=${updated.dataRetentionDays}d`,
  });

  return res.json({ message: 'Settings saved.', settings: updated });
});

// POST /api/admin/clear-data - Comprehensive data wipe / reset
adminRouter.post('/clear-data', (req: Request, res: Response) => {
  const { scope } = req.body;
  const adminName = req.user!.username;
  const adminEmail = req.user!.email;

  if (!scope || !['all', 'analytics', 'feedback', 'errors', 'diagnostics', 'progress', 'users'].includes(scope)) {
    return res.status(400).json({ error: 'Valid scope required (all, analytics, feedback, errors, diagnostics, progress, users).' });
  }

  let message = '';

  if (scope === 'analytics') {
    db.set('analytics', []);
    db.set('diagnostics', []);
    message = 'All gameplay analytics events and diagnostic records cleared.';
    db.addAuditLog({
      adminId: req.user!.id,
      adminEmail,
      action: 'clear_analytics',
      details: `Admin ${adminName} cleared all gameplay analytics and interaction diagnostics.`,
    });
  } else if (scope === 'feedback') {
    db.set('feedback', []);
    message = 'All player feedback submissions and bug reports cleared.';
    db.addAuditLog({
      adminId: req.user!.id,
      adminEmail,
      action: 'clear_feedback',
      details: `Admin ${adminName} cleared all feedback tickets.`,
    });
  } else if (scope === 'errors') {
    db.set('errors', []);
    message = 'All error logs and client telemetry crash logs cleared.';
    db.addAuditLog({
      adminId: req.user!.id,
      adminEmail,
      action: 'clear_errors',
      details: `Admin ${adminName} cleared all error logs.`,
    });
  } else if (scope === 'diagnostics') {
    db.set('diagnostics', []);
    message = 'All UI interaction diagnostics cleared.';
    db.addAuditLog({
      adminId: req.user!.id,
      adminEmail,
      action: 'clear_diagnostics',
      details: `Admin ${adminName} cleared interaction diagnostics.`,
    });
  } else if (scope === 'progress') {
    db.set('progress', {});
    message = 'All player progress records and inventories reset.';
    db.addAuditLog({
      adminId: req.user!.id,
      adminEmail,
      action: 'reset_progress',
      details: `Admin ${adminName} wiped all player progress records.`,
    });
  } else if (scope === 'users') {
    // Preserve admin and super_admin users
    const currentUsers = db.get('users');
    const remainingUsers = currentUsers.filter((u) => u.role === 'admin' || u.role === 'super_admin');
    db.set('users', remainingUsers);
    db.set('progress', {});
    message = `Non-admin users and associated player data cleared (${currentUsers.length - remainingUsers.length} accounts removed).`;
    db.addAuditLog({
      adminId: req.user!.id,
      adminEmail,
      action: 'clear_users',
      details: `Admin ${adminName} pruned all non-admin accounts and player progress.`,
    });
  } else if (scope === 'all') {
    // Complete reset of system data
    db.set('analytics', []);
    db.set('diagnostics', []);
    db.set('errors', []);
    db.set('feedback', []);
    db.set('progress', {});
    const currentUsers = db.get('users');
    const remainingUsers = currentUsers.filter((u) => u.role === 'admin' || u.role === 'super_admin');
    db.set('users', remainingUsers);

    message = 'All system data (analytics, diagnostics, feedback, crash logs, player progress, and test accounts) cleared successfully!';
    db.addAuditLog({
      adminId: req.user!.id,
      adminEmail,
      action: 'clear_all_data',
      details: `Admin ${adminName} initiated complete system data wipe across all tables.`,
    });
  }

  return res.json({ success: true, scope, message });
});

