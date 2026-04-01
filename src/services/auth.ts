import { AuthPayload, LoginPayload, RegisterPayload } from '../types';
import { api } from './api';
import { clearStoredAuthToken, setStoredAuthToken } from './session';

export const login = async (payload: LoginPayload) => {
  const response = await api.post<AuthPayload>('/auth/login', payload);
  setStoredAuthToken(response.token);
  return response;
};

export const register = async (payload: RegisterPayload) => {
  const response = await api.post<AuthPayload>('/auth/register', payload);
  setStoredAuthToken(response.token);
  return response;
};

export const restoreSession = () => api.get<AuthPayload>('/auth/me');

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    clearStoredAuthToken();
  }
};
