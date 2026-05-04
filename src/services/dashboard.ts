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

const withNormalizedBootstrap = async (request: Promise<AppBootstrap>) => request;

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

export const updateMemberInfo = (userId: string, payload: { name?: string; email?: string }) =>
  withNormalizedBootstrap(api.patch<AppBootstrap>(`/users/${userId}/info`, payload));

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

// ---------------------------------------------------------------------------
// Proje planlama verileri — okuma servisleri
// ---------------------------------------------------------------------------

export const getProjectPlanning = (projectId: string) =>
  api.get<import('../types').ProjectPlanningDetails | null>(`/projects/${projectId}/planning`);

export const getProjectStakeholders = (projectId: string) =>
  api.get<import('../types').ProjectStakeholder[]>(`/projects/${projectId}/stakeholders`);

export const getProjectRequirements = (projectId: string) =>
  api.get<import('../types').ProjectRequirement[]>(`/projects/${projectId}/requirements`);

export const getProjectRisks = (projectId: string) =>
  api.get<import('../types').ProjectRisk[]>(`/projects/${projectId}/risks`);

export const getProjectCostItems = (projectId: string) =>
  api.get<import('../types').ProjectCostItem[]>(`/projects/${projectId}/cost-items`);

export const getProjectTestItems = (projectId: string) =>
  api.get<import('../types').ProjectTestItem[]>(`/projects/${projectId}/test-items`);

export const getProjectCommunicationPlans = (projectId: string) =>
  api.get<import('../types').ProjectCommunicationPlan[]>(`/projects/${projectId}/communication-plans`);

export const createProjectCommunicationPlan = (projectId: string, payload: import('../types').CreateProjectCommunicationPlanPayload) =>
  api.post<{ id: string }>(`/projects/${projectId}/communication-plans`, payload);

export const updateProjectCommunicationPlan = (projectId: string, planId: string, payload: Partial<import('../types').CreateProjectCommunicationPlanPayload>) =>
  api.patch<{ ok: boolean }>(`/projects/${projectId}/communication-plans/${planId}`, payload);

export const deleteProjectCommunicationPlan = (projectId: string, planId: string) =>
  api.delete<{ ok: boolean }>(`/projects/${projectId}/communication-plans/${planId}`);

// Paydaş CRUD
export const createProjectStakeholder = (projectId: string, payload: { name: string; role: string; interest?: string; power?: string; expectation?: string; communicationMethod?: string }) =>
  api.post<{ id: string }>(`/projects/${projectId}/stakeholders`, payload);
export const updateProjectStakeholderApi = (projectId: string, itemId: string, payload: Record<string, unknown>) =>
  api.patch<{ ok: boolean }>(`/projects/${projectId}/stakeholders/${itemId}`, payload);
export const deleteProjectStakeholderApi = (projectId: string, itemId: string) =>
  api.delete<{ ok: boolean }>(`/projects/${projectId}/stakeholders/${itemId}`);

// Gereksinim CRUD
export const createProjectRequirementApi = (projectId: string, payload: { title: string; description: string; type?: string; priority?: string; difficulty?: number; businessValue?: number }) =>
  api.post<{ id: string }>(`/projects/${projectId}/requirements`, payload);
export const updateProjectRequirementApi = (projectId: string, itemId: string, payload: Record<string, unknown>) =>
  api.patch<{ ok: boolean }>(`/projects/${projectId}/requirements/${itemId}`, payload);
export const deleteProjectRequirementApi = (projectId: string, itemId: string) =>
  api.delete<{ ok: boolean }>(`/projects/${projectId}/requirements/${itemId}`);

// Risk CRUD
export const createProjectRiskApi = (projectId: string, payload: { title: string; category: string; probability?: number; impact?: number; mitigation?: string; contingency?: string }) =>
  api.post<{ id: string }>(`/projects/${projectId}/risks`, payload);
export const updateProjectRiskApi = (projectId: string, itemId: string, payload: Record<string, unknown>) =>
  api.patch<{ ok: boolean }>(`/projects/${projectId}/risks/${itemId}`, payload);
export const deleteProjectRiskApi = (projectId: string, itemId: string) =>
  api.delete<{ ok: boolean }>(`/projects/${projectId}/risks/${itemId}`);

// Bütçe CRUD
export const createProjectCostItemApi = (projectId: string, payload: { title: string; category: string; estimatedCost?: number; actualCost?: number; currency?: string }) =>
  api.post<{ id: string }>(`/projects/${projectId}/cost-items`, payload);
export const updateProjectCostItemApi = (projectId: string, itemId: string, payload: Record<string, unknown>) =>
  api.patch<{ ok: boolean }>(`/projects/${projectId}/cost-items/${itemId}`, payload);
export const deleteProjectCostItemApi = (projectId: string, itemId: string) =>
  api.delete<{ ok: boolean }>(`/projects/${projectId}/cost-items/${itemId}`);
