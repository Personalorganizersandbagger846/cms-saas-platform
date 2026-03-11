import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — inject auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const tenantId = useAuthStore.getState().tenantId;
  if (tenantId) config.headers['X-Tenant-ID'] = tenantId;

  return config;
});

// Response interceptor — handle 401 refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
          useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// ─── Auth API ───────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; displayName: string }) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
};

// ─── Content API ─────────────
export const contentApi = {
  list: (params?: Record<string, string>) => api.get('/content', { params }),
  get: (id: string) => api.get(`/content/${id}`),
  create: (data: unknown) => api.post('/content', data),
  update: (id: string, data: unknown) => api.patch(`/content/${id}`, data),
  delete: (id: string) => api.delete(`/content/${id}`),
  publish: (id: string) => api.post(`/content/${id}/publish`),
  unpublish: (id: string) => api.post(`/content/${id}/unpublish`),
  versions: (id: string) => api.get(`/content/${id}/versions`),
};

// ─── Media API ────────────────
export const mediaApi = {
  list: (params?: Record<string, string>) => api.get('/media', { params }),
  get: (id: string) => api.get(`/media/${id}`),
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  delete: (id: string) => api.delete(`/media/${id}`),
  folders: (parentId?: string) => api.get('/media/folders', { params: { parentId } }),
  createFolder: (name: string, parentId?: string) => api.post('/media/folders', { name, parentId }),
};

// ─── Users API ────────────────
export const usersApi = {
  list: (params?: Record<string, string>) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: unknown) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// ─── Analytics API ────────────
export const analyticsApi = {
  overview: (period?: string) => api.get('/analytics/overview', { params: { period } }),
  topContent: (period?: string) => api.get('/analytics/top-content', { params: { period } }),
  timeseries: (period?: string, metric?: string) => api.get('/analytics/timeseries', { params: { period, metric } }),
  referrers: (period?: string) => api.get('/analytics/referrers', { params: { period } }),
  devices: (period?: string) => api.get('/analytics/devices', { params: { period } }),
};

// ─── Settings API ─────────────
export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (key: string, value: unknown) => api.put(`/settings/${key}`, { value }),
  bulkUpdate: (settings: Record<string, unknown>) => api.put('/settings/bulk/update', { settings }),
  billing: () => api.get('/settings/billing'),
  plans: () => api.get('/settings/plans'),
};

// ─── Search API ───────────────
export const searchApi = {
  search: (q: string, params?: Record<string, string>) => api.get('/search', { params: { q, ...params } }),
  suggest: (q: string) => api.get('/search/suggest', { params: { q } }),
};

// ─── Notifications API ────────
export const notificationsApi = {
  list: (params?: Record<string, string>) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

// ─── AI API ───────────────────
export const aiApi = {
  generate: (data: { prompt: string; type?: string; tone?: string; length?: string }) =>
    api.post('/ai/generate', data),
  improve: (data: { content: string; action: string }) => api.post('/ai/improve', data),
  summarize: (data: { content: string; format?: string }) => api.post('/ai/summarize', data),
  seoAnalyze: (data: { title: string; content: string; targetKeyword?: string }) =>
    api.post('/ai/seo-analyze', data),
};
