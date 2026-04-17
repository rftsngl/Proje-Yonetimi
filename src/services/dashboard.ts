import {
  AppBootstrap,
  CreateCalendarEventPayload,
  CreateProjectPayload,
  CreateTaskPayload,
  TaskTreeResponse,
  UserAuditLogsResponse,
  UpdateUserDepartmentPayload,
  UpdateUserRolePayload,
  UpdateProjectPayload,
  UpdateTaskPayload,
} from '../types';
import { api } from './api';

const normalizeMojibake = (value: string) =>
  value
    .replace(/GÃ¶/g, 'Gö')
    .replace(/gÃ¶/g, 'gö')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã¶/g, 'ö')
    .replace(/Ã§/g, 'ç')
    .replace(/Ãş/g, 'ş')
    .replace(/Ãı/g, 'ı')
    .replace(/ÃĞ/g, 'Ğ')
    .replace(/Ãğ/g, 'ğ')
    .replace(/Ãœ/g, 'Ü')
    .replace(/Ã–/g, 'Ö')
    .replace(/Ã‡/g, 'Ç')
    .replace(/ÃŞ/g, 'Ş')
    .replace(/Ä±/g, 'ı')
    .replace(/Ä°/g, 'İ');

const normalizeBootstrap = (payload: AppBootstrap): AppBootstrap => ({
  ...payload,
  stats: payload.stats.map((stat) => ({
    ...stat,
    label: normalizeMojibake(stat.label),
  })),
});

const withNormalizedBootstrap = async (request: Promise<AppBootstrap>) =>
  normalizeBootstrap(await request);

export const getBootstrapData = () => withNormalizedBootstrap(api.get<AppBootstrap>('/bootstrap'));

export const createProject = (payload: CreateProjectPayload) =>
  withNormalizedBootstrap(api.post<AppBootstrap>('/projects', payload));

export const createCalendarEvent = (payload: CreateCalendarEventPayload) =>
  withNormalizedBootstrap(api.post<AppBootstrap>('/calendar-events', payload));

export const deleteCalendarEvent = (eventId: string) =>
  withNormalizedBootstrap(api.delete<AppBootstrap>(`/calendar-events/${eventId}`));

export const updateCalendarEvent = (eventId: string, payload: CreateCalendarEventPayload) =>
  withNormalizedBootstrap(api.patch<AppBootstrap>(`/calendar-events/${eventId}`, payload));

export const updateProject = (projectId: string, payload: UpdateProjectPayload) =>
  withNormalizedBootstrap(api.patch<AppBootstrap>(`/projects/${projectId}`, payload));

export const deleteProject = (projectId: string) =>
  withNormalizedBootstrap(api.delete<AppBootstrap>(`/projects/${projectId}`));

export const addProjectMember = (projectId: string, userId: string) =>
  withNormalizedBootstrap(api.post<AppBootstrap>(`/projects/${projectId}/members`, { userId }));

export const createTask = (payload: CreateTaskPayload) =>
  withNormalizedBootstrap(api.post<AppBootstrap>('/tasks', payload));

export const updateTask = (taskId: string, payload: UpdateTaskPayload) =>
  withNormalizedBootstrap(api.patch<AppBootstrap>(`/tasks/${taskId}`, payload));

export const updateTaskStatus = (taskId: string, status: UpdateTaskPayload['status']) =>
  withNormalizedBootstrap(api.patch<AppBootstrap>(`/tasks/${taskId}/status`, { status }));

export const deleteTask = (taskId: string) =>
  withNormalizedBootstrap(api.delete<AppBootstrap>(`/tasks/${taskId}`));

export const addTaskComment = (taskId: string, userId: string, content: string) =>
  withNormalizedBootstrap(api.post<AppBootstrap>(`/tasks/${taskId}/comments`, { userId, content }));

export const updateTaskComment = (taskId: string, commentId: string, content: string) =>
  withNormalizedBootstrap(api.patch<AppBootstrap>(`/tasks/${taskId}/comments/${commentId}`, { content }));

export const deleteTaskComment = (taskId: string, commentId: string) =>
  withNormalizedBootstrap(api.delete<AppBootstrap>(`/tasks/${taskId}/comments/${commentId}`));

export const addTaskAssignee = (taskId: string, userId: string) =>
  withNormalizedBootstrap(api.post<AppBootstrap>(`/tasks/${taskId}/assignees`, { userId }));

export const removeTaskAssignee = (taskId: string, userId: string) =>
  withNormalizedBootstrap(api.delete<AppBootstrap>(`/tasks/${taskId}/assignees/${userId}`));

export const addTaskAttachment = (taskId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return withNormalizedBootstrap(api.post<AppBootstrap>(`/tasks/${taskId}/attachments`, formData));
};

export const markAllNotificationsRead = () =>
  withNormalizedBootstrap(api.patch<AppBootstrap>('/notifications/read-all'));

export const deleteNotification = (notificationId: string) =>
  withNormalizedBootstrap(api.delete<AppBootstrap>(`/notifications/${notificationId}`));

export const deleteAllNotifications = () =>
  withNormalizedBootstrap(api.delete<AppBootstrap>('/notifications'));

export const setNotificationReadState = (notificationId: string, read: boolean) =>
  withNormalizedBootstrap(api.patch<AppBootstrap>(`/notifications/${notificationId}/read`, { read }));

export const updateUserRole = (userId: string, payload: UpdateUserRolePayload) =>
  withNormalizedBootstrap(api.patch<AppBootstrap>(`/users/${userId}/role`, payload));

export const updateUserDepartment = (userId: string, payload: UpdateUserDepartmentPayload) =>
  withNormalizedBootstrap(api.patch<AppBootstrap>(`/users/${userId}/department`, payload));

export const deleteTeamMember = (userId: string) =>
  withNormalizedBootstrap(api.delete<AppBootstrap>(`/users/${userId}`));

export const getAdminAuditLogs = (limit = 100) =>
  api.get<UserAuditLogsResponse>(`/admin/audit-logs?limit=${limit}`);

export const getTaskTree = (projectId: string) =>
  api.get<TaskTreeResponse>(`/tasks/tree?projectId=${encodeURIComponent(projectId)}`);

export const updateTaskParent = (taskId: string, projectId: string, parentTaskId?: string | null) =>
  withNormalizedBootstrap(api.patch<AppBootstrap>(`/tasks/${taskId}/parent`, { projectId, parentTaskId: parentTaskId || null }));

export const getNotificationsPage = (limit: number = 20, beforeCreatedAt?: string, beforeId?: string) => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (beforeCreatedAt) params.append('beforeCreatedAt', beforeCreatedAt);
  if (beforeId) params.append('beforeId', beforeId);

  return api.get<import('../types').NotificationsPageResponse>(`/notifications?${params.toString()}`);
};
