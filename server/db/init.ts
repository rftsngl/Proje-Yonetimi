import { RowDataPacket } from 'mysql2';
import { env } from '../config/env.js';
import { seedMissingPasswords } from '../services/authService.js';
import { ensureDatabaseExists, getPool } from './pool.js';

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  avatar VARCHAR(64) NOT NULL,
  role VARCHAR(120) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  status ENUM('Online', 'Offline', 'Busy') NOT NULL DEFAULT 'Offline',
  last_active VARCHAR(64) DEFAULT NULL,
  department VARCHAR(120) DEFAULT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  manager_id VARCHAR(32) NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  status ENUM('Aktif', 'Tamamlandı') NOT NULL DEFAULT 'Aktif',
  category VARCHAR(120) NOT NULL,
  theme_color VARCHAR(32) NOT NULL DEFAULT 'bg-indigo-600',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_manager FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id VARCHAR(32) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  PRIMARY KEY (project_id, user_id),
  CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  parent_task_id VARCHAR(32) DEFAULT NULL,
  priority ENUM('Yüksek', 'Orta', 'Düşük') NOT NULL DEFAULT 'Orta',
  status ENUM('Yapılacak', 'Devam Ediyor', 'Tamamlandı', 'Gecikti') NOT NULL DEFAULT 'Yapılacak',
  start_date DATE DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  project_id VARCHAR(32) NOT NULL,
  comments_count INT NOT NULL DEFAULT 0,
  attachments_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_parent FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_assignees (
  task_id VARCHAR(32) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  PRIMARY KEY (task_id, user_id),
  CONSTRAINT fk_task_assignees_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_assignees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_comments (
  id VARCHAR(32) PRIMARY KEY,
  task_id VARCHAR(32) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_task_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_attachments (
  id VARCHAR(32) PRIMARY KEY,
  task_id VARCHAR(32) NOT NULL,
  name VARCHAR(191) NOT NULL,
  file_type VARCHAR(32) NOT NULL,
  file_size_label VARCHAR(32) NOT NULL,
  mime_type VARCHAR(191) DEFAULT NULL,
  file_size_bytes BIGINT DEFAULT NULL,
  file_path VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_attachments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(32) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  type ENUM('task', 'project', 'mention', 'system') NOT NULL,
  entity_type VARCHAR(32) DEFAULT NULL,
  entity_id VARCHAR(32) DEFAULT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  date DATE NOT NULL,
  color VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  reminder_offset INT DEFAULT 0,
  project_id VARCHAR(32) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_calendar_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id VARCHAR(32) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_audit_logs (
  id VARCHAR(32) PRIMARY KEY,
  actor_user_id VARCHAR(32) NOT NULL,
  target_user_id VARCHAR(32) NOT NULL,
  action ENUM('role_update', 'department_update', 'user_deletion') NOT NULL,
  old_value VARCHAR(191) DEFAULT NULL,
  new_value VARCHAR(191) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_settings (
  id VARCHAR(32) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL UNIQUE,
  theme ENUM('light','dark','system') NOT NULL DEFAULT 'light',
  language VARCHAR(8) NOT NULL DEFAULT 'tr',
  notify_task_assigned BOOLEAN NOT NULL DEFAULT TRUE,
  notify_project_updates BOOLEAN NOT NULL DEFAULT TRUE,
  notify_deadline_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

const baseSeedStatements = [
  `INSERT IGNORE INTO users (id, name, avatar, role, email, status, last_active, department) VALUES
    ('user7', 'Örnek Kullanıcı', 'user7', 'Admin', 'ornek@zodiac.com', 'Offline', NULL, 'Genel')`,
  `INSERT IGNORE INTO projects (id, name, description, manager_id, progress, start_date, end_date, status, category, theme_color) VALUES
    ('PRJ-001', 'Başlangıç Projesi', 'Sistemi keşfetmeniz için oluşturulmuş örnek proje.', 'user7', 0, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Aktif', 'Genel', 'bg-indigo-600')`,
  `INSERT IGNORE INTO project_members (project_id, user_id) VALUES
    ('PRJ-001', 'user7')`,
  `INSERT IGNORE INTO tasks (id, title, description, priority, status, project_id, comments_count, attachments_count) VALUES
    ('TSK-001', 'Hoş Geldiniz', 'Görev Yönetimi Sistemine hoş geldiniz! Buradan görevlerinizi yönetmeye başlayabilirsiniz.', 'Orta', 'Yapılacak', 'PRJ-001', 0, 0)`,
  `INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES
    ('TSK-001', 'user7')`,
  `INSERT IGNORE INTO notifications (id, user_id, title, description, type, is_read, created_at) VALUES
    ('NTF-001', 'user7', 'Hoş Geldiniz', 'Görev Yönetimi Sistemine hoş geldiniz.', 'system', FALSE, NOW())`,
];

const commentSeedStatements: string[] = [];
const attachmentSeedStatements: string[] = [];
const auditLogSeedStatements: string[] = [];

const ensureColumnExists = async (tableName: string, columnName: string, definition: string) => {
  const pool = getPool();
  const [rows] = await pool.query<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total
     FROM information_schema.columns
     WHERE table_schema = ?
       AND table_name = ?
       AND column_name = ?`,
    [env.mysqlDatabase, tableName, columnName],
  );

  if (!rows[0]?.total) {
    await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  }
};

export const initializeDatabase = async () => {
  await ensureDatabaseExists();

  const pool = getPool();
  await pool.query(schemaSql);
  await ensureColumnExists('task_comments', 'updated_at', 'TIMESTAMP NULL DEFAULT NULL');
  await ensureColumnExists('task_attachments', 'mime_type', 'VARCHAR(191) DEFAULT NULL');
  await ensureColumnExists('task_attachments', 'file_size_bytes', 'BIGINT DEFAULT NULL');
  await ensureColumnExists('task_attachments', 'file_path', 'VARCHAR(255) DEFAULT NULL');
  await ensureColumnExists('users', 'password_hash', 'VARCHAR(255) DEFAULT NULL');
  await ensureColumnExists('users', 'department', 'VARCHAR(120) DEFAULT NULL');
  await ensureColumnExists('tasks', 'parent_task_id', 'VARCHAR(32) DEFAULT NULL');
  await ensureColumnExists('tasks', 'start_date', 'DATE DEFAULT NULL');
  await ensureColumnExists('tasks', 'comments_count', 'INT NOT NULL DEFAULT 0');
  await ensureColumnExists('tasks', 'attachments_count', 'INT NOT NULL DEFAULT 0');
  await ensureColumnExists('calendar_events', 'end_date', 'DATE DEFAULT NULL');
  await ensureColumnExists('calendar_events', 'reminder_offset', 'INT DEFAULT 0 AFTER event_type');
  await ensureColumnExists('notifications', 'entity_type', 'VARCHAR(32) DEFAULT NULL AFTER type');
  await ensureColumnExists('notifications', 'entity_id', 'VARCHAR(32) DEFAULT NULL AFTER entity_type');
  await ensureColumnExists('user_settings', 'notify_task_assigned', 'BOOLEAN NOT NULL DEFAULT TRUE');
  await ensureColumnExists('user_settings', 'notify_project_updates', 'BOOLEAN NOT NULL DEFAULT TRUE');
  await ensureColumnExists('user_settings', 'notify_deadline_reminders', 'BOOLEAN NOT NULL DEFAULT TRUE');


  // Migrasyon: Önceki sürümde ASCII-safe yazılmış ENUM değerleri varsa Türkçe'ye çevir
  // Bu sorgular idempotent'tir (eğer zaten doğruysa etkilemez)
  await pool.query(`UPDATE tasks SET status = 'Yapılacak'  WHERE status = 'Yapilacak'`).catch(() => null);
  await pool.query(`UPDATE tasks SET status = 'Tamamlandı' WHERE status = 'Tamamlandi'`).catch(() => null);
  await pool.query(`UPDATE tasks SET priority = 'Yüksek'   WHERE priority = 'Yuksek'`).catch(() => null);
  await pool.query(`UPDATE tasks SET priority = 'Düşük'    WHERE priority = 'Dusuk'`).catch(() => null);
  await pool.query(`UPDATE projects SET status = 'Tamamlandı' WHERE status = 'Tamamlandi'`).catch(() => null);

  // ENUM tanımlarını utf8mb4 charset ile Türkçe değerlere güncelle
  await pool.query(`
    ALTER TABLE tasks
      MODIFY COLUMN status   ENUM('Yapılacak', 'Devam Ediyor', 'Tamamlandı', 'Gecikti') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Yapılacak',
      MODIFY COLUMN priority ENUM('Yüksek', 'Orta', 'Düşük') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Orta'
  `).catch(() => null);

  await pool.query(`
    ALTER TABLE projects
      MODIFY COLUMN status ENUM('Aktif', 'Tamamlandı') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Aktif'
  `).catch(() => null);

  await pool.query(`
    ALTER TABLE user_audit_logs 
      MODIFY COLUMN action ENUM('role_update', 'department_update', 'user_deletion') NOT NULL
  `).catch(() => null);

  for (const statement of baseSeedStatements) {
    await pool.query(statement);
  }

  for (const statement of commentSeedStatements) {
    await pool.query(statement);
  }

  for (const statement of attachmentSeedStatements) {
    await pool.query(statement);
  }

  for (const statement of auditLogSeedStatements) {
    await pool.query(statement);
  }

  await seedMissingPasswords('123456');

  // Seed default settings for users without a settings row
  await pool.query(`
    INSERT INTO user_settings (id, user_id)
    SELECT CONCAT('USET-', u.id), u.id
    FROM users u
    LEFT JOIN user_settings us ON us.user_id = u.id
    WHERE us.id IS NULL
  `);



  // Güvenli Migration: Varsayılan temayı 'light' yap ve mevcut 'system' olanları güncelle
  try {
    await pool.query("UPDATE user_settings SET theme = 'light' WHERE theme = 'system'");
    console.log("Migration: Mevcut 'system' temaları 'light' olarak güncellendi.");
  } catch (error) {
    console.error('Migration hatası (theme update):', error);
  }
  // Süresi dolmuş oturumları temizle
  await pool.query('DELETE FROM auth_sessions WHERE expires_at < NOW()');
};
