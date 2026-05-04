import { getStoredAuthToken } from './session';

const getHeaders = () => {
  const token = getStoredAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getGlobalReport = async (): Promise<string> => {
  const response = await fetch('/api/reports/projects', {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Rapor alınamadı.');
  }

  const data = await response.json();
  return data.report;
};

export const getProjectReport = async (projectId: string): Promise<string> => {
  const response = await fetch(`/api/reports/projects/${projectId}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Rapor alınamadı.');
  }

  const data = await response.json();
  return data.report;
};

export const generateProject = async (payload: { prompt: string, context: any }): Promise<any> => {
  const response = await fetch('/api/ai/generate-project', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Proje planı oluşturulamadı.');
  }

  return response.json();
};
