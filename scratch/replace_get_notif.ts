import fs from 'fs';

let content = fs.readFileSync('server/services/dashboardService.ts', 'utf8');

const targetStr = `const getNotifications = async () => {
  const [rows] = await pool.query<NotificationRow[]>(
    'SELECT id, title, description, type, is_read AS isRead, created_at AS createdAt FROM notifications ORDER BY created_at DESC LIMIT 20',
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    time: formatRelativeTime(row.createdAt),
    type: row.type,
    read: Boolean(row.isRead),
  }));
};`;

const replaceStr = `const getNotifications = async () => {
  const [rows] = await pool.query<NotificationRow[]>(
    'SELECT id, title, description, type, is_read AS isRead, created_at AS createdAt, entity_type AS entityType, entity_id AS entityId FROM notifications ORDER BY created_at DESC LIMIT 20',
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    time: formatRelativeTime(row.createdAt),
    type: row.type,
    read: Boolean(row.isRead),
    entityType: row.entityType || 'none',
    entityId: row.entityId || null,
  }));
};`;

if (content.includes(targetStr)) {
  fs.writeFileSync('server/services/dashboardService.ts', content.replace(targetStr, replaceStr));
  console.log('Replaced');
} else {
  console.log('Not found');
}
