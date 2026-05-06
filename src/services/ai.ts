import { ReportDetail, ReportListItem } from '../types';
import { getStoredAuthToken } from './session';

const getHeaders = () => {
  const token = getStoredAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/** Yeni rapor isteği oluştur (arka planda AI üretimi başlar) */
export const requestReport = async (projectId?: string): Promise<{ id: string; title: string; status: string }> => {
  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ projectId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Rapor isteği gönderilemedi.');
  }

  return response.json();
};

/** Kullanıcının raporlarını listele */
export const getUserReports = async (): Promise<ReportListItem[]> => {
  const response = await fetch('/api/reports', {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Raporlar alınamadı.');
  }

  const data = await response.json();
  return data.items;
};

/** Tek rapor detayı */
export const getReportDetail = async (reportId: string): Promise<ReportDetail> => {
  const response = await fetch(`/api/reports/${reportId}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Rapor detayı alınamadı.');
  }

  return response.json();
};

/** Rapor sil (sadece Admin) */
export const deleteReportApi = async (reportId: string): Promise<void> => {
  const response = await fetch(`/api/reports/${reportId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Rapor silinemedi.');
  }
};

/** AI ile proje planı oluştur */
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
