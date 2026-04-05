import { api } from './api.js';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
};

export const linksApi = {
  createGuest: (data) => api.post('/links/guest', data),
  create: (data) => api.post('/links', data),
  getAll: (params) => api.get('/links', { params }),
  getById: (id) => api.get(`/links/${id}`),
  update: (id, data) => api.patch(`/links/${id}`, data),
  delete: (id) => api.delete(`/links/${id}`),
};

export const analyticsApi = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getClicks: (params) => api.get('/analytics/clicks', { params }),
  getGeography: (params) => api.get('/analytics/geography', { params }),
  getDevices: (params) => api.get('/analytics/devices', { params }),
  getBrowsers: (params) => api.get('/analytics/browsers', { params }),
  getReferrers: (params) => api.get('/analytics/referrers', { params }),
  getHeatmap: (params) => api.get('/analytics/heatmap', { params }),
};
