import axios, { InternalAxiosRequestConfig } from 'axios';

const AUTH_BASE = (typeof window !== 'undefined' && (window as any)._env_?.AUTH_URL) || 
                  process.env.NEXT_PUBLIC_AUTH_URL || 
                  'http://localhost:8080';

const RESOURCE_BASE = (typeof window !== 'undefined' && (window as any)._env_?.API_URL) || 
                    process.env.NEXT_PUBLIC_API_URL || 
                    'http://localhost:8081';

// Instance for Resources (Projects, Tasks, etc.)
const api = axios.create({
  baseURL: RESOURCE_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instance for Auth
const authApiInstance = axios.create({
  baseURL: AUTH_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
function attachToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}

api.interceptors.request.use(attachToken as any);
authApiInstance.interceptors.request.use(attachToken as any);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (tenantSlug: string, username: string, password: string, totpCode: string) =>
    authApiInstance.post('/api/v1/auth/login', { tenantSlug, username, password, totpCode }),
  refresh: (refreshToken: string) =>
    authApiInstance.post('/api/v1/auth/refresh', { refreshToken }),
};

// Projects
export const projectApi = {
  list: () => api.get('/api/v1/projects'),
  get: (id: string) => api.get(`/api/v1/projects/${id}`),
  create: (data: any) => api.post('/api/v1/projects', data),
  update: (id: string, data: any) => api.put(`/api/v1/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/projects/${id}`),
  getMembers: (id: string) => api.get(`/api/v1/projects/${id}/members`),
  addMember: (id: string, data: any) => api.post(`/api/v1/projects/${id}/members`, data),
  removeMember: (id: string, userId: string) =>
    api.delete(`/api/v1/projects/${id}/members/${userId}`),
};

// Tasks
export const taskApi = {
  list: (projectId: string, params?: any) =>
    api.get('/api/v1/tasks', { params: { projectId, ...params } }),
  get: (id: string) => api.get(`/api/v1/tasks/${id}`),
  create: (data: any) => api.post('/api/v1/tasks', data),
  update: (id: string, data: any) => api.put(`/api/v1/tasks/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/v1/tasks/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/api/v1/tasks/${id}`),
  stats: (projectId: string) => api.get('/api/v1/tasks/stats', { params: { projectId } }),
};

// Comments
export const commentApi = {
  list: (taskId: string) => api.get('/api/v1/comments', { params: { taskId } }),
  create: (data: any) => api.post('/api/v1/comments', data),
  update: (id: string, content: string) => api.put(`/api/v1/comments/${id}`, { content }),
  delete: (id: string) => api.delete(`/api/v1/comments/${id}`),
};

// Notifications
export const notificationApi = {
  list: () => api.get('/api/v1/notifications'),
  unreadCount: () => api.get('/api/v1/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/api/v1/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/api/v1/notifications/read-all'),
};

// Audit
export const auditApi = {
  list: () => api.get('/api/v1/audit'),
  timeline: (entityType: string, entityId: string) =>
    api.get(`/api/v1/audit/timeline/${entityType}/${entityId}`),
};

// Labels
export const labelApi = {
  list: (projectId: string) => api.get('/api/v1/labels', { params: { projectId } }),
  create: (data: any) => api.post('/api/v1/labels', data),
  delete: (id: string) => api.delete('/api/v1/labels/${id}'),
};

// Users (Directly from Auth)
export const userApi = {
  search: (query: string) => authApiInstance.get('/api/v1/users', { params: { search: query } }),
};

export default api;
