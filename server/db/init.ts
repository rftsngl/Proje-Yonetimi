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
  action ENUM('role_update', 'department_update') NOT NULL,
  old_value VARCHAR(191) DEFAULT NULL,
  new_value VARCHAR(191) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

const baseSeedStatements = [
  `INSERT IGNORE INTO users (id, name, avatar, role, email, status, last_active, department) VALUES
    ('user1', 'Celal Halilov', 'user1', 'Admin', 'celal@zodiac.com', 'Online', 'Şimdi', 'Yönetim'),
    ('user2', 'Ayşe Kaya', 'user2', 'Senior Developer', 'ayse@zodiac.com', 'Online', '2 dk önce', 'Yazılım'),
    ('user3', 'Mehmet Öz', 'user3', 'UI/UX Designer', 'mehmet@zodiac.com', 'Busy', '10 dk önce', 'Tasarım'),
    ('user4', 'Zeynep Ak', 'user4', 'QA Engineer', 'zeynep@zodiac.com', 'Offline', '1 saat önce', 'Yazılım'),
    ('user5', 'Can Demir', 'user5', 'Frontend Developer', 'can@zodiac.com', 'Online', '5 dk önce', 'Yazılım'),
    ('user6', 'Selin Yılmaz', 'user6', 'Product Manager', 'selin@zodiac.com', 'Online', 'Şimdi', 'Ürün')`,
  `INSERT IGNORE INTO projects (id, name, description, manager_id, progress, start_date, end_date, status, category, theme_color) VALUES
    ('PRJ-001', 'E-Ticaret Mobil Uygulama', 'Yeni nesil alışveriş deneyimi için React Native tabanlı mobil uygulama geliştirme süreci.', 'user1', 75, '2026-03-01', '2026-04-08', 'Aktif', 'Mobil Geliştirme', 'bg-indigo-600'),
    ('PRJ-002', 'Kurumsal Web Sitesi', 'Şirketin dijital varlığını güçlendirmek amacıyla modern ve responsive web sitesi tasarımı.', 'user2', 40, '2026-03-05', '2026-05-11', 'Aktif', 'Web Tasarım', 'bg-blue-500'),
    ('PRJ-003', 'SaaS Dashboard Paneli', 'Veri analitiği ve raporlama için özelleştirilebilir kullanıcı paneli arayüzü.', 'user3', 90, '2026-02-15', '2026-04-01', 'Aktif', 'UI/UX Tasarım', 'bg-emerald-500'),
    ('PRJ-004', 'CRM Entegrasyonu', 'Mevcut sistemlerin Salesforce ile tam uyumlu hale getirilmesi ve veri senkronizasyonu.', 'user4', 100, '2026-01-10', '2026-03-20', 'Tamamlandı', 'Backend', 'bg-amber-500'),
    ('PRJ-005', 'Yapay Zeka Destekli Chatbot', 'Müşteri hizmetleri için GPT tabanlı akıllı destek asistanı geliştirme projesi.', 'user1', 15, '2026-03-20', '2026-06-25', 'Aktif', 'AI / ML', 'bg-rose-500')`,
  `INSERT IGNORE INTO project_members (project_id, user_id) VALUES
    ('PRJ-001', 'user1'), ('PRJ-001', 'user2'), ('PRJ-001', 'user3'), ('PRJ-001', 'user4'), ('PRJ-001', 'user5'),
    ('PRJ-002', 'user2'), ('PRJ-002', 'user3'), ('PRJ-002', 'user6'),
    ('PRJ-003', 'user1'), ('PRJ-003', 'user3'), ('PRJ-003', 'user4'),
    ('PRJ-004', 'user2'), ('PRJ-004', 'user4'),
    ('PRJ-005', 'user1'), ('PRJ-005', 'user5'), ('PRJ-005', 'user6')`,
  `INSERT IGNORE INTO tasks (id, title, description, priority, status, due_date, project_id, comments_count, attachments_count) VALUES
    ('TSK-001', 'Kullanıcı Araştırması', 'Yeni özellikler için kullanıcı geri bildirimlerini analiz et.', 'Yüksek', 'Yapılacak', '2026-03-30', 'PRJ-001', 1, 2),
    ('TSK-002', 'Logo Tasarımı', 'Marka kimliği için alternatif logo çalışmaları yap.', 'Orta', 'Yapılacak', '2026-04-02', 'PRJ-001', 1, 1),
    ('TSK-003', 'Dashboard Geliştirme', 'Ana paneldeki istatistik grafiklerini tamamla.', 'Yüksek', 'Devam Ediyor', '2026-03-28', 'PRJ-003', 1, 1),
    ('TSK-004', 'API Dokümantasyonu', 'Backend servisleri için Swagger dokümantasyonunu hazırla.', 'Düşük', 'Tamamlandı', '2026-03-25', 'PRJ-003', 0, 1),
    ('TSK-005', 'Mobil Uygulama Testleri', 'Mobil uygulama için kapsamlı test senaryoları oluştur.', 'Yüksek', 'Gecikti', '2026-03-20', 'PRJ-001', 0, 0)`,
  `INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES
    ('TSK-001', 'user1'), ('TSK-001', 'user2'),
    ('TSK-002', 'user3'),
    ('TSK-003', 'user1'), ('TSK-003', 'user4'),
    ('TSK-004', 'user2'),
    ('TSK-005', 'user4')`,
  `INSERT IGNORE INTO notifications (id, user_id, title, description, type, is_read, created_at) VALUES
    ('NTF-001', 'user1', 'Hoş Geldiniz', 'Görev Yönetimi Sistemine hoş geldiniz.', 'system', FALSE, DATE_SUB(NOW(), INTERVAL 5 MINUTE))`,
  `INSERT IGNORE INTO calendar_events (id, title, date, color, event_type, project_id) VALUES
    ('EV-001', 'Tasarım Teslimi', '2026-03-28', 'bg-indigo-100 text-indigo-700 border-indigo-200', 'tasarım', 'PRJ-003'),
    ('EV-002', 'Müşteri Toplantısı', '2026-03-29', 'bg-amber-100 text-amber-700 border-amber-200', 'toplantı', 'PRJ-002'),
    ('EV-003', 'Sprint Review', '2026-03-30', 'bg-emerald-100 text-emerald-700 border-emerald-200', 'geliştirme', 'PRJ-003'),
    ('EV-004', 'Backend Deploy', '2026-04-02', 'bg-rose-100 text-rose-700 border-rose-200', 'kritik', 'PRJ-004'),
    ('EV-005', 'UI Revizyonları', '2026-04-05', 'bg-sky-100 text-sky-700 border-sky-200', 'tasarım', 'PRJ-001')`,
];

const commentSeedStatements = [
  `INSERT IGNORE INTO task_comments (id, task_id, user_id, content, created_at) VALUES
    ('CMT-001', 'TSK-001', 'user2', 'Kullanıcı görüşmeleri tamamlandı, özet raporu ekliyorum.', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    ('CMT-002', 'TSK-002', 'user3', 'İlk logo setini hazırladım, geri bildirim bekliyorum.', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
    ('CMT-003', 'TSK-003', 'user1', 'Grafik bileşenleri büyük ölçüde tamamlandı, son responsive kontrolleri kaldı.', DATE_SUB(NOW(), INTERVAL 30 MINUTE))`,
  `UPDATE tasks t SET comments_count = (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id)`,
];

const attachmentSeedStatements = [
  `INSERT IGNORE INTO task_attachments (id, task_id, name, file_type, file_size_label) VALUES
    ('ATT-001', 'TSK-001', 'Tasarim_Rehberi.pdf', 'PDF', '2.4 MB'),
    ('ATT-002', 'TSK-001', 'Arastirma_Notlari.docx', 'DOC', '980 KB'),
    ('ATT-003', 'TSK-002', 'Logo_Alternatif.png', 'PNG', '1.1 MB'),
    ('ATT-004', 'TSK-003', 'Dashboard_Charts.fig', 'FIG', '3.6 MB'),
    ('ATT-005', 'TSK-004', 'OpenAPI_Spec.yaml', 'YAML', '210 KB')`,
  `UPDATE tasks t SET attachments_count = (SELECT COUNT(*) FROM task_attachments ta WHERE ta.task_id = t.id)`,
];

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
  await ensureColumnExists('tasks', 'parent_task_id', 'VARCHAR(32) DEFAULT NULL');
  await ensureColumnExists('tasks', 'start_date', 'DATE DEFAULT NULL');

  const [rows] = await pool.query<(RowDataPacket & { total: number })[]>('SELECT COUNT(*) AS total FROM users');
  if (!rows[0]?.total) {
    for (const statement of baseSeedStatements) {
      await pool.query(statement);
    }
  }

  const [commentRows] = await pool.query<(RowDataPacket & { total: number })[]>('SELECT COUNT(*) AS total FROM task_comments');
  if (!commentRows[0]?.total) {
    for (const statement of commentSeedStatements) {
      await pool.query(statement);
    }
  }

  const [attachmentRows] = await pool.query<(RowDataPacket & { total: number })[]>('SELECT COUNT(*) AS total FROM task_attachments');
  if (!attachmentRows[0]?.total) {
    for (const statement of attachmentSeedStatements) {
      await pool.query(statement);
    }
  }

  await seedMissingPasswords('123456');
};
