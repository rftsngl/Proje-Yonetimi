import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../db/pool.js';
import { calculateDaysLeft, createEntityId, formatDisplayDate, formatRelativeTime } from '../utils/formatters.js';
import { canViewAllData, getPermissionsForRole } from '../utils/permissions.js';

type StatRow = RowDataPacket & {
  totalProjects: number;
  activeTasks: number;
  delayedTasks: number;
  completedTasks: number;
};

type TaskRow = RowDataPacket & {
  id: string;
  title: string;
  description: string;
  parentTaskId: string | null;
  priority: 'Yüksek' | 'Orta' | 'Düşük';
  status: 'Yapılacak' | 'Devam Ediyor' | 'Tamamlandı' | 'Gecikti';
  startDate: string | null;
  dueDate: string | null;
  projectId: string;
  projectName: string;
  assigneeIds: string | null;
  assigneeNames: string | null;
};

type TaskCommentRow = RowDataPacket & {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  authorId: string;
  authorName: string;
  authorAvatar: string;
};

type TaskAttachmentRow = RowDataPacket & {
  id: string;
  taskId: string;
  name: string;
  fileType: string;
  fileSizeLabel: string;
  mimeType: string | null;
  filePath: string | null;
};

type ProjectRow = RowDataPacket & {
  id: string;
  name: string;
  description: string;
  managerName: string;
  managerAvatar: string;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  memberIds: string | null;
  status: 'Aktif' | 'Tamamlandı';
  category: string;
  themeColor: string;
};

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
  status: 'Online' | 'Offline' | 'Busy';
  lastActive: string | null;
  department: string | null;
  projectsCount?: number;
  tasksCount?: number;
};

type NotificationRow = RowDataPacket & {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'project' | 'mention' | 'system';
  isRead: number;
  createdAt: string;
};

type CalendarRow = RowDataPacket & {
  id: string;
  title: string;
  date: string;
  color: string;
  eventType: string;
};

type UserAuditLogRow = RowDataPacket & {
  id: string;
  actorUserId: string;
  actorName: string;
  targetUserId: string;
  targetName: string;
  action: 'role_update' | 'department_update';
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
};

const VALID_APP_ROLES = [
  'Admin',
  'Product Manager',
  'Senior Developer',
  'Frontend Developer',
  'UI/UX Designer',
  'QA Engineer',
] as const;

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
] as const;

const pool = getPool();

const splitGrouped = (value: string | null, separator = ',') => (value ? value.split(separator).filter(Boolean) : []);

const deriveParentStatus = (statuses: Array<'Yapılacak' | 'Devam Ediyor' | 'Tamamlandı' | 'Gecikti'>) => {
  if (!statuses.length) {
    return 'Yapılacak' as const;
  }

  if (statuses.every((status) => status === 'Tamamlandı')) {
    return 'Tamamlandı' as const;
  }

  if (statuses.some((status) => status === 'Gecikti')) {
    return 'Gecikti' as const;
  }

  if (statuses.some((status) => status === 'Devam Ediyor' || status === 'Tamamlandı')) {
    return 'Devam Ediyor' as const;
  }

  return 'Yapılacak' as const;
};

const buildWbsCodeMap = (tasks: Array<{ id: string; projectId: string; parentTaskId?: string | null; dueDate?: string | null }>) => {
  const codeMap = new Map<string, string>();

  const toDateSortKey = (value?: string | Date | null) => {
    if (!value) {
      return '9999-12-31';
    }

    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    return '9999-12-31';
  };

  const byProject = tasks.reduce<Record<string, typeof tasks>>((accumulator, task) => {
    accumulator[task.projectId] = [...(accumulator[task.projectId] || []), task];
    return accumulator;
  }, {});

  for (const projectTasks of Object.values(byProject)) {
    const taskIds = new Set(projectTasks.map((task) => task.id));
    const childrenByParent = new Map<string, typeof projectTasks>();

    for (const task of projectTasks) {
      const key = task.parentTaskId && taskIds.has(task.parentTaskId) ? task.parentTaskId : 'ROOT';
      childrenByParent.set(key, [...(childrenByParent.get(key) || []), task]);
    }

    const sortTasks = (items: typeof projectTasks) =>
      [...items].sort((left, right) => {
        const leftDate = toDateSortKey(left.dueDate as string | Date | null | undefined);
        const rightDate = toDateSortKey(right.dueDate as string | Date | null | undefined);
        if (leftDate === rightDate) {
          return left.id.localeCompare(right.id);
        }
        return leftDate.localeCompare(rightDate);
      });

    const walk = (parentId: string, prefix = '') => {
      const siblings = sortTasks(childrenByParent.get(parentId) || []);
      siblings.forEach((task, index) => {
        const code = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        codeMap.set(task.id, code);
        walk(task.id, code);
      });
    };

    walk('ROOT');
  }

  return codeMap;
};

const validateTaskParentLink = async (payload: { taskId?: string; projectId: string; parentTaskId?: string | null }) => {
  const { taskId, projectId, parentTaskId } = payload;

  if (!parentTaskId) {
    return;
  }

  if (taskId && taskId === parentTaskId) {
    throw new Error('Bir gorev kendisini ust gorev olarak secemez.');
  }

  const [parentRows] = await pool.query<RowDataPacket[]>(
    'SELECT id, project_id AS projectId, parent_task_id AS parentTaskId FROM tasks WHERE id = ? LIMIT 1',
    [parentTaskId],
  );

  if (!parentRows.length) {
    throw new Error('Secilen ust gorev bulunamadi.');
  }

  if (parentRows[0].projectId !== projectId) {
    throw new Error('Ust gorev ayni proje icinde olmalidir.');
  }

  if (!taskId) {
    return;
  }

  let cursor: string | null = parentTaskId;
  while (cursor) {
    if (cursor === taskId) {
      throw new Error('Bu secim gorev hiyerarsisinde dongu olusturuyor.');
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT parent_task_id AS parentTaskId FROM tasks WHERE id = ? LIMIT 1',
      [cursor],
    );

    if (!rows.length) {
      break;
    }

    cursor = (rows[0].parentTaskId as string | null) || null;
  }
};

const syncAncestorStatuses = async (taskId: string) => {
  let [currentRows] = await pool.query<RowDataPacket[]>(
    'SELECT parent_task_id AS parentTaskId FROM tasks WHERE id = ? LIMIT 1',
    [taskId],
  );

  let ancestorId = currentRows[0]?.parentTaskId as string | null;

  while (ancestorId) {
    const [childRows] = await pool.query<RowDataPacket[]>(
      'SELECT status FROM tasks WHERE parent_task_id = ?',
      [ancestorId],
    );

    const nextStatus = deriveParentStatus(
      childRows.map((row) => row.status as 'Yapılacak' | 'Devam Ediyor' | 'Tamamlandı' | 'Gecikti'),
    );

    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [nextStatus, ancestorId]);

    [currentRows] = await pool.query<RowDataPacket[]>(
      'SELECT parent_task_id AS parentTaskId FROM tasks WHERE id = ? LIMIT 1',
      [ancestorId],
    );

    ancestorId = currentRows[0]?.parentTaskId as string | null;
  }
};

const formatCalendarDate = (value: string | Date) => {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return String(value).slice(0, 10);
};

const getStats = async () => {
  const [rows] = await pool.query<StatRow[]>(`
    SELECT
      (SELECT COUNT(*) FROM projects) AS totalProjects,
      (SELECT COUNT(*) FROM tasks WHERE status IN ('Yapılacak', 'Devam Ediyor', 'Gecikti')) AS activeTasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'Gecikti') AS delayedTasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'Tamamlandı') AS completedTasks
  `);

  const row = rows[0];
  return [
    { label: 'Toplam Proje', value: String(row.totalProjects), trend: '+8%', trendUp: true, color: 'text-indigo-600', bg: 'bg-indigo-50', iconName: 'Briefcase' },
    { label: 'Aktif Görevler', value: String(row.activeTasks), trend: '+12%', trendUp: true, color: 'text-blue-600', bg: 'bg-blue-50', iconName: 'Clock' },
    { label: 'Geciken Görevler', value: String(row.delayedTasks), trend: '-2%', trendUp: false, color: 'text-rose-600', bg: 'bg-rose-50', iconName: 'AlertCircle' },
    { label: 'Tamamlananlar', value: String(row.completedTasks), trend: '+24%', trendUp: true, color: 'text-emerald-600', bg: 'bg-emerald-50', iconName: 'CheckCircle2' },
  ];
};

const getTaskComments = async () => {
  const [rows] = await pool.query<TaskCommentRow[]>(`
    SELECT
      tc.id,
      tc.task_id AS taskId,
      tc.content,
      tc.created_at AS createdAt,
      tc.updated_at AS updatedAt,
      u.id AS authorId,
      u.name AS authorName,
      u.avatar AS authorAvatar
    FROM task_comments tc
    INNER JOIN users u ON u.id = tc.user_id
    ORDER BY tc.created_at ASC
  `);

  return rows.reduce<Record<string, any[]>>((accumulator, row) => {
    const item = {
      id: row.id,
      authorId: row.authorId,
      authorName: row.authorName,
      authorAvatar: row.authorAvatar,
      content: row.content,
      time: formatRelativeTime(row.createdAt),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    accumulator[row.taskId] = [...(accumulator[row.taskId] || []), item];
    return accumulator;
  }, {});
};

const getTaskAttachments = async () => {
  const [rows] = await pool.query<TaskAttachmentRow[]>(
    `SELECT
      id,
      task_id AS taskId,
      name,
      file_type AS fileType,
      file_size_label AS fileSizeLabel,
      mime_type AS mimeType,
      file_path AS filePath
     FROM task_attachments
     ORDER BY created_at ASC`,
  );

  return rows.reduce<Record<string, any[]>>((accumulator, row) => {
    const item = {
      id: row.id,
      name: row.name,
      fileType: row.fileType,
      fileSizeLabel: row.fileSizeLabel,
      mimeType: row.mimeType,
      url: row.filePath,
    };

    accumulator[row.taskId] = [...(accumulator[row.taskId] || []), item];
    return accumulator;
  }, {});
};

const getTasks = async () => {
  const [rows, commentsMap, attachmentsMap] = await Promise.all([
    pool.query<TaskRow[]>(`
      SELECT
        t.id,
        t.title,
        t.description,
        t.parent_task_id AS parentTaskId,
        t.priority,
        t.status,
        t.start_date AS startDate,
        t.due_date AS dueDate,
        p.id AS projectId,
        p.name AS projectName,
        GROUP_CONCAT(DISTINCT ta.user_id ORDER BY ta.user_id) AS assigneeIds,
        GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR '||') AS assigneeNames
      FROM tasks t
      INNER JOIN projects p ON p.id = t.project_id
      LEFT JOIN task_assignees ta ON ta.task_id = t.id
      LEFT JOIN users u ON u.id = ta.user_id
      GROUP BY t.id
      ORDER BY COALESCE(t.due_date, DATE_ADD(CURDATE(), INTERVAL 365 DAY)), t.created_at DESC
    `),
    getTaskComments(),
    getTaskAttachments(),
  ]);

  const mappedTasks = rows[0].map((row) => {
    const commentsList = commentsMap[row.id] || [];
    const attachmentsList = attachmentsMap[row.id] || [];

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      parentTaskId: row.parentTaskId,
      priority: row.priority,
      status: row.status,
      date: formatDisplayDate(row.dueDate || row.startDate),
      startDate: row.startDate,
      dueDate: row.dueDate,
      assignees: splitGrouped(row.assigneeIds),
      assigneeNames: splitGrouped(row.assigneeNames, '||'),
      comments: commentsList.length,
      commentsList,
      attachments: attachmentsList.length,
      attachmentsList,
      project: row.projectName,
      projectId: row.projectId,
    };
  });

  const wbsCodeMap = buildWbsCodeMap(mappedTasks);
  return mappedTasks.map((task) => ({
    ...task,
    wbsCode: wbsCodeMap.get(task.id) || '',
  }));
};

const getProjects = async () => {
  const [rows] = await pool.query<ProjectRow[]>(`
    SELECT
      p.id,
      p.name,
      p.description,
      CASE
        WHEN COALESCE(taskStats.totalTasks, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(taskStats.completedTasks, 0) / taskStats.totalTasks) * 100)
      END AS progress,
      p.start_date AS startDate,
      p.end_date AS endDate,
      p.status,
      p.category,
      p.theme_color AS themeColor,
      u.name AS managerName,
      u.avatar AS managerAvatar,
      GROUP_CONCAT(DISTINCT pm.user_id ORDER BY pm.user_id) AS memberIds
    FROM projects p
    INNER JOIN users u ON u.id = p.manager_id
    LEFT JOIN project_members pm ON pm.project_id = p.id
    LEFT JOIN (
      SELECT
        project_id,
        COUNT(*) AS totalTasks,
        SUM(CASE WHEN status = 'Tamamlandı' THEN 1 ELSE 0 END) AS completedTasks
      FROM tasks
      GROUP BY project_id
    ) taskStats ON taskStats.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    manager: row.managerName,
    managerAvatar: row.managerAvatar,
    progress: row.progress,
    daysLeft: calculateDaysLeft(row.endDate),
    team: splitGrouped(row.memberIds),
    status: row.status,
    category: row.category,
    themeColor: row.themeColor,
    startDate: row.startDate,
    endDate: row.endDate,
  }));
};

const getCalendarEvents = async () => {
  const [rows] = await pool.query<CalendarRow[]>(
    'SELECT id, title, date, color, event_type AS eventType FROM calendar_events ORDER BY date ASC, created_at ASC',
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    date: formatCalendarDate(row.date),
    color: row.color,
    eventType: row.eventType,
  }));
};

const getUsers = async () => {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, name, avatar, role, email, status, last_active AS lastActive, department FROM users ORDER BY created_at ASC',
  );
  return rows;
};

const getTeamMembers = async () => {
  const [rows] = await pool.query<UserRow[]>(`
    SELECT
      u.id,
      u.name,
      u.avatar,
      u.role,
      u.email,
      u.status,
      u.last_active AS lastActive,
      u.department,
      COUNT(DISTINCT pm.project_id) AS projectsCount,
      COUNT(DISTINCT ta.task_id) AS tasksCount
    FROM users u
    LEFT JOIN project_members pm ON pm.user_id = u.id
    LEFT JOIN task_assignees ta ON ta.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    role: row.role,
    email: row.email,
    status: row.status,
    lastActive: row.lastActive || '',
    department: row.department || 'Genel',
    projectsCount: row.projectsCount || 0,
    tasksCount: row.tasksCount || 0,
  }));
};

const getNotifications = async () => {
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
};

const getProjectProgress = async () => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, progress, theme_color AS color FROM projects WHERE status = 'Aktif' ORDER BY progress DESC LIMIT 4`,
  );

  return rows.map((row, index) => ({
    id: index + 1,
    name: row.name as string,
    progress: row.progress as number,
    color: (row.color as string) || 'bg-indigo-600',
  }));
};

const buildStats = (projects: Awaited<ReturnType<typeof getProjects>>, tasks: Awaited<ReturnType<typeof getTasks>>) => [
  { label: 'Toplam Proje', value: String(projects.length), trend: '+8%', trendUp: true, color: 'text-indigo-600', bg: 'bg-indigo-50', iconName: 'Briefcase' },
  {
    label: 'Aktif Görevler',
    value: String(tasks.filter((task) => task.status !== 'Tamamlandı').length),
    trend: '+12%',
    trendUp: true,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    iconName: 'Clock',
  },
  {
    label: 'Geciken Görevler',
    value: String(tasks.filter((task) => task.status === 'Gecikti').length),
    trend: '-2%',
    trendUp: false,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    iconName: 'AlertCircle',
  },
  {
    label: 'Tamamlananlar',
    value: String(tasks.filter((task) => task.status === 'Tamamlandı').length),
    trend: '+24%',
    trendUp: true,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    iconName: 'CheckCircle2',
  },
];

const buildProjectProgress = (projects: Awaited<ReturnType<typeof getProjects>>) =>
  projects
    .filter((project) => project.status === 'Aktif')
    .sort((left, right) => right.progress - left.progress)
    .slice(0, 4)
    .map((project, index) => ({
      id: index + 1,
      name: project.name,
      progress: project.progress,
      color: project.themeColor || 'bg-indigo-600',
    }));

export const getBootstrapData = async (currentUser: {
  id: string;
  name: string;
  avatar: string;
  role: 'Admin' | 'Product Manager' | 'Senior Developer' | 'Frontend Developer' | 'UI/UX Designer' | 'QA Engineer';
  email?: string;
  status?: 'Online' | 'Offline' | 'Busy';
  lastActive?: string;
  department?: string;
}) => {
  const [tasks, projects, calendarEvents, teamMembers, notifications, users] = await Promise.all([
    getTasks(),
    getProjects(),
    getCalendarEvents(),
    getTeamMembers(),
    getNotifications(),
    getUsers(),
  ]);

  const isPrivileged = canViewAllData(currentUser.role);
  const visibleProjects = isPrivileged ? projects : projects.filter((project) => project.team.includes(currentUser.id));
  const visibleProjectIds = new Set(visibleProjects.map((project) => project.id));
  const visibleTasks = isPrivileged
    ? tasks
    : tasks.filter((task) => visibleProjectIds.has(task.projectId) || task.assignees.includes(currentUser.id));
  const visibleUsers = isPrivileged
    ? users
    : users.filter((user) => {
        if (user.id === currentUser.id) {
          return true;
        }

        return visibleProjects.some((project) => project.team.includes(user.id));
      });
  const visibleUserIds = new Set(visibleUsers.map((user) => user.id));
  const visibleTeamMembers = teamMembers.filter((member) => visibleUserIds.has(member.id));
  const stats = buildStats(visibleProjects, visibleTasks);
  const projectProgress = buildProjectProgress(visibleProjects);

  return {
    stats,
    tasks: visibleTasks,
    projects: visibleProjects,
    calendarEvents,
    teamMembers: visibleTeamMembers,
    notifications,
    projectProgress,
    users: visibleUsers,
    currentUser,
    permissions: getPermissionsForRole(currentUser.role),
  };
};

export const createProject = async (payload: {
  name: string;
  description: string;
  category: string;
  managerId: string;
  startDate?: string;
  endDate?: string;
  themeColor?: string;
}) => {
  const id = createEntityId('PRJ');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO projects (id, name, description, manager_id, progress, start_date, end_date, status, category, theme_color)
       VALUES (?, ?, ?, ?, 0, ?, ?, 'Aktif', ?, ?)`,
      [id, payload.name, payload.description, payload.managerId, payload.startDate || null, payload.endDate || null, payload.category, payload.themeColor || 'bg-indigo-600'],
    );
    await connection.query('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [id, payload.managerId]);
    await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Yeni Proje Oluşturuldu',
      `"${payload.name}" projesi başarıyla oluşturuldu.`,
      'project',
    ]);
    if (payload.endDate) {
      await connection.query(
        'INSERT INTO calendar_events (id, title, date, color, event_type, project_id) VALUES (?, ?, ?, ?, ?, ?)',
        [createEntityId('EV'), `${payload.name} teslim tarihi`, payload.endDate, 'bg-indigo-100 text-indigo-700 border-indigo-200', 'teslim', id],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const createCalendarEvent = async (payload: {
  title: string;
  date: string;
  color: string;
  eventType: string;
}) => {
  await pool.query(
    'INSERT INTO calendar_events (id, title, date, color, event_type, project_id) VALUES (?, ?, ?, ?, ?, NULL)',
    [createEntityId('EV'), payload.title, payload.date, payload.color, payload.eventType],
  );

  await pool.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
    createEntityId('NTF'),
    'Takvim Etkinligi Eklendi',
    `"${payload.title}" etkinligi ${payload.date} tarihi icin takvime eklendi.`,
    'system',
  ]);
};

export const deleteCalendarEvent = async (eventId: string) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [eventRows] = await connection.query<RowDataPacket[]>(
      'SELECT title, date FROM calendar_events WHERE id = ? LIMIT 1',
      [eventId],
    );

    if (!eventRows.length) {
      await connection.rollback();
      return false;
    }

    const eventTitle = eventRows[0].title as string;
    const eventDate = formatCalendarDate(eventRows[0].date as string | Date);

    await connection.query('DELETE FROM calendar_events WHERE id = ?', [eventId]);
    await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Takvim Etkinligi Silindi',
      `"${eventTitle}" etkinligi ${eventDate} tarihli takvim kayitlarindan kaldirildi.`,
      'system',
    ]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateProject = async (projectId: string, payload: {
  name: string;
  description: string;
  category: string;
  managerId: string;
  startDate?: string;
  endDate?: string;
  themeColor?: string;
  progress?: number;
  status?: 'Aktif' | 'Tamamlandı';
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE projects
       SET name = ?, description = ?, manager_id = ?, category = ?, start_date = ?, end_date = ?, theme_color = ?, progress = ?, status = ?
       WHERE id = ?`,
      [payload.name, payload.description, payload.managerId, payload.category, payload.startDate || null, payload.endDate || null, payload.themeColor || 'bg-indigo-600', Math.max(0, Math.min(100, payload.progress ?? 0)), payload.status || 'Aktif', projectId],
    );
    await connection.query('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [projectId, payload.managerId]);
    await connection.query(
      `UPDATE calendar_events
       SET title = ?, date = ?, color = ?
       WHERE project_id = ? AND event_type = 'teslim'`,
      [`${payload.name} teslim tarihi`, payload.endDate || null, 'bg-indigo-100 text-indigo-700 border-indigo-200', projectId],
    );
    if (payload.endDate) {
      const [calendarRows] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM calendar_events WHERE project_id = ? AND event_type = 'teslim' LIMIT 1`,
        [projectId],
      );
      if (!calendarRows.length) {
        await connection.query(
          'INSERT INTO calendar_events (id, title, date, color, event_type, project_id) VALUES (?, ?, ?, ?, ?, ?)',
          [createEntityId('EV'), `${payload.name} teslim tarihi`, payload.endDate, 'bg-indigo-100 text-indigo-700 border-indigo-200', 'teslim', projectId],
        );
      }
    }
    await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Proje Güncellendi',
      `"${payload.name}" projesi başarıyla güncellendi.`,
      'project',
    ]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteProject = async (projectId: string) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [projectRows] = await connection.query<RowDataPacket[]>('SELECT name FROM projects WHERE id = ? LIMIT 1', [projectId]);
    if (!projectRows.length) {
      await connection.rollback();
      return false;
    }
    const projectName = projectRows[0].name as string;
    await connection.query('DELETE FROM projects WHERE id = ?', [projectId]);
    await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Proje Silindi',
      `"${projectName}" projesi sistemden kaldırıldı.`,
      'project',
    ]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const addProjectMember = async (projectId: string, userId: string) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [projectRows] = await connection.query<RowDataPacket[]>('SELECT name FROM projects WHERE id = ? LIMIT 1', [projectId]);
    const [userRows] = await connection.query<RowDataPacket[]>('SELECT name FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!projectRows.length || !userRows.length) {
      await connection.rollback();
      return false;
    }
    await connection.query('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [projectId, userId]);
    await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Projeye Yeni Üye Eklendi',
      `"${userRows[0].name as string}" kullanıcısı "${projectRows[0].name as string}" projesine eklendi.`,
      'project',
    ]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const createTask = async (payload: {
  title: string;
  description: string;
  projectId: string;
  parentTaskId?: string;
  assigneeIds: string[];
  startDate?: string;
  dueDate?: string;
  priority: 'Yüksek' | 'Orta' | 'Düşük';
}) => {
  const id = createEntityId('TSK');
  const connection = await pool.getConnection();
  try {
    await validateTaskParentLink({ projectId: payload.projectId, parentTaskId: payload.parentTaskId || null });
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO tasks (id, title, description, parent_task_id, priority, status, start_date, due_date, project_id, comments_count, attachments_count)
       VALUES (?, ?, ?, ?, ?, 'Yapılacak', ?, ?, ?, 0, 0)`,
      [
        id,
        payload.title,
        payload.description,
        payload.parentTaskId || null,
        payload.priority,
        payload.startDate || null,
        payload.dueDate || null,
        payload.projectId,
      ],
    );
    for (const assigneeId of payload.assigneeIds) {
      await connection.query('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [id, assigneeId]);
    }
    await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Yeni Görev Oluşturuldu',
      `"${payload.title}" görevi planlandı ve ekibe atandı.`,
      'task',
    ]);
    if (payload.dueDate) {
      await connection.query(
        'INSERT INTO calendar_events (id, title, date, color, event_type, project_id) VALUES (?, ?, ?, ?, ?, ?)',
        [createEntityId('EV'), payload.title, payload.dueDate, 'bg-emerald-100 text-emerald-700 border-emerald-200', 'görev', payload.projectId],
      );
    }
    await connection.commit();
    await syncAncestorStatuses(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateTask = async (taskId: string, payload: {
  title: string;
  description: string;
  projectId: string;
  parentTaskId?: string;
  assigneeIds: string[];
  startDate?: string;
  dueDate?: string;
  priority: 'Yüksek' | 'Orta' | 'Düşük';
  status?: 'Yapılacak' | 'Devam Ediyor' | 'Tamamlandı' | 'Gecikti';
}) => {
  const connection = await pool.getConnection();
  try {
    await validateTaskParentLink({ taskId, projectId: payload.projectId, parentTaskId: payload.parentTaskId || null });
    await connection.beginTransaction();
    await connection.query(
      `UPDATE tasks
       SET title = ?, description = ?, parent_task_id = ?, priority = ?, status = ?, start_date = ?, due_date = ?, project_id = ?
       WHERE id = ?`,
      [
        payload.title,
        payload.description,
        payload.parentTaskId || null,
        payload.priority,
        payload.status || 'Yapılacak',
        payload.startDate || null,
        payload.dueDate || null,
        payload.projectId,
        taskId,
      ],
    );
    await connection.query('DELETE FROM task_assignees WHERE task_id = ?', [taskId]);
    for (const assigneeId of payload.assigneeIds) {
      await connection.query('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [taskId, assigneeId]);
    }
    await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Görev Güncellendi',
      `"${payload.title}" görevi güncellendi.`,
      'task',
    ]);
    await connection.commit();
    await syncAncestorStatuses(taskId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateTaskStatus = async (taskId: string, status: 'Yapılacak' | 'Devam Ediyor' | 'Tamamlandı' | 'Gecikti') => {
  const [result] = await pool.query<ResultSetHeader>('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);
  if (result.affectedRows > 0) {
    await syncAncestorStatuses(taskId);
  }
  return result.affectedRows > 0;
};

export const updateTaskParent = async (taskId: string, projectId: string, parentTaskId?: string | null) => {
  await validateTaskParentLink({ taskId, projectId, parentTaskId });
  const [result] = await pool.query<ResultSetHeader>('UPDATE tasks SET parent_task_id = ? WHERE id = ?', [parentTaskId || null, taskId]);
  if (result.affectedRows > 0) {
    await syncAncestorStatuses(taskId);
  }
  return result.affectedRows > 0;
};

export const canUserUpdateTaskStatus = async (taskId: string, userId: string, role: string) => {
  if (role === 'Admin') {
    return true;
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT 1 FROM task_assignees WHERE task_id = ? AND user_id = ? LIMIT 1',
    [taskId, userId],
  );

  return rows.length > 0;
};

export const updateUserRole = async (userId: string, role: string) => {
  if (!VALID_APP_ROLES.includes(role as (typeof VALID_APP_ROLES)[number])) {
    throw new Error('Gecersiz rol secimi.');
  }

  const [result] = await pool.query<ResultSetHeader>('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  return result.affectedRows > 0;
};

export const getUserRoleAndDepartment = async (userId: string) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT role, department FROM users WHERE id = ? LIMIT 1',
    [userId],
  );

  if (!rows.length) {
    return null;
  }

  return {
    role: rows[0].role as string,
    department: (rows[0].department as string | null) || 'Genel',
  };
};

export const getAdminCount = async () => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM users WHERE role = 'Admin'",
  );

  return Number(rows[0]?.total || 0);
};

export const updateUserDepartment = async (userId: string, department: string) => {
  if (!VALID_DEPARTMENTS.includes(department as (typeof VALID_DEPARTMENTS)[number])) {
    throw new Error('Gecersiz departman secimi.');
  }

  const [result] = await pool.query<ResultSetHeader>('UPDATE users SET department = ? WHERE id = ?', [department, userId]);
  return result.affectedRows > 0;
};

export const createUserAuditLog = async (payload: {
  actorUserId: string;
  targetUserId: string;
  action: 'role_update' | 'department_update';
  oldValue?: string | null;
  newValue?: string | null;
}) => {
  await pool.query(
    `INSERT INTO user_audit_logs (id, actor_user_id, target_user_id, action, old_value, new_value)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      createEntityId('AUD'),
      payload.actorUserId,
      payload.targetUserId,
      payload.action,
      payload.oldValue || null,
      payload.newValue || null,
    ],
  );
};

export const getUserAuditLogs = async (limit = 100) => {
  const safeLimit = Math.max(1, Math.min(limit, 200));

  const [rows] = await pool.query<UserAuditLogRow[]>(
    `SELECT
      l.id,
      l.actor_user_id AS actorUserId,
      actor.name AS actorName,
      l.target_user_id AS targetUserId,
      target.name AS targetName,
      l.action,
      l.old_value AS oldValue,
      l.new_value AS newValue,
      l.created_at AS createdAt
     FROM user_audit_logs l
     INNER JOIN users actor ON actor.id = l.actor_user_id
     INNER JOIN users target ON target.id = l.target_user_id
     ORDER BY l.created_at DESC
     LIMIT ?`,
    [safeLimit],
  );

  return rows.map((row) => ({
    id: row.id,
    actorUserId: row.actorUserId,
    actorName: row.actorName,
    targetUserId: row.targetUserId,
    targetName: row.targetName,
    action: row.action,
    oldValue: row.oldValue,
    newValue: row.newValue,
    createdAt: row.createdAt,
  }));
};

export const deleteTask = async (taskId: string) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [taskRows] = await connection.query<RowDataPacket[]>('SELECT title FROM tasks WHERE id = ? LIMIT 1', [taskId]);
    if (!taskRows.length) {
      await connection.rollback();
      return false;
    }

    const [childRows] = await connection.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM tasks WHERE parent_task_id = ?',
      [taskId],
    );
    const childCount = Number(childRows[0]?.total || 0);

    if (childCount > 0) {
      await connection.query('UPDATE tasks SET parent_task_id = NULL WHERE parent_task_id = ?', [taskId]);
    }

    const taskTitle = taskRows[0].title as string;
    await connection.query('DELETE FROM tasks WHERE id = ?', [taskId]);
    await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Görev Silindi',
      childCount > 0
        ? `"${taskTitle}" gorevi silindi ve ${childCount} alt gorev kok seviyeye tasindi.`
        : `"${taskTitle}" gorevi silindi.`,
      'task',
    ]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const addTaskComment = async (taskId: string, userId: string, content: string) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [taskRows] = await connection.query<RowDataPacket[]>('SELECT title FROM tasks WHERE id = ? LIMIT 1', [taskId]);
    const [userRows] = await connection.query<RowDataPacket[]>('SELECT name FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!taskRows.length || !userRows.length) {
      await connection.rollback();
      return false;
    }
    await connection.query('INSERT INTO task_comments (id, task_id, user_id, content) VALUES (?, ?, ?, ?)', [createEntityId('CMT'), taskId, userId, content]);
    await connection.query('UPDATE tasks SET comments_count = comments_count + 1 WHERE id = ?', [taskId]);
    await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Yeni Görev Yorumu',
      `"${userRows[0].name as string}" kullanıcısı "${taskRows[0].title as string}" görevine yorum ekledi.`,
      'mention',
    ]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateTaskComment = async (taskId: string, commentId: string, content: string) => {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE task_comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND task_id = ?',
    [content, commentId, taskId],
  );

  return result.affectedRows > 0;
};

export const deleteTaskComment = async (taskId: string, commentId: string) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [commentRows] = await connection.query<RowDataPacket[]>(
      'SELECT content FROM task_comments WHERE id = ? AND task_id = ? LIMIT 1',
      [commentId, taskId],
    );

    if (!commentRows.length) {
      await connection.rollback();
      return false;
    }

    await connection.query('DELETE FROM task_comments WHERE id = ? AND task_id = ?', [commentId, taskId]);
    await connection.query(
      'UPDATE tasks SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = ?',
      [taskId],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const addTaskAssignee = async (taskId: string, userId: string) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [taskRows] = await connection.query<RowDataPacket[]>('SELECT title FROM tasks WHERE id = ? LIMIT 1', [taskId]);
    const [userRows] = await connection.query<RowDataPacket[]>('SELECT name FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!taskRows.length || !userRows.length) {
      await connection.rollback();
      return false;
    }
    await connection.query('INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES (?, ?)', [taskId, userId]);
    await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Göreve Üye Eklendi',
      `"${userRows[0].name as string}" kullanıcısı "${taskRows[0].title as string}" görevine atandı.`,
      'task',
    ]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const removeTaskAssignee = async (taskId: string, userId: string) => {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?',
    [taskId, userId],
  );

  return result.affectedRows > 0;
};

export const addTaskAttachment = async (
  taskId: string,
  payload: { name: string; fileType: string; fileSizeLabel: string; mimeType?: string | null; fileSizeBytes?: number | null; filePath?: string | null },
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [taskRows] = await connection.query<RowDataPacket[]>('SELECT title FROM tasks WHERE id = ? LIMIT 1', [taskId]);
    if (!taskRows.length) {
      await connection.rollback();
      return false;
    }
    await connection.query(
      `INSERT INTO task_attachments (id, task_id, name, file_type, file_size_label, mime_type, file_size_bytes, file_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        createEntityId('ATT'),
        taskId,
        payload.name,
        payload.fileType.toUpperCase(),
        payload.fileSizeLabel,
        payload.mimeType || null,
        payload.fileSizeBytes || null,
        payload.filePath || null,
      ],
    );
    await connection.query('UPDATE tasks SET attachments_count = attachments_count + 1 WHERE id = ?', [taskId]);
    await connection.query('INSERT INTO notifications (id, title, description, type) VALUES (?, ?, ?, ?)', [
      createEntityId('NTF'),
      'Göreve Ek Yüklendi',
      `"${payload.name}" eki "${taskRows[0].title as string}" görevine eklendi.`,
      'task',
    ]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const markAllNotificationsAsRead = async () => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
};

export const deleteNotification = async (notificationId: string) => {
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM notifications WHERE id = ?', [notificationId]);
  return result.affectedRows > 0;
};

export const deleteAllNotifications = async () => {
  await pool.query('DELETE FROM notifications');
};
