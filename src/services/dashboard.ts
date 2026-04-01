import {
  AppBootstrap,
  CreateCalendarEventPayload,
  CreateProjectPayload,
  CreateTaskPayload,
  UpdateProjectPayload,
  UpdateTaskPayload,
} from '../types';
import { api } from './api';

export const getBootstrapData = () => api.get<AppBootstrap>('/bootstrap');

export const createProject = (payload: CreateProjectPayload) =>
  api.post<AppBootstrap>('/projects', payload);

export const createCalendarEvent = (payload: CreateCalendarEventPayload) =>
  api.post<AppBootstrap>('/calendar-events', payload);

export const deleteCalendarEvent = (eventId: string) =>
  api.delete<AppBootstrap>(`/calendar-events/${eventId}`);

export const updateProject = (projectId: string, payload: UpdateProjectPayload) =>
  api.patch<AppBootstrap>(`/projects/${projectId}`, payload);

export const deleteProject = (projectId: string) =>
  api.delete<AppBootstrap>(`/projects/${projectId}`);

export const addProjectMember = (projectId: string, userId: string) =>
  api.post<AppBootstrap>(`/projects/${projectId}/members`, { userId });

export const createTask = (payload: CreateTaskPayload) =>
  api.post<AppBootstrap>('/tasks', payload);

export const updateTask = (taskId: string, payload: UpdateTaskPayload) =>
  api.patch<AppBootstrap>(`/tasks/${taskId}`, payload);

export const deleteTask = (taskId: string) =>
  api.delete<AppBootstrap>(`/tasks/${taskId}`);

export const addTaskComment = (taskId: string, userId: string, content: string) =>
  api.post<AppBootstrap>(`/tasks/${taskId}/comments`, { userId, content });

export const updateTaskComment = (taskId: string, commentId: string, content: string) =>
  api.patch<AppBootstrap>(`/tasks/${taskId}/comments/${commentId}`, { content });

export const deleteTaskComment = (taskId: string, commentId: string) =>
  api.delete<AppBootstrap>(`/tasks/${taskId}/comments/${commentId}`);

export const addTaskAssignee = (taskId: string, userId: string) =>
  api.post<AppBootstrap>(`/tasks/${taskId}/assignees`, { userId });

export const removeTaskAssignee = (taskId: string, userId: string) =>
  api.delete<AppBootstrap>(`/tasks/${taskId}/assignees/${userId}`);

export const addTaskAttachment = (taskId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<AppBootstrap>(`/tasks/${taskId}/attachments`, formData);
};

export const markAllNotificationsRead = () =>
  api.patch<AppBootstrap>('/notifications/read-all');
