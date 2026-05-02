import { RowDataPacket } from 'mysql2';
import { getPool } from '../db/pool.js';
import { createEntityId } from '../utils/formatters.js';
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from '../utils/security.js';
import { getPermissionsForRole } from '../utils/permissions.js';

const VALID_DEPARTMENTS = [
  'Yazılım',
  'Tasarım',
  'Ürün Yönetimi',
  'Yönetim',
  'QA / Test',
  'DevOps',
  'Pazarlama',
  'HR',
  'Genel',
];

type AuthUserRow = RowDataPacket & {
  id: string;
  name: string;
  avatar: string;
  role: 'Admin' | 'Product Manager' | 'Senior Developer' | 'Frontend Developer' | 'UI/UX Designer' | 'QA Engineer';
  email: string;
  status: 'Online' | 'Offline' | 'Busy';
  lastActive: string | null;
  department: string | null;
  passwordHash: string | null;
  workspaceId: string;
  workspaceName: string;
};

const pool = getPool();

const toPublicUser = (row: AuthUserRow) => ({
  id: row.id,
  name: row.name,
  avatar: row.avatar,
  role: row.role,
  email: row.email,
  status: row.status,
  lastActive: row.lastActive || '',
  department: row.department || 'Genel',
  workspaceId: row.workspaceId,
  workspaceName: row.workspaceName,
});

const getUserByEmail = async (email: string) => {
  const [rows] = await pool.query<AuthUserRow[]>(
    `SELECT
      u.id,
      u.name,
      u.avatar,
      u.role,
      u.email,
      u.status,
      u.last_active AS lastActive,
      u.department,
      u.password_hash AS passwordHash,
      u.workspace_id AS workspaceId,
      w.name AS workspaceName
     FROM users u
     LEFT JOIN workspaces w ON w.id = u.workspace_id
     WHERE u.email = ?
     LIMIT 1`,
    [email],
  );

  return rows[0] || null;
};

const getUserById = async (userId: string) => {
  const [rows] = await pool.query<AuthUserRow[]>(
    `SELECT
      u.id,
      u.name,
      u.avatar,
      u.role,
      u.email,
      u.status,
      u.last_active AS lastActive,
      u.department,
      u.password_hash AS passwordHash,
      u.workspace_id AS workspaceId,
      w.name AS workspaceName
     FROM users u
     LEFT JOIN workspaces w ON w.id = u.workspace_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
  );

  return rows[0] || null;
};

const createSession = async (userId: string) => {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await pool.query(
    'INSERT INTO auth_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [createEntityId('SES'), userId, hashSessionToken(token), expiresAt],
  );
  return token;
};

export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  department?: string;
  workspaceName: string;
}) => {
  
  const existingUser = await getUserByEmail(payload.email);
  if (existingUser) {
    throw new Error('Bu e-posta adresi zaten kullanimda.');
  }

  const department = payload.department || 'Genel';
  if (!VALID_DEPARTMENTS.includes(department)) {
    throw new Error('Geçersiz departman seçimi.');
  }

  // Workspace ismi daha önce alınmış mı kontrol et
  const [existingWs] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM workspaces WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [payload.workspaceName.trim()],
  );

  const passwordHash = await hashPassword(payload.password);
  const userId = createEntityId('USR');
  const avatarSeed = `user-${userId.toLowerCase()}`;

  let workspaceId: string;
  let userRole: string;

  if (existingWs.length > 0) {
    // Mevcut workspace'e katıl — normal üye olarak
    workspaceId = existingWs[0].id as string;
    userRole = 'Frontend Developer';
  } else {
    // Yeni workspace oluştur — kurucu olarak Admin ol
    workspaceId = createEntityId('WS');
    userRole = 'Admin';

    await pool.query(
      'INSERT INTO workspaces (id, name) VALUES (?, ?)',
      [workspaceId, payload.workspaceName.trim()],
    );
  }

  await pool.query(
    `INSERT INTO users (id, name, avatar, role, email, status, last_active, department, password_hash, workspace_id)
     VALUES (?, ?, ?, ?, ?, 'Online', 'Simdi', ?, ?, ?)`,
    [userId, payload.name, avatarSeed, userRole, payload.email, department, passwordHash, workspaceId],
  );

  const token = await createSession(userId);
  const user = await getUserById(userId);

  if (!user) {
    throw new Error('Kayıt sonrasında kullanıcı bulunamadı.');
  }

  return {
    token,
    user: toPublicUser(user),
    permissions: getPermissionsForRole(user.role),
  };
};


/**
 * Workspace'te hiç Admin yoksa, verilen kullanıcıyı geçici Admin olarak atar.
 * Her login ve session restore işleminde çağrılır.
 * Geri dönüş: kullanıcı Admin'e terfi ettiyse true, aksi halde false.
 */
const promoteToTempAdminIfNeeded = async (userId: string, workspaceId: string): Promise<boolean> => {
  const [adminRows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE role = 'Admin' AND workspace_id = ? LIMIT 1",
    [workspaceId],
  );

  if (adminRows.length === 0) {
    // Workspace'te hiç admin yok — bu kullanıcıyı geçici admin yap
    await pool.query('UPDATE users SET role = ? WHERE id = ?', ['Admin', userId]);
    return true;
  }

  return false;
};

export const loginUser = async (payload: { email: string; password: string }) => {
  const user = await getUserByEmail(payload.email);
  if (!user?.passwordHash) {
    throw new Error('E-posta veya sifre hatali.');
  }

  const isValidPassword = await verifyPassword(payload.password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('E-posta veya sifre hatali.');
  }

  // Workspace'te admin yoksa bu kullanıcıyı geçici admin yap
  const promoted = await promoteToTempAdminIfNeeded(user.id, user.workspaceId);

  const token = await createSession(user.id);

  // Terfi olduysa güncel kullanıcı verisini yeniden çek
  const finalUser = promoted ? await getUserById(user.id) : user;
  if (!finalUser) {
    throw new Error('Kullanıcı verisi okunamadı.');
  }

  return {
    token,
    user: toPublicUser(finalUser),
    permissions: getPermissionsForRole(finalUser.role),
  };
};

export const getUserFromToken = async (token: string) => {
  const tokenHash = hashSessionToken(token);
  const [rows] = await pool.query<AuthUserRow[]>(
    `SELECT
      u.id,
      u.name,
      u.avatar,
      u.role,
      u.email,
      u.status,
      u.last_active AS lastActive,
      u.department,
      u.password_hash AS passwordHash,
      u.workspace_id AS workspaceId,
      w.name AS workspaceName
     FROM auth_sessions s
     INNER JOIN users u ON u.id = s.user_id
     LEFT JOIN workspaces w ON w.id = u.workspace_id
     WHERE s.token_hash = ?
       AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );

  if (!rows.length) {
    return null;
  }

  // Session restore sırasında da workspace admin kontrolü yap
  const promoted = await promoteToTempAdminIfNeeded(rows[0].id, rows[0].workspaceId);
  const finalUser = promoted ? await getUserById(rows[0].id) : rows[0];

  if (!finalUser) {
    return null;
  }

  return {
    user: toPublicUser(finalUser),
    permissions: getPermissionsForRole(finalUser.role),
  };
};

export const logoutUser = async (token: string) => {
  await pool.query('DELETE FROM auth_sessions WHERE token_hash = ?', [hashSessionToken(token)]);
};

export const seedMissingPasswords = async (defaultPassword: string) => {
  const passwordHash = await hashPassword(defaultPassword);
  await pool.query('UPDATE users SET password_hash = ? WHERE (password_hash IS NULL OR password_hash = "") AND email = "ornek@zodiac.com"', [passwordHash]);
};

export const resetPassword = async (payload: { email: string; newPassword: string }) => {
  const { email, newPassword } = payload;

  if (!email || !newPassword) {
    throw new Error('E-posta ve yeni şifre zorunludur.');
  }

  if (newPassword.length < 6) {
    throw new Error('Yeni şifre en az 6 karakter olmalıdır.');
  }

  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Bu e-posta adresine kayıtlı bir kullanıcı bulunamadı.');
  }

  const newHash = await hashPassword(newPassword);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);

  return { ok: true, message: 'Şifreniz başarıyla güncellendi.' };
};
