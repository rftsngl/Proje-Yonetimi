import {
  ChangePasswordPayload,
  SettingsBundle,
  UpdateProfilePayload,
  UpdateSettingsPayload,
} from '../types';
import { api } from './api';

export const getSettings = () =>
  api.get<SettingsBundle>('/settings');

export const updateSettings = (payload: UpdateSettingsPayload) =>
  api.put<SettingsBundle>('/settings', payload);

export const updateProfile = (payload: UpdateProfilePayload) =>
  api.put<SettingsBundle>('/settings/profile', payload);

export const changePassword = (payload: ChangePasswordPayload) =>
  api.put<{ ok: boolean; message: string }>('/settings/password', payload);

export const resetSettings = () =>
  api.post<SettingsBundle>('/settings/reset');

export const uploadProfilePhoto = (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post<SettingsBundle>('/settings/avatar', formData);
};
