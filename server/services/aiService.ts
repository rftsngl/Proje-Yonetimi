import { getPool } from '../db/pool.js';
import { env } from '../config/env.js';
import { RowDataPacket } from 'mysql2';

interface ProjectReportParams {
  projectId?: string;
  workspaceId: string;
}

const formatDate = (d: any): string => {
  if (!d) return 'Belirlenmedi';
  const date = new Date(d);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const calcDaysLeft = (endDate: any): string => {
  if (!endDate) return 'Bitiş tarihi yok';
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)} gün gecikmiş`;
  if (diff === 0) return 'Bugün bitiyor';
  return `${diff} gün kaldı`;
};

export const generateProjectReport = async ({ projectId, workspaceId }: ProjectReportParams) => {
  if (!env.openrouterApiKey) {
    throw new Error('OpenRouter API anahtarı yapılandırılmamış.');
  }

  const pool = getPool();
  let projectsData: any[] = [];

  const projectQuery = `
    SELECT p.id, p.name, p.status, p.category, p.progress, p.start_date, p.end_date, p.description,
           u.name as manager_name,
           (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'Tamamlandı') as completed_tasks,
           (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'Devam Ediyor') as in_progress_tasks,
           (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'Yapılacak') as todo_tasks,
           (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'Gecikti') as overdue_tasks,
           (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
           (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as team_size
    FROM projects p
    LEFT JOIN users u ON p.manager_id = u.id`;

  if (projectId) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `${projectQuery} WHERE p.id = ? AND p.workspace_id = ?`,
      [projectId, workspaceId]
    );
    if (!rows.length) throw new Error('Proje bulunamadı.');
    projectsData = rows;
  } else {
    const [rows] = await pool.query<RowDataPacket[]>(
      `${projectQuery} WHERE p.workspace_id = ? AND p.status != 'Tamamlandı'`,
      [workspaceId]
    );
    projectsData = rows;
  }

  if (!projectsData.length) {
    throw new Error('Raporlanacak aktif proje bulunamadı.');
  }

  // Görev detaylarını çek (her proje için)
  const projectIds = projectsData.map(p => p.id);
  const [taskRows] = await pool.query<RowDataPacket[]>(
    `SELECT t.title, t.status, t.priority, t.due_date, t.project_id,
            GROUP_CONCAT(u.name SEPARATOR ', ') as assignees
     FROM tasks t
     LEFT JOIN task_assignees ta ON t.id = ta.task_id
     LEFT JOIN users u ON ta.user_id = u.id
     WHERE t.project_id IN (?)
     GROUP BY t.id
     ORDER BY FIELD(t.priority, 'Yüksek', 'Orta', 'Düşük'), t.due_date ASC`,
    [projectIds]
  );

  // Görevleri proje bazında grupla
  const tasksByProject: Record<string, any[]> = {};
  for (const task of taskRows) {
    if (!tasksByProject[task.project_id]) tasksByProject[task.project_id] = [];
    tasksByProject[task.project_id].push(task);
  }

  // Bugünün tarihini al
  const today = formatDate(new Date());

  const promptContext = projectsData.map(p => {
    const tasks = tasksByProject[p.id] || [];
    const taskList = tasks.length > 0
      ? tasks.map(t =>
        `  - "${t.title}" | Durum: ${t.status} | Öncelik: ${t.priority} | Son Tarih: ${formatDate(t.due_date)} | Atanan: ${t.assignees || 'Atanmamış'}`
      ).join('\n')
      : '  (Henüz görev tanımlanmamış)';

    return `## ${p.name}
- Proje ID: ${p.id}
- Durum: ${p.status}
- Kategori: ${p.category}
- Yönetici: ${p.manager_name || 'Belirlenmedi'}
- Ekip Büyüklüğü: ${p.team_size} kişi
- İlerleme: %${p.progress}
- Başlangıç Tarihi: ${formatDate(p.start_date)}
- Bitiş Tarihi: ${formatDate(p.end_date)} (${calcDaysLeft(p.end_date)})
- Toplam Görev: ${p.total_tasks} (Tamamlanan: ${p.completed_tasks}, Devam Eden: ${p.in_progress_tasks}, Yapılacak: ${p.todo_tasks}, Geciken: ${p.overdue_tasks})
- Açıklama: ${p.description || 'Açıklama girilmemiş'}

Görev Listesi:
${taskList}`;
  }).join('\n\n---\n\n');

  const isSingleProject = projectsData.length === 1;

  const systemPrompt = `Sen profesyonel bir proje yönetimi asistanısın. Verilen proje verilerini analiz edip profesyonel bir durum raporu oluşturacaksın.

RAPORLAMA KURALLARI:
1. Raporu Türkçe yaz.
2. SADECE sana verilen verilere dayalı yorumlar yap, veri dışında bilgi uydurma.
3. Bugünün tarihi: ${today}. Tarihleri bu referansa göre değerlendir.
4. Markdown formatını kullan: başlıklar (##, ###), kalın yazı, maddeli listeler ve emoji kullan.
5. Tablo yerine maddeli liste kullan — tablolar render sorununa yol açabiliyor.

${isSingleProject ? `TEK PROJE RAPORU FORMATI:
- 📋 Proje Özeti (ad, kategori, yönetici, ekip büyüklüğü)
- 📊 İlerleme Durumu (ilerleme yüzdesi analizi ve kalan süre)
- ✅ Görev Analizi (tamamlanan, devam eden, geciken görevleri listele)
- ⚠️ Risk ve Dikkat Edilecek Noktalar (geciken görevler, düşük ilerleme vb.)
- 💡 Öneriler (somut, uygulanabilir adımlar)` : `ÇOKLU PROJE RAPORU FORMATI:
- 📋 Genel Durum Özeti (kaç proje aktif, ortalama ilerleme)
- 📊 Proje Bazlı Kısa Değerlendirme (her proje için 2-3 cümle)
- ⚠️ Kritik Noktalar (geciken projeler, risk taşıyan projeler)
- 💡 Genel Öneriler`}`;

  const userPrompt = `Aşağıdaki proje verilerini analiz ederek bir durum raporu oluştur:\n\n${promptContext}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Proje Yönetimi App',
    },
    body: JSON.stringify({
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 2048,
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenRouter Error:', errorData);
    throw new Error('Yapay zeka servisiyle iletişim kurulamadı.');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
