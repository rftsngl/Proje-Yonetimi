import { Request, Response, Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import {
  addProjectMember,
  addTaskAssignee,
  addTaskAttachment,
  addTaskComment,
  createCalendarEvent,
  createProject,
  createTask,
  deleteCalendarEvent,
  deleteProject,
  deleteTask,
  deleteTaskComment,
  getAdminCount,
  getUserAuditLogs,
  getUserRoleAndDepartment,
  getBootstrapData,
  canUserUpdateTaskStatus,
  markAllNotificationsAsRead,
  removeTaskAssignee,
  createUserAuditLog,
  updateProject,
  updateTask,
  updateTaskComment,
  updateTaskParent,
  updateTaskStatus,
  updateUserDepartment,
  updateUserRole,
  deleteNotification,
  deleteAllNotifications,
  setNotificationReadState,
} from '../services/dashboardService.js';
import { getUserFromToken, loginUser, logoutUser, registerUser } from '../services/authService.js';
import { createEntityId } from '../utils/formatters.js';

export const apiRouter = Router();

const uploadDirectory = path.join(process.cwd(), 'uploads', 'tasks');
fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname) || '';
      callback(null, `${createEntityId('FILE')}${extension}`);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
};

const getRequestToken = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return '';
  }

  return authorizationHeader.slice('Bearer '.length).trim();
};

const getAuthorizedContext = async (request: Request, response: Response) => {
  const token = getRequestToken(request.headers.authorization);

  if (!token) {
    response.status(401).json({ message: 'Oturum bulunamadi.' });
    return null;
  }

  const session = await getUserFromToken(token);

  if (!session) {
    response.status(401).json({ message: 'Oturum gecersiz veya suresi dolmus.' });
    return null;
  }

  return { ...session, token };
};

const requireManagementPermission = (
  allowed: boolean,
  response: Response,
  message = 'Bu islem icin yetkiniz bulunmuyor.',
) => {
  if (!allowed) {
    response.status(403).json({ message });
    return false;
  }

  return true;
};

const buildTaskTree = (tasks: Array<Record<string, any>>) => {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const childrenByParent = new Map<string, Array<Record<string, any>>>();

  for (const task of tasks) {
    const parentId = task.parentTaskId && taskById.has(task.parentTaskId) ? task.parentTaskId : 'ROOT';
    childrenByParent.set(parentId, [...(childrenByParent.get(parentId) || []), task]);
  }

  const sortTasks = (items: Array<Record<string, any>>) =>
    [...items].sort((left, right) => (left.wbsCode || left.id).localeCompare(right.wbsCode || right.id));

  const walk = (parentId: string): Array<Record<string, any>> =>
    sortTasks(childrenByParent.get(parentId) || []).map((task) => ({
      ...task,
      children: walk(task.id),
    }));

  return walk('ROOT');
};

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true });
});

apiRouter.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'E-posta ve sifre zorunludur.' });
    }

    const session = await loginUser({ email: email.trim(), password });

    return res.json({
      token: session.token,
      bootstrap: await getBootstrapData(session.user),
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({ message: error.message });
    }
    return next(error);
  }
});

apiRouter.post('/auth/register', async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Kayit icin zorunlu alanlar eksik.' });
    }

    const session = await registerUser({
      name: name.trim(),
      email: email.trim(),
      password,
      department,
    });

    return res.status(201).json({
      token: session.token,
      bootstrap: await getBootstrapData(session.user),
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

apiRouter.get('/auth/me', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    return res.json({
      token: session.token,
      bootstrap: await getBootstrapData(session.user),
    });
  } catch (error) {
    return next(error);
  }
});

apiRouter.post('/auth/logout', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    await logoutUser(session.token);
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

apiRouter.get('/bootstrap', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.post('/calendar-events', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageCalendar, res)) {
      return;
    }

    const { title, date, color, eventType } = req.body;

    if (!title?.trim() || !date || !color?.trim() || !eventType?.trim()) {
      return res.status(400).json({ message: 'Takvim etkinligi icin zorunlu alanlar eksik.' });
    }

    await createCalendarEvent({
      title: title.trim(),
      date,
      color: color.trim(),
      eventType: eventType.trim(),
    });

    return res.status(201).json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.delete('/calendar-events/:eventId', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageCalendar, res)) {
      return;
    }

    const deleted = await deleteCalendarEvent(req.params.eventId);

    if (!deleted) {
      return res.status(404).json({ message: 'Takvim etkinligi bulunamadi.' });
    }

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.post('/projects', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageProjects, res)) {
      return;
    }

    const { name, description, category, managerId, startDate, endDate, themeColor } = req.body;

    if (!name || !description || !category || !managerId) {
      return res.status(400).json({ message: 'Zorunlu proje alanlari eksik.' });
    }

    await createProject({ name, description, category, managerId, startDate, endDate, themeColor });
    return res.status(201).json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.patch('/projects/:projectId', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageProjects, res)) {
      return;
    }

    const { projectId } = req.params;
    const { name, description, category, managerId, startDate, endDate, themeColor, progress, status } = req.body;

    if (!name || !description || !category || !managerId) {
      return res.status(400).json({ message: 'Zorunlu proje alanlari eksik.' });
    }

    await updateProject(projectId, { name, description, category, managerId, startDate, endDate, themeColor, progress, status });
    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.delete('/projects/:projectId', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageProjects, res)) {
      return;
    }

    const deleted = await deleteProject(req.params.projectId);

    if (!deleted) {
      return res.status(404).json({ message: 'Proje bulunamadi.' });
    }

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.post('/projects/:projectId/members', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageTeam, res)) {
      return;
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Kullanici secimi zorunludur.' });
    }

    const added = await addProjectMember(req.params.projectId, userId);

    if (!added) {
      return res.status(404).json({ message: 'Proje veya kullanici bulunamadi.' });
    }

    return res.status(201).json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.post('/tasks', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageTasks, res)) {
      return;
    }

    const { title, description, projectId, parentTaskId, assigneeIds, startDate, dueDate, priority } = req.body;

    if (!title || !projectId || !priority || !Array.isArray(assigneeIds) || assigneeIds.length === 0) {
      return res.status(400).json({ message: 'Zorunlu gorev alanlari eksik.' });
    }

    await createTask({ title, description: description || '', projectId, parentTaskId, assigneeIds, startDate, dueDate, priority });
    return res.status(201).json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.get('/tasks/tree', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    const projectId = String(req.query.projectId || '').trim();
    if (!projectId) {
      return res.status(400).json({ message: 'projectId zorunludur.' });
    }

    const bootstrap = await getBootstrapData(session.user);
    const tasks = bootstrap.tasks.filter((task) => task.projectId === projectId);
    return res.json({ items: buildTaskTree(tasks) });
  } catch (error) {
    return next(error);
  }
});

apiRouter.patch('/tasks/:taskId', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageTasks, res)) {
      return;
    }

    const { title, description, projectId, parentTaskId, assigneeIds, startDate, dueDate, priority, status } = req.body;

    if (!title || !projectId || !priority || !Array.isArray(assigneeIds) || !assigneeIds.length) {
      return res.status(400).json({ message: 'Zorunlu gorev alanlari eksik.' });
    }

    await updateTask(req.params.taskId, { title, description: description || '', projectId, parentTaskId, assigneeIds, startDate, dueDate, priority, status });
    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.patch('/tasks/:taskId/parent', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageTasks, res)) {
      return;
    }

    const { parentTaskId, projectId } = req.body;

    if (!projectId?.trim()) {
      return res.status(400).json({ message: 'projectId zorunludur.' });
    }

    const updated = await updateTaskParent(req.params.taskId, projectId.trim(), parentTaskId || null);

    if (!updated) {
      return res.status(404).json({ message: 'Gorev bulunamadi.' });
    }

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

apiRouter.patch('/tasks/:taskId/status', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    const { status } = req.body;

    if (!['Yapılacak', 'Devam Ediyor', 'Tamamlandı', 'Gecikti'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz görev durumu.' });
    }

    const canUpdateStatus = await canUserUpdateTaskStatus(req.params.taskId, session.user.id, session.user.role);

    if (!canUpdateStatus) {
      return res.status(403).json({ message: 'Bu görevin durumunu sadece admin veya atanan kullanıcı değiştirebilir.' });
    }

    const updated = await updateTaskStatus(req.params.taskId, status);

    if (!updated) {
      return res.status(404).json({ message: 'Gorev bulunamadi.' });
    }

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.patch('/users/:userId/role', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageTeam, res)) {
      return;
    }

    const { role } = req.body;
    const { userId } = req.params;

    if (!role?.trim()) {
      return res.status(400).json({ message: 'Rol bilgisi zorunludur.' });
    }

    if (userId === session.user.id) {
      return res.status(400).json({ message: 'Kendi rolunuzu degistiremezsiniz.' });
    }

    const targetUser = await getUserRoleAndDepartment(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Kullanici bulunamadi.' });
    }

    const nextRole = role.trim();
    if (targetUser.role === 'Admin' && nextRole !== 'Admin') {
      const adminCount = await getAdminCount();
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Sistemdeki son adminin rolu degistirilemez.' });
      }
    }

    const updated = await updateUserRole(userId, nextRole);

    if (!updated) {
      return res.status(404).json({ message: 'Kullanici bulunamadi.' });
    }

    await createUserAuditLog({
      actorUserId: session.user.id,
      targetUserId: userId,
      action: 'role_update',
      oldValue: targetUser.role,
      newValue: nextRole,
    });

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

apiRouter.patch('/users/:userId/department', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageTeam, res)) {
      return;
    }

    const { department } = req.body;
    const { userId } = req.params;

    if (!department?.trim()) {
      return res.status(400).json({ message: 'Departman bilgisi zorunludur.' });
    }

    if (userId === session.user.id) {
      return res.status(400).json({ message: 'Kendi departmaninizi buradan degistiremezsiniz.' });
    }

    const targetUser = await getUserRoleAndDepartment(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Kullanici bulunamadi.' });
    }

    const nextDepartment = department.trim();

    const updated = await updateUserDepartment(userId, nextDepartment);

    if (!updated) {
      return res.status(404).json({ message: 'Kullanici bulunamadi.' });
    }

    await createUserAuditLog({
      actorUserId: session.user.id,
      targetUserId: userId,
      action: 'department_update',
      oldValue: targetUser.department,
      newValue: nextDepartment,
    });

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

apiRouter.get('/admin/audit-logs', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageTeam, res)) {
      return;
    }

    const limit = Number(req.query.limit || 100);
    const logs = await getUserAuditLogs(limit);
    return res.json({ items: logs });
  } catch (error) {
    return next(error);
  }
});

apiRouter.delete('/tasks/:taskId', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageTasks, res)) {
      return;
    }

    const deleted = await deleteTask(req.params.taskId);

    if (!deleted) {
      return res.status(404).json({ message: 'Gorev bulunamadi.' });
    }

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.post('/tasks/:taskId/comments', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Yorum icerigi zorunludur.' });
    }

    const created = await addTaskComment(req.params.taskId, session.user.id, content.trim());

    if (!created) {
      return res.status(404).json({ message: 'Gorev veya kullanici bulunamadi.' });
    }

    return res.status(201).json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.patch('/tasks/:taskId/comments/:commentId', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Yorum icerigi zorunludur.' });
    }

    const updated = await updateTaskComment(req.params.taskId, req.params.commentId, content.trim());

    if (!updated) {
      return res.status(404).json({ message: 'Yorum bulunamadi.' });
    }

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.delete('/tasks/:taskId/comments/:commentId', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    const deleted = await deleteTaskComment(req.params.taskId, req.params.commentId);

    if (!deleted) {
      return res.status(404).json({ message: 'Yorum bulunamadi.' });
    }

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.post('/tasks/:taskId/assignees', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageTasks, res)) {
      return;
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Kullanici secimi zorunludur.' });
    }

    const added = await addTaskAssignee(req.params.taskId, userId);

    if (!added) {
      return res.status(404).json({ message: 'Gorev veya kullanici bulunamadi.' });
    }

    return res.status(201).json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.delete('/tasks/:taskId/assignees/:userId', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!requireManagementPermission(session.permissions.canManageTasks, res)) {
      return;
    }

    const deleted = await removeTaskAssignee(req.params.taskId, req.params.userId);

    if (!deleted) {
      return res.status(404).json({ message: 'Gorev atamasi bulunamadi.' });
    }

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.post('/tasks/:taskId/attachments', upload.single('file'), async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Yuklenecek dosya zorunludur.' });
    }

    const extension = path.extname(req.file.originalname).replace('.', '').toUpperCase() || 'FILE';
    const created = await addTaskAttachment(req.params.taskId, {
      name: req.file.originalname,
      fileType: extension,
      fileSizeLabel: formatFileSize(req.file.size),
      mimeType: req.file.mimetype,
      fileSizeBytes: req.file.size,
      filePath: `/uploads/tasks/${req.file.filename}`,
    });

    if (!created) {
      fs.unlink(req.file.path, () => undefined);
      return res.status(404).json({ message: 'Gorev bulunamadi.' });
    }

    return res.status(201).json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.patch('/notifications/read-all', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    await markAllNotificationsAsRead();
    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.delete('/notifications', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    await deleteAllNotifications();
    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.delete('/notifications/:notificationId', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    const deleted = await deleteNotification(req.params.notificationId);

    if (!deleted) {
      return res.status(404).json({ message: 'Bildirim bulunamadi.' });
    }

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});

apiRouter.patch('/notifications/:notificationId/read', async (req, res, next) => {
  try {
    const session = await getAuthorizedContext(req, res);

    if (!session) {
      return;
    }

    const { read } = req.body;
    
    if (typeof read !== 'boolean') {
      return res.status(400).json({ message: 'Gecersiz "read" degeri.' });
    }

    const updated = await setNotificationReadState(req.params.notificationId, read);

    if (!updated) {
      return res.status(404).json({ message: 'Bildirim bulunamadi.' });
    }

    return res.json(await getBootstrapData(session.user));
  } catch (error) {
    return next(error);
  }
});
