import fs from 'fs';

let content = fs.readFileSync('server/services/dashboardService.ts', 'utf8');

content = content.replace(
  /await connection\.query\('INSERT INTO notifications \(id, title, description, type\) VALUES \(\?, \?, \?, \?\)', \[\s*createEntityId\('NTF'\),\s*'([^']+)',/g,
  "await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [\\n      createEntityId('NTF'),\\n      '$1',"
);

// Also pool.query
content = content.replace(
  /await pool\.query\('INSERT INTO notifications \(id, title, description, type\) VALUES \(\?, \?, \?, \?\)', \[\s*createEntityId\('NTF'\),\s*'([^']+)',/g,
  "await pool.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [\\n    createEntityId('NTF'),\\n    '$1',"
);

content = content.replace(/'project',\s*\]\);/g, "'project',\n      'project',\n      projectId\n    ]);");
content = content.replace(/'system',\s*\]\);/g, "'system',\n      'none',\n      null\n    ]);");
content = content.replace(/'task',\s*\]\);/g, "'task',\n      'task',\n      taskId\n    ]);");
content = content.replace(/'mention',\s*\]\);/g, "'mention',\n      'task',\n      taskId\n    ]);");

// some exceptions:
// createProject has id not projectId
content = content.replace(
  /'Yeni Proje Oluşturuldu',\s*`"\$\{payload.name\}" projesi başarıyla oluşturuldu.`,\s*'project',\s*'project',\s*projectId/g,
  "'Yeni Proje Oluşturuldu',\n      `\"${payload.name}\" projesi başarıyla oluşturuldu.`,\n      'project',\n      'project',\n      id"
);

// createTask has id not taskId
content = content.replace(
  /'Yeni Görev Oluşturuldu',\s*`"\$\{payload.title\}" görevi planlandı ve ekibe atandı.`,\s*'task',\s*'task',\s*taskId/g,
  "'Yeni Görev Oluşturuldu',\n      `\"${payload.title}\" görevi planlandı ve ekibe atandı.`,\n      'task',\n      'task',\n      id"
);

// takvim eklendi is 'calendar' and id
content = content.replace(
  /'Takvim Etkinligi Eklendi',\s*`"\$\{payload.title\}" etkinligi \$\{payload.date\} tarihi icin takvime eklendi.`,\s*'system',\s*'none',\s*null/g,
  "'Takvim Etkinligi Eklendi',\n    `\"${payload.title}\" etkinligi ${payload.date} tarihi icin takvime eklendi.`,\n    'system',\n    'calendar',\n    id"
);


fs.writeFileSync('server/services/dashboardService.ts', content);
console.log('Replaced by regex.');
