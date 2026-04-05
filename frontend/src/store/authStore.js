import { create } from 'zustand';
import { authApi } from '../services/endpoints.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    set({ isLoading: true });

    try {
      const { data } = await authApi.refresh();
      const { accessToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      
      const { data: userData } = await authApi.me();
      set({
        user: userData.data.user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('accessToken');
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    const { accessToken, user } = data.data;
    localStorage.setItem('accessToken', accessToken);
    set({
      user,
      accessToken,
      isAuthenticated: true,
    });
  },

  register: async (name, email, password) => {
    const normalizedName = name?.trim();
    await authApi.register({ name: normalizedName || undefined, email, password });
    await get().login(email, password);
  },

  logout: async () => {
    await authApi.logout();
    localStorage.removeItem('accessToken');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },

  setAccessToken: (token) => {
    localStorage.setItem('accessToken', token);
    set({ accessToken: token });
  },
}));
