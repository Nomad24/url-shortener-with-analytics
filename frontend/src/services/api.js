import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

function isRefreshRequest(config) {
  return config?.url?.includes('/auth/refresh');
}

function isAuthFormRequest(config) {
  return config?.url?.includes('/auth/login') || config?.url?.includes('/auth/register');
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!config) {
      return Promise.reject(error);
    }

    if (
      response?.status === 401 &&
      !config._retry &&
      !isRefreshRequest(config) &&
      !isAuthFormRequest(config)
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
            resolve(api(config));
          });
        });
      }

      config._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, {
          withCredentials: true,
        });

        const { accessToken } = data.data;
        localStorage.setItem('accessToken', accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        onRefreshed(accessToken);
        isRefreshing = false;

        return api(config);
      } catch (refreshError) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');

        // SPA redirect without hard refresh to avoid full page reload loops.
        if (window.location.pathname !== '/') {
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
