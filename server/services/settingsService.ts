import { RowDataPacket } from 'mysql2';
import { getPool } from '../db/pool.js';
import { createEntityId } from '../utils/formatters.js';
import { hashPassword, verifyPassword } from '../utils/security.js';

type SettingsRow = RowDataPacket & {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifyTaskAssigned: number;
  notifyProjectUpdates: number;
  notifyDeadlineReminders: number;
};

type UserProfileRow = RowDataPacket & {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
  department: string | null;
  passwordHash: string | null;
};

const pool = getPool();

const VALID_THEMES = ['light', 'dark', 'system'] as const;
const VALID_LANGUAGES = ['tr', 'en'] as const;

// ---------------------------------------------------------------------------
// Ensure settings row exists for a user
// ---------------------------------------------------------------------------
export const ensureUserSettings = async (userId: string) => {
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM user_settings WHERE user_id = ? LIMIT 1',
    [userId],
  );

  if (!existing.length) {
    await pool.query(
      'INSERT INTO user_settings (id, user_id) VALUES (?, ?)',
      [createEntityId('USET'), userId],
    );
  }
};

// ---------------------------------------------------------------------------
// Get combined profile + settings bundle
// ---------------------------------------------------------------------------
export const getUserSettingsBundle = async (userId: string) => {
  await ensureUserSettings(userId);

  const [profiles] = await pool.query<UserProfileRow[]>(
    `SELECT id, name, avatar, role, email, department, password_hash AS passwordHash
     FROM users WHERE id = ? LIMIT 1`,
    [userId],
  );

  if (!profiles.length) {
    return null;
  }

  const profile = profiles[0];

  const [settings] = await pool.query<SettingsRow[]>(
    `SELECT id, user_id AS userId, theme, language,
            notify_task_assigned AS notifyTaskAssigned,
            notify_project_updates AS notifyProjectUpdates,
            notify_deadline_reminders AS notifyDeadlineReminders
     FROM user_settings WHERE user_id = ? LIMIT 1`,
    [userId],
  );

  const setting = settings[0];

  const avatarUrl = resolveAvatarUrl(profile.avatar);

  return {
    profile: {
      fullName: profile.name,
      email: profile.email,
      role: profile.role,
      department: profile.department || 'Genel',
      avatar: profile.avatar,
      avatarUrl,
    },
    settings: {
      theme: setting.theme,
      language: setting.language,
      notifyTaskAssigned: Boolean(setting.notifyTaskAssigned),
      notifyProjectUpdates: Boolean(setting.notifyProjectUpdates),
      notifyDeadlineReminders: Boolean(setting.notifyDeadlineReminders),
    },
  };
};

// ---------------------------------------------------------------------------
// Update user settings (preferences only)
// ---------------------------------------------------------------------------
export const updateUserSettings = async (
  userId: string,
  payload: {
    theme?: string;
    language?: string;
    notifyTaskAssigned?: boolean;
    notifyProjectUpdates?: boolean;
    notifyDeadlineReminders?: boolean;
  },
) => {
  await ensureUserSettings(userId);

  if (payload.theme !== undefined && !VALID_THEMES.includes(payload.theme as any)) {
    throw new Error('Geçersiz tema seçimi.');
  }
  if (payload.language !== undefined && !VALID_LANGUAGES.includes(payload.language as any)) {
    throw new Error('Geçersiz dil seçimi.');
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (payload.theme !== undefined) {
    fields.push('theme = ?');
    values.push(payload.theme);
  }
  if (payload.language !== undefined) {
    fields.push('language = ?');
    values.push(payload.language);
  }
  if (payload.notifyTaskAssigned !== undefined) {
    fields.push('notify_task_assigned = ?');
    values.push(payload.notifyTaskAssigned);
  }
  if (payload.notifyProjectUpdates !== undefined) {
    fields.push('notify_project_updates = ?');
    values.push(payload.notifyProjectUpdates);
  }
  if (payload.notifyDeadlineReminders !== undefined) {
    fields.push('notify_deadline_reminders = ?');
    values.push(payload.notifyDeadlineReminders);
  }

  if (fields.length) {
    values.push(userId);
    await pool.query(`UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`, values);
  }

  return getUserSettingsBundle(userId);
};

// ---------------------------------------------------------------------------
// Update own profile (name, email, department – role read-only)
// ---------------------------------------------------------------------------
export const updateOwnProfile = async (
  userId: string,
  payload: { fullName?: string; email?: string; department?: string },
) => {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (payload.fullName !== undefined) {
    const name = payload.fullName.trim();
    if (!name || name.length > 120) {
      throw new Error('Ad Soyad bos olamaz ve 120 karakteri gecemez.');
    }
    fields.push('name = ?');
    values.push(name);
  }

  if (payload.email !== undefined) {
    const email = payload.email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Gecerli bir e-posta adresi girin.');
    }
    // Check uniqueness
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
      [email, userId],
    );
    if (existing.length) {
      throw new Error('Bu e-posta adresi başka bir kullanıcı tarafından kullanılmaktadır.');
    }
    fields.push('email = ?');
    values.push(email);
  }

  if (payload.department !== undefined) {
    const dept = payload.department.trim();
    if (!dept || dept.length > 120) {
      throw new Error('Departman bos olamaz ve 120 karakteri gecemez.');
    }
    fields.push('department = ?');
    values.push(dept);
  }

  if (fields.length) {
    values.push(userId);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  return getUserSettingsBundle(userId);
};

// ---------------------------------------------------------------------------
// Change own password
// ---------------------------------------------------------------------------
export const changeOwnPassword = async (
  userId: string,
  payload: { currentPassword: string; newPassword: string; confirmPassword: string },
) => {
  if (!payload.currentPassword || !payload.newPassword || !payload.confirmPassword) {
    throw new Error('Tum sifre alanlari zorunludur.');
  }

  if (payload.newPassword !== payload.confirmPassword) {
    throw new Error('Yeni sifre ve onay sifresi eslesmemektedir.');
  }

  if (payload.newPassword.length < 6) {
    throw new Error('Yeni sifre en az 6 karakter olmalidir.');
  }

  const [users] = await pool.query<UserProfileRow[]>(
    'SELECT id, password_hash AS passwordHash FROM users WHERE id = ? LIMIT 1',
    [userId],
  );

  if (!users.length || !users[0].passwordHash) {
    throw new Error('Kullanici bulunamadı veya sifre henuz ayarlanmamis.');
  }

  const isCurrentValid = await verifyPassword(payload.currentPassword, users[0].passwordHash);
  if (!isCurrentValid) {
    throw new Error('Mevcut sifre hatali.');
  }

  // Ensure new password differs from current
  const isSamePassword = await verifyPassword(payload.newPassword, users[0].passwordHash);
  if (isSamePassword) {
    throw new Error('Yeni sifre mevcut sifreden farkli olmalidir.');
  }

  const newHash = await hashPassword(payload.newPassword);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
};

// ---------------------------------------------------------------------------
// Reset settings to defaults
// ---------------------------------------------------------------------------
export const resetUserSettings = async (userId: string) => {
  await ensureUserSettings(userId);
  await pool.query(
    `UPDATE user_settings SET
      theme = 'light',
      language = 'tr',
      notify_task_assigned = TRUE,
      notify_project_updates = TRUE,
      notify_deadline_reminders = TRUE
     WHERE user_id = ?`,
    [userId],
  );
  return getUserSettingsBundle(userId);
};

// ---------------------------------------------------------------------------
// Update own avatar
// ---------------------------------------------------------------------------
export const updateOwnAvatar = async (userId: string, avatarValue: string) => {
  await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarValue, userId]);
  return getUserSettingsBundle(userId);
};

// ---------------------------------------------------------------------------
// Helper: resolve avatar URL
// ---------------------------------------------------------------------------
const resolveAvatarUrl = (avatar: string) => {
  if (avatar.startsWith('/uploads/')) {
    return avatar;
  }
  return `https://picsum.photos/seed/${avatar}/120/120`;
};
