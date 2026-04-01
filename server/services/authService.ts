import { RowDataPacket } from 'mysql2';
import { getPool } from '../db/pool.js';
import { createEntityId } from '../utils/formatters.js';
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from '../utils/security.js';
import { getPermissionsForRole } from '../utils/permissions.js';

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
});

const getUserByEmail = async (email: string) => {
  const [rows] = await pool.query<AuthUserRow[]>(
    `SELECT
      id,
      name,
      avatar,
      role,
      email,
      status,
      last_active AS lastActive,
      department,
      password_hash AS passwordHash
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  return rows[0] || null;
};

const getUserById = async (userId: string) => {
  const [rows] = await pool.query<AuthUserRow[]>(
    `SELECT
      id,
      name,
      avatar,
      role,
      email,
      status,
      last_active AS lastActive,
      department,
      password_hash AS passwordHash
     FROM users
     WHERE id = ?
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
  role: AuthUserRow['role'];
  department?: string;
}) => {
  const existingUser = await getUserByEmail(payload.email);
  if (existingUser) {
    throw new Error('Bu e-posta adresi zaten kullanimda.');
  }

  const passwordHash = await hashPassword(payload.password);
  const userId = createEntityId('USR');
  const avatarSeed = `user-${userId.toLowerCase()}`;

  await pool.query(
    `INSERT INTO users (id, name, avatar, role, email, status, last_active, department, password_hash)
     VALUES (?, ?, ?, ?, ?, 'Online', 'Simdi', ?, ?)`,
    [userId, payload.name, avatarSeed, payload.role, payload.email, payload.department || 'Genel', passwordHash],
  );

  const token = await createSession(userId);
  const user = await getUserById(userId);

  if (!user) {
    throw new Error('Kayit sonrasinda kullanici bulunamadi.');
  }

  return {
    token,
    user: toPublicUser(user),
    permissions: getPermissionsForRole(user.role),
  };
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

  const token = await createSession(user.id);
  return {
    token,
    user: toPublicUser(user),
    permissions: getPermissionsForRole(user.role),
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
      u.password_hash AS passwordHash
     FROM auth_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?
       AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );

  if (!rows.length) {
    return null;
  }

  return {
    user: toPublicUser(rows[0]),
    permissions: getPermissionsForRole(rows[0].role),
  };
};

export const logoutUser = async (token: string) => {
  await pool.query('DELETE FROM auth_sessions WHERE token_hash = ?', [hashSessionToken(token)]);
};

export const seedMissingPasswords = async (defaultPassword: string) => {
  const passwordHash = await hashPassword(defaultPassword);
  await pool.query('UPDATE users SET password_hash = ? WHERE password_hash IS NULL OR password_hash = ""', [passwordHash]);
};
