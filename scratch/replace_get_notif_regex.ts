import fs from 'fs';

let content = fs.readFileSync('server/services/dashboardService.ts', 'utf8');

content = content.replace(
  /SELECT id, title, description, type, is_read AS isRead, created_at AS createdAt FROM notifications ORDER BY created_at DESC LIMIT 20/g,
  'SELECT id, title, description, type, is_read AS isRead, created_at AS createdAt, entity_type AS entityType, entity_id AS entityId FROM notifications ORDER BY created_at DESC LIMIT 20'
);

content = content.replace(
  /read: Boolean\(row\.isRead\),/g,
  "read: Boolean(row.isRead),\n    entityType: row.entityType || 'none',\n    entityId: row.entityId || null,"
);

// We should also add entityType and entityId to NotificationRow interface
content = content.replace(
  /isRead: number;/g,
  "isRead: number;\n  entityType: string | null;\n  entityId: string | null;"
);

fs.writeFileSync('server/services/dashboardService.ts', content);
console.log('Replaced');
