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

  const projectIds = projectsData.map(p => p.id);
  
  // Detaylı planlama bilgilerini çek
  const [planningRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM project_planning_details WHERE project_id IN (?)`,
    [projectIds]
  );
  const planningMap = new Map(planningRows.map(r => [r.project_id, r]));

  // Gereksinimleri çek
  const [requirementRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM project_requirements WHERE project_id IN (?) ORDER BY FIELD(priority, 'Must', 'Should', 'Could', 'Won\\'t')`,
    [projectIds]
  );
  const requirementsMap = new Map<string, any[]>();
  requirementRows.forEach(r => {
    if (!requirementsMap.has(r.project_id)) requirementsMap.set(r.project_id, []);
    requirementsMap.get(r.project_id)!.push(r);
  });

  // Riskleri çek
  const [riskRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM project_risks WHERE project_id IN (?) ORDER BY score DESC`,
    [projectIds]
  );
  const risksMap = new Map<string, any[]>();
  riskRows.forEach(r => {
    if (!risksMap.has(r.project_id)) risksMap.set(r.project_id, []);
    risksMap.get(r.project_id)!.push(r);
  });

  // Paydaşları çek
  const [stakeholderRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM project_stakeholders WHERE project_id IN (?)`,
    [projectIds]
  );
  const stakeholdersMap = new Map<string, any[]>();
  stakeholderRows.forEach(s => {
    if (!stakeholdersMap.has(s.project_id)) stakeholdersMap.set(s.project_id, []);
    stakeholdersMap.get(s.project_id)!.push(s);
  });

  // Bütçeyi çek
  const [budgetRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM project_cost_items WHERE project_id IN (?)`,
    [projectIds]
  );
  const budgetMap = new Map<string, any[]>();
  budgetRows.forEach(b => {
    if (!budgetMap.has(b.project_id)) budgetMap.set(b.project_id, []);
    budgetMap.get(b.project_id)!.push(b);
  });

  // İletişim planını çek
  const [commRows] = await pool.query<RowDataPacket[]>(
    `SELECT cp.*, u.name as responsible_name 
     FROM project_communication_plans cp
     LEFT JOIN users u ON cp.responsible_user_id = u.id
     WHERE cp.project_id IN (?)`,
    [projectIds]
  );
  const commMap = new Map<string, any[]>();
  commRows.forEach(c => {
    if (!commMap.has(c.project_id)) commMap.set(c.project_id, []);
    commMap.get(c.project_id)!.push(c);
  });
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

    const planning = planningMap.get(p.id);
    const reqs = requirementsMap.get(p.id) || [];
    const risks = risksMap.get(p.id) || [];
    const stakeholders = stakeholdersMap.get(p.id) || [];
    const budget = budgetMap.get(p.id) || [];
    const comms = commMap.get(p.id) || [];

    const totalEstimated = budget.reduce((sum, b) => sum + Number(b.estimated_cost), 0);
    const totalActual = budget.reduce((sum, b) => sum + Number(b.actual_cost), 0);

    return `## PROJE: ${p.name}
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

${planning ? `### STRATEJİK PLANLAMA:
- Problem Tanımı: ${planning.problem_statement || '-'}
- Kapsam İçi: ${planning.in_scope || '-'}
- Kapsam Dışı: ${planning.out_of_scope || '-'}
- Fizibilite Skoru: ${planning.feasibility_score}/100` : ''}

### GEREKSİNİMLER (MoSCoW):
${reqs.length > 0 ? reqs.map(r => `  - [${r.priority}] ${r.title}: ${r.status}`).join('\n') : '  (Henüz gereksinim girilmemiş)'}

### RİSK KAYDI:
${risks.length > 0 ? risks.map(r => `  - ${r.title} (Skor: ${r.score}, Olasılık: ${r.probability}, Etki: ${r.impact}) - Önem: ${r.priority}`).join('\n') : '  (Henüz risk tanımlanmamış)'}

### PAYDAŞ ANALİZİ:
${stakeholders.length > 0 ? stakeholders.map(s => `  - ${s.name} (${s.role}) - Güç: ${s.power}, İlgi: ${s.interest}`).join('\n') : '  (Henüz paydaş girilmemiş)'}

### BÜTÇE VE MALİYET:
- Toplam Tahmini: ${totalEstimated.toLocaleString('tr-TR')} TRY
- Toplam Harcanan: ${totalActual.toLocaleString('tr-TR')} TRY
- Bütçe Sapması: %${totalEstimated > 0 ? (((totalActual - totalEstimated) / totalEstimated) * 100).toFixed(1) : 0}

### İLETİŞİM PLANI:
${comms.length > 0 ? comms.map(c => `  - ${c.meeting_type} (${c.frequency}, ${c.channel}) - Sorumlu: ${c.responsible_name || 'Atanmamış'}`).join('\n') : '  (Henüz iletişim planı yok)'}

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
- 📊 İlerleme ve Bütçe Durumu (ilerleme yüzdesi analizi, bütçe sapması ve kalan süre)
- 📝 Kapsam ve Strateji (planlama detaylarının özeti)
- ✅ Görev ve Gereksinim Analizi (MoSCoW önceliklerine göre ilerleme)
- ⚠️ Risk ve Paydaş Değerlendirmesi (en kritik riskler ve paydaşların beklentileri)
- 💬 İletişim ve Koordinasyon (iletişim planının etkinliği)
- 💡 Öneriler (somut, uygulanabilir adımlar)` : `ÇOKLU PROJE RAPORU FORMATI:
- 📋 Genel Durum Özeti (kaç proje aktif, ortalama ilerleme, toplam bütçe kullanımı)
- 📊 Proje Bazlı Kısa Değerlendirme (her proje için 2-3 cümlelik kapsamlı özet)
- ⚠️ Kritik Noktalar (geciken projeler, yüksek bütçe sapmaları, kritik riskler)
- 💡 Genel Stratejik Öneriler`}`;

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

export const generateProjectPlanning = async (prompt: string, context?: any) => {
  if (!env.openrouterApiKey) {
    throw new Error('OpenRouter API anahtarı yapılandırılmamış.');
  }

  const systemPrompt = `Sen uzman bir proje yöneticisi ve iş analistisin. Kullanıcının verdiği fikri analiz edip PROFESYONEL ve DETAYLI bir proje planı çıkaracaksın.

PROJE BAĞLAMI (Lütfen çıktılarını bu bağlama uygun, mantıklı ve gerçekçi verilerle doldur):
- Proje Yöneticisi: ${context?.managerName || 'Bilinmiyor'} (${context?.managerRole || ''})
- Mevcut Tarih (Proje Başlangıcı İçin): ${context?.currentDate || new Date().toISOString().split('T')[0]}

DİKKAT - KESİN KURALLAR:
1. ASLA markdown formatında cevap verme ( \`\`\`json veya \`\`\` kullanma).
2. Doğrudan ve SADECE saf JSON objesi döndür.
3. Çıktın fazladan bir sarmalayıcı (wrapper) objeye sahip OLMASIN. Doğrudan aşağıdaki özellikleri içeren tek bir obje olmalı.

JSON FORMATI:
{
  "name": "Proje Adı (Örn: E-Ticaret Ödeme Otomasyonu)",
  "description": "Projenin kapsamlı ve profesyonel amacı, iş değeri.",
  "category": "Kategori",
  "themeColor": "#4f46e5",
  "startDate": "YYYY-MM-DD (Mevcut Tarihe Göre Gerçekçi Bir Başlangıç)",
  "endDate": "YYYY-MM-DD (Gerçekçi Bitiş)",
  "problemStatement": "Çözülmek istenen sorun nedir?",
  "targetUsers": "Hedef kitle kimler?",
  "directValue": "Operasyonel veya finansal getiri",
  "strategicAlignment": "Şirket hedefleriyle uyumu",
  "feasibilityScore": 85,
  "notDoingImpact": "Yapılmazsa kaybedilecek fırsat veya doğacak risk",
  "inScope": "Proje kapsamında neler yapılacak?",
  "outOfScope": "Neler KESİNLİKLE yapılmayacak?",
  "assumptions": "Dış kaynak, bütçe vb. varsayımlar",
  "constraints": "Zaman, teknoloji veya regülasyon kısıtları",
  "acceptanceCriteria": "Başarı şartları",
  "selectedWbsTemplate": "software | marketing | infrastructure | empty (Proje türüne en uygun olanı seç)",
  "stakeholders": [
    { "name": "Örn: Finans Ekibi", "role": "Rol", "interest": "Yüksek", "power": "Yüksek" }
  ],
  "communicationPlans": [
    { "meetingType": "Haftalık Durum Toplantısı", "frequency": "Haftalık", "channel": "Teams", "participants": "Proje Ekibi" }
  ],
  "requirements": [
    { "title": "Gereksinim", "description": "Detay", "priority": "Must/Should/Could", "type": "Functional/Technical" }
  ],
  "risks": [
    { "title": "Risk", "category": "Kategori", "probability": 3, "impact": 4, "mitigation": "Önlem" }
  ],
  "costItems": [
    { "title": "CRM Lisansı", "category": "Yazılım Lisansı", "estimatedCost": 5000, "currency": "USD" }
  ]
}`;

  const models = [
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'google/gemini-2.0-flash-lite-preview-02-05:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'poolside/laguna-m.1:free',
    'minimax/minimax-m2.5:free',
    'tencent/hy3-preview:free'
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    console.log(`OpenRouter Requesting Planning with model: ${model} for:`, prompt);
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Proje Yönetimi App',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Şu proje fikri için detaylı bir plan oluştur: ${prompt}` }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`OpenRouter Planning Error with ${model}:`, errorData);
        lastError = new Error(`Model ${model} failed`);
        continue; // Try next model
      }

      const data = await response.json();
      let content = data.choices[0]?.message?.content || '';
      
      try {
        // Olası markdown formatlarını (```json ... ```) temizle ve sadece JSON kısmını al
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        let parsedJson;
        if (jsonMatch) {
          parsedJson = JSON.parse(jsonMatch[0]);
        } else {
          parsedJson = JSON.parse(content);
        }

        // Eğer AI çıktıyı gereksiz bir kök obje içine sardıysa (Örn: {"Project": {...}}) onu ayıkla
        if (parsedJson && typeof parsedJson === 'object' && !Array.isArray(parsedJson)) {
          const keys = Object.keys(parsedJson);
          if (keys.length === 1 && typeof parsedJson[keys[0]] === 'object' && !Array.isArray(parsedJson[keys[0]])) {
             parsedJson = parsedJson[keys[0]];
          }
        }

        // Doğrulama: Eğer JSON çok boşsa veya temel alanlar yoksa modeli başarısız say ve diğerine geç
        const keyCount = Object.keys(parsedJson).length;
        if (keyCount < 5 || (!parsedJson.description && !parsedJson.problemStatement)) {
          console.warn(`Model ${model} returned incomplete JSON:`, parsedJson);
          throw new Error('Üretilen JSON yetersiz veya boş.');
        }
        
        console.log(`Successfully generated planning with ${model}:`, JSON.stringify(parsedJson, null, 2));
        return parsedJson;
      } catch (e) {
        console.error(`Invalid or incomplete AI Output from ${model}. Moving to next...`);
        lastError = new Error('AI yetersiz bir yanıt döndürdü.');
        continue; // Try next model if it returned invalid/incomplete JSON
      }
    } catch (e: any) {
      console.error(`Fetch error with model ${model}:`, e);
      lastError = e;
    }
  }

  throw new Error('Tüm AI modelleri denendi ancak yanıt alınamadı. (Sistem aşırı yoğun)');
};
