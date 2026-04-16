import fs from 'fs';

let content = fs.readFileSync('server/services/dashboardService.ts', 'utf8');

const replacements = [
  {
    find: `await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Yeni Proje Oluşturuldu',
      \`"\${payload.name}" projesi başarıyla oluşturuldu.\`,
      'project',
    ]);`,
    replace: `await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Yeni Proje Oluşturuldu',
      \`"\${payload.name}" projesi başarıyla oluşturuldu.\`,
      'project',
      'project',
      id
    ]);`
  },
  {
    find: `await pool.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
    createEntityId('NTF'),
    'Takvim Etkinligi Eklendi',
    \`"\${payload.title}" etkinligi \${payload.date} tarihi icin takvime eklendi.\`,
    'system',
  ]);`,
    replace: `await pool.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
    createEntityId('NTF'),
    'Takvim Etkinligi Eklendi',
    \`"\${payload.title}" etkinligi \${payload.date} tarihi icin takvime eklendi.\`,
    'system',
    'calendar',
    id
  ]);`
  },
  {
    find: `await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Takvim Etkinligi Silindi',
      \`"\${eventTitle}" etkinligi \${eventDate} tarihli takvim kayitlarindan kaldirildi.\`,
      'system',
    ]);`,
    replace: `await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Takvim Etkinligi Silindi',
      \`"\${eventTitle}" etkinligi \${eventDate} tarihli takvim kayitlarindan kaldirildi.\`,
      'system',
      'none',
      null
    ]);`
  },
  {
    find: `await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Proje Güncellendi',
      \`"\${payload.name}" projesi başarıyla güncellendi.\`,
      'project',
    ]);`,
    replace: `await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Proje Güncellendi',
      \`"\${payload.name}" projesi başarıyla güncellendi.\`,
      'project',
      'project',
      projectId
    ]);`
  },
  {
    find: `await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Proje Silindi',
      \`"\${projectName}" projesi sistemden kaldırıldı.\`,
      'project',
    ]);`,
    replace: `await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Proje Silindi',
      \`"\${projectName}" projesi sistemden kaldırıldı.\`,
      'project',
      'none',
      null
    ]);`
  },
  {
    find: `await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Projeye Yeni Üye Eklendi',
      \`"\${userRows[0].name as string}" kullanıcısı "\${projectRows[0].name as string}" projesine eklendi.\`,
      'project',
    ]);`,
    replace: `await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Projeye Yeni Üye Eklendi',
      \`"\${userRows[0].name as string}" kullanıcısı "\${projectRows[0].name as string}" projesine eklendi.\`,
      'project',
      'project',
      projectId
    ]);`
  },
  {
    find: `await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Yeni Görev Oluşturuldu',
      \`"\${payload.title}" görevi planlandı ve ekibe atandı.\`,
      'task',
    ]);`,
    replace: `await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Yeni Görev Oluşturuldu',
      \`"\${payload.title}" görevi planlandı ve ekibe atandı.\`,
      'task',
      'task',
      id
    ]);`
  },
  {
    find: `await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Görev Güncellendi',
      \`"\${payload.title}" görevi güncellendi.\`,
      'task',
    ]);`,
    replace: `await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Görev Güncellendi',
      \`"\${payload.title}" görevi güncellendi.\`,
      'task',
      'task',
      taskId
    ]);`
  },
  {
    find: `await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Görev Silindi',
      childCount > 0
        ? \`"\${taskTitle}" gorevi silindi ve \${childCount} alt gorev kok seviyeye tasindi.\`
        : \`"\${taskTitle}" gorevi silindi.\`,
      'task',
    ]);`,
    replace: `await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Görev Silindi',
      childCount > 0
        ? \`"\${taskTitle}" gorevi silindi ve \${childCount} alt gorev kok seviyeye tasindi.\`
        : \`"\${taskTitle}" gorevi silindi.\`,
      'task',
      'none',
      null
    ]);`
  },
  {
    find: `await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Yeni Görev Yorumu',
      \`"\${userRows[0].name as string}" kullanıcısı "\${taskRows[0].title as string}" görevine yorum ekledi.\`,
      'mention',
    ]);`,
    replace: `await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Yeni Görev Yorumu',
      \`"\${userRows[0].name as string}" kullanıcısı "\${taskRows[0].title as string}" görevine yorum ekledi.\`,
      'mention',
      'task',
      taskId
    ]);`
  },
  {
    find: `await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Göreve Üye Eklendi',
      \`"\${userRows[0].name as string}" kullanıcısı "\${taskRows[0].title as string}" görevine atandı.\`,
      'task',
    ]);`,
    replace: `await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Göreve Üye Eklendi',
      \`"\${userRows[0].name as string}" kullanıcısı "\${taskRows[0].title as string}" görevine atandı.\`,
      'task',
      'task',
      taskId
    ]);`
  },
  {
    find: `await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Göreve Ek Yüklendi',
      \`"\${payload.name}" eki "\${taskRows[0].title as string}" görevine eklendi.\`,
      'task',
    ]);`,
    replace: `await connection.query('INSERT INTO notifications (id, title, description, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Göreve Ek Yüklendi',
      \`"\${payload.name}" eki "\${taskRows[0].title as string}" görevine eklendi.\`,
      'task',
      'task',
      taskId
    ]);`
  }
];

let replaced = 0;
for (const r of replacements) {
    if (content.includes(r.find)) {
        content = content.replace(r.find, r.replace);
        replaced++;
    } else {
        console.warn('Could not find:', r.find.substring(0, 150));
    }
}
fs.writeFileSync('server/services/dashboardService.ts', content);
console.log('Replaced ' + replaced + ' blocks.');
