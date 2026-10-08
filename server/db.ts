import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type UserRole = 'user' | 'parent' | 'teacher' | 'moderator' | 'admin' | 'super_admin';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  createdAt: number;
  lastLoginAt?: number;
  status: 'active' | 'suspended';
  resetToken?: string;
  resetTokenExpires?: number;
}

export interface UserProgressRecord {
  userId: string;
  stars: number;
  coins: number;
  currentStreak: number;
  bestStreak: number;
  mascotName: string;
  mascotBaseId: string;
  mascotHealth: number;
  mascotHappiness: number;
  equipped: Record<string, string>;
  inventory: string[];
  activeMicropet?: string;
  updatedAt: number;
}

export type FeedbackStatus = 'New' | 'Reviewing' | 'In Progress' | 'Resolved' | 'Closed';

export interface FeedbackRecord {
  id: string;
  userId?: string;
  username?: string;
  category: 'Bug' | 'Gameplay' | 'Suggestion' | 'Graphics' | 'Audio' | 'Mobile/Touch' | 'Accessibility' | 'Vocabulary' | 'Other';
  message: string;
  screenshot?: string;
  status: FeedbackStatus;
  internalNotes?: string;
  createdAt: number;
  resolvedAt?: number;
  context: {
    game?: string;
    version: string;
    deviceType: string;
    browser: string;
    os: string;
    screenResolution: string;
    viewport: string;
    touchSupported: boolean;
    activeLesson?: string;
    wordsCount?: number;
  };
}

export interface AnalyticsEventRecord {
  id: string;
  event: string; // 'session_started' | 'game_completed' | 'question_answered' | 'word_mastered' | etc.
  game?: string;
  lesson?: string;
  word?: string;
  isCorrect?: boolean;
  score?: number;
  durationMs?: number;
  deviceCategory: 'mobile' | 'tablet' | 'desktop';
  anonymousSessionId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface DiagnosticRecord {
  id: string;
  type: 'rapid_non_interactive_taps' | 'missed_button_tap' | 'disabled_control_tap' | 'zoom_attempt' | 'excessive_back';
  screen: string;
  game?: string;
  deviceCategory: string;
  coordinateX?: number;
  coordinateY?: number;
  description: string;
  occurrences: number;
  possibleIssue: string;
  timestamp: number;
}

export interface ErrorLogRecord {
  id: string;
  errorType: string;
  message: string;
  game?: string;
  component?: string;
  browser: string;
  os: string;
  deviceCategory: string;
  timestamp: number;
}

export interface AuditLogRecord {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  targetResource?: string;
  details: string;
  timestamp: number;
}

export interface DatabaseSchema {
  users: UserRecord[];
  progress: Record<string, UserProgressRecord>; // userId -> progress
  feedback: FeedbackRecord[];
  analytics: AnalyticsEventRecord[];
  diagnostics: DiagnosticRecord[];
  errors: ErrorLogRecord[];
  auditLogs: AuditLogRecord[];
  settings: {
    dataRetentionDays: number;
    coppaStrictMode: boolean;
    registrationEnabled: boolean;
    allowAnonymousFeedback: boolean;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helpers for password hashing with PBKDF2
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculatedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculatedHash, 'hex'));
}

// Initial DB seeding
const LEGACY_DEFAULT_ADMIN_PASSWORD = 'SuperAdmin123!';

// The super-admin password comes from the ADMIN_PASSWORD environment variable. Without it a
// random one is generated and printed once, instead of a password published in the source code.
function resolveInitialAdminPassword(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const generated = crypto.randomBytes(12).toString('base64url');
  console.warn(`[DB] ADMIN_PASSWORD not set. Generated super admin password (admin@wordtopia.org): ${generated}`);
  return generated;
}

function getInitialDatabase(): DatabaseSchema {
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const adminHash = crypto.pbkdf2Sync(resolveInitialAdminPassword(), adminSalt, 10000, 64, 'sha512').toString('hex');
  // hashPassword() picks a random salt per call, so hash and salt must come from the same call
  // (the demo student accounts previously stored mismatched pairs and could never sign in).
  const leo = hashPassword('LeoPass123!');
  const maya = hashPassword('MayaPass123!');

  const teacherSalt = crypto.randomBytes(16).toString('hex');
  const teacherHash = crypto.pbkdf2Sync('TeacherPass123!', teacherSalt, 10000, 64, 'sha512').toString('hex');

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return {
    users: [
      {
        id: 'usr_super_admin',
        username: 'AdminCraft',
        email: 'admin@wordtopia.org',
        passwordHash: adminHash,
        salt: adminSalt,
        role: 'super_admin',
        createdAt: now - 30 * day,
        lastLoginAt: now - 2 * 60 * 60 * 1000,
        status: 'active',
      },
      {
        id: 'usr_teacher_smith',
        username: 'MsSmithTeacher',
        email: 'smith@elementaryschool.edu',
        passwordHash: teacherHash,
        salt: teacherSalt,
        role: 'teacher',
        createdAt: now - 20 * day,
        lastLoginAt: now - day,
        status: 'active',
      },
      {
        id: 'usr_student_leo',
        username: 'StarExplorerLeo',
        email: 'parent.leo@example.com',
        passwordHash: leo.hash,
        salt: leo.salt,
        role: 'user',
        createdAt: now - 14 * day,
        lastLoginAt: now - 3 * 60 * 60 * 1000,
        status: 'active',
      },
      {
        id: 'usr_student_maya',
        username: 'CosmicMaya',
        email: 'parent.maya@example.com',
        passwordHash: maya.hash,
        salt: maya.salt,
        role: 'user',
        createdAt: now - 10 * day,
        lastLoginAt: now - 5 * 60 * 60 * 1000,
        status: 'active',
      }
    ],
    progress: {
      'usr_student_leo': {
        userId: 'usr_student_leo',
        stars: 48,
        coins: 620,
        currentStreak: 5,
        bestStreak: 7,
        mascotName: 'Aurora Nova',
        mascotBaseId: 'cat_aurora',
        mascotHealth: 90,
        mascotHappiness: 95,
        equipped: { Headwear: 'head_crown', Back: 'back_cape' },
        inventory: ['head_crown', 'back_cape', 'shoes_boots'],
        updatedAt: now - 3 * 60 * 60 * 1000,
      }
    },
    feedback: [
      {
        id: 'fb_1',
        userId: 'usr_student_leo',
        username: 'StarExplorerLeo',
        category: 'Mobile/Touch',
        message: 'On my mom’s iPhone, the jump and left arrow controls in Adventure Mode feel a bit close together.',
        status: 'In Progress',
        internalNotes: 'Adjusted thumb hitboxes by +12px for smaller mobile screens.',
        createdAt: now - 2 * day,
        context: {
          game: 'VocabularyAdventure',
          version: '1.2.0',
          deviceType: 'Mobile',
          browser: 'Mobile Safari 17.4',
          os: 'iOS 17.4',
          screenResolution: '390x844',
          viewport: '390x664',
          touchSupported: true,
          activeLesson: 'Week #1',
          wordsCount: 8,
        }
      },
      {
        id: 'fb_2',
        username: 'AnonymousKid',
        category: 'Suggestion',
        message: 'Can you please add more starry accessories for the Aurora Cat? It is my favorite mascot!',
        status: 'Reviewing',
        createdAt: now - 1 * day,
        context: {
          game: 'Shop',
          version: '1.2.0',
          deviceType: 'Tablet',
          browser: 'Chrome 123',
          os: 'iPadOS 17',
          screenResolution: '820x1180',
          viewport: '820x1100',
          touchSupported: true,
          activeLesson: 'Week #2',
          wordsCount: 7,
        }
      },
      {
        id: 'fb_3',
        userId: 'usr_student_maya',
        username: 'CosmicMaya',
        category: 'Vocabulary',
        message: 'The definition for "Scrunches" was super easy to remember with the audio hint!',
        status: 'Resolved',
        internalNotes: 'Positive feedback recorded for phonetic hints.',
        createdAt: now - 4 * day,
        resolvedAt: now - 2 * day,
        context: {
          game: 'DefinitionDash',
          version: '1.2.0',
          deviceType: 'Desktop',
          browser: 'Chrome 124',
          os: 'macOS',
          screenResolution: '1440x900',
          viewport: '1440x820',
          touchSupported: false,
          activeLesson: 'Week #1',
        }
      }
    ],
    analytics: [
      {
        id: 'evt_1',
        event: 'game_completed',
        game: 'SpeedChallenge',
        lesson: 'Week #1',
        score: 180,
        durationMs: 45000,
        deviceCategory: 'mobile',
        anonymousSessionId: 'sess_abc1',
        timestamp: now - 3600000,
      },
      {
        id: 'evt_2',
        event: 'word_mastered',
        word: 'Bilingual',
        lesson: 'Week #1',
        deviceCategory: 'tablet',
        anonymousSessionId: 'sess_abc2',
        timestamp: now - 7200000,
      },
      {
        id: 'evt_3',
        event: 'question_answered',
        game: 'WordDetective',
        word: 'Snarled',
        lesson: 'Week #2',
        isCorrect: true,
        durationMs: 3200,
        deviceCategory: 'mobile',
        anonymousSessionId: 'sess_abc3',
        timestamp: now - 10800000,
      },
      {
        id: 'evt_4',
        event: 'game_completed',
        game: 'VocabularyAdventure',
        lesson: 'Week #1',
        score: 300,
        durationMs: 120000,
        deviceCategory: 'desktop',
        anonymousSessionId: 'sess_abc4',
        timestamp: now - 14400000,
      }
    ],
    diagnostics: [
      {
        id: 'diag_1',
        type: 'rapid_non_interactive_taps',
        screen: 'VocabularyAdventure',
        game: 'Adventure Mode',
        deviceCategory: 'mobile',
        coordinateX: 195,
        coordinateY: 520,
        occurrences: 42,
        description: 'Players repeatedly tapped lower-center area after completing a word challenge.',
        possibleIssue: 'Players may expect an immediate "Continue" or "Next Question" button here.',
        timestamp: now - 12 * 3600000,
      },
      {
        id: 'diag_2',
        type: 'missed_button_tap',
        screen: 'DefinitionDash',
        game: 'Definition Dash',
        deviceCategory: 'mobile',
        coordinateX: 340,
        coordinateY: 85,
        occurrences: 18,
        description: 'Taps landed 6-10px outside the Hint button boundary on phone viewport.',
        possibleIssue: 'Button touch target is slightly too small for thumb ergonomics.',
        timestamp: now - 24 * 3600000,
      }
    ],
    errors: [
      {
        id: 'err_1',
        errorType: 'AudioPlaybackInterrupted',
        message: 'AudioContext playback prevented due to browser autoplay policy before touch.',
        game: 'WordMatch',
        component: 'AudioController',
        browser: 'Mobile Safari',
        os: 'iOS',
        deviceCategory: 'mobile',
        timestamp: now - 2 * day,
      }
    ],
    auditLogs: [
      {
        id: 'aud_1',
        adminId: 'usr_super_admin',
        adminEmail: 'admin@wordtopia.org',
        action: 'system_initialized',
        details: 'Initial system bootstrap and COPPA privacy compliance profile activated.',
        timestamp: now - 30 * day,
      },
      {
        id: 'aud_2',
        adminId: 'usr_super_admin',
        adminEmail: 'admin@wordtopia.org',
        action: 'feedback_status_updated',
        targetResource: 'fb_1',
        details: 'Status changed from New to In Progress: Mobile touch controls adjustments.',
        timestamp: now - 2 * day,
      }
    ],
    settings: {
      dataRetentionDays: 90,
      coppaStrictMode: true,
      registrationEnabled: true,
      allowAnonymousFeedback: true,
    }
  };
}

const SAVE_DEBOUNCE_MS = 400;

class Database {
  private data: DatabaseSchema;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.load();
    this.secureLegacyAdminPassword();
    // Make sure pending writes reach disk when the process stops (writes are synchronous,
    // so they are safe inside an 'exit' handler).
    process.once('exit', () => this.flush());
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        // Keep the unreadable file for manual recovery instead of overwriting every account.
        const backup = `${DB_FILE}.corrupt-${Date.now()}`;
        console.error(`Failed to load database; moved it to ${backup} and created a fresh one:`, e);
        try {
          fs.renameSync(DB_FILE, backup);
        } catch {}
      }
    }
    const initial = getInitialDatabase();
    this.saveDirect(initial);
    return initial;
  }

  /** Rotates the publicly known seed password if the deployment still uses it. */
  private secureLegacyAdminPassword() {
    const admin = this.data.users?.find((u) => u.id === 'usr_super_admin');
    if (!admin) return;
    let usesDefault = false;
    try {
      usesDefault = verifyPassword(LEGACY_DEFAULT_ADMIN_PASSWORD, admin.passwordHash, admin.salt);
    } catch {}
    if (!usesDefault) return;
    if (process.env.ADMIN_PASSWORD) {
      const { hash, salt } = hashPassword(process.env.ADMIN_PASSWORD);
      admin.passwordHash = hash;
      admin.salt = salt;
      this.save();
      console.log('[DB] Super admin password updated from ADMIN_PASSWORD.');
    } else {
      console.warn('[DB] SECURITY: the super admin still uses the default password from the source code. Set ADMIN_PASSWORD to rotate it.');
    }
  }

  private saveDirect(data: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Failed to save database file:', e);
    }
  }

  /**
   * Schedules a write. Bursts of updates (analytics events, diagnostics, progress syncs) are
   * coalesced into one file write instead of synchronously re-serializing the whole database
   * on every request, which blocked the server for all players.
   */
  public save() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveDirect(this.data);
    }, SAVE_DEBOUNCE_MS);
  }

  public flush() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
      this.saveDirect(this.data);
    }
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]) {
    this.data[key] = value;
    this.save();
  }

  public addAuditLog(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>) {
    const log: AuditLogRecord = {
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    this.data.auditLogs.unshift(log);
    // Keep max 500 audit logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.length = 500;
    }
    this.save();
    return log;
  }
}

export const db = new Database();
