import { create } from 'zustand';
import { api } from '../lib/api';

export interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  systemRole: string;
  workspaces?: WorkspaceItem[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  initializeAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initializeAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('devsync_access_token');
      const savedUser = localStorage.getItem('devsync_user');
      if (token && savedUser) {
        try {
          const user = JSON.parse(savedUser);
          set({ accessToken: token, user, isAuthenticated: true });
        } catch {
          localStorage.removeItem('devsync_user');
          set({ accessToken: null, user: null, isAuthenticated: false });
        }
      }
    }
  },

  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('devsync_access_token', accessToken);
      localStorage.setItem('devsync_refresh_token', refreshToken);
      localStorage.setItem('devsync_user', JSON.stringify(user));

      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Tizimga kirishda xatolik yuz berdi';
      set({
        error: Array.isArray(message) ? message.join(', ') : message,
        isLoading: false,
      });
      return false;
    }
  },

  register: async (email: string, password: string, firstName: string, lastName: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('devsync_access_token', accessToken);
      localStorage.setItem('devsync_refresh_token', refreshToken);
      localStorage.setItem('devsync_user', JSON.stringify(user));

      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi';
      set({
        error: Array.isArray(message) ? message.join(', ') : message,
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('devsync_access_token');
    localStorage.removeItem('devsync_refresh_token');
    localStorage.removeItem('devsync_user');
    set({ user: null, accessToken: null, isAuthenticated: false, error: null });
  },

  fetchProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true });
      localStorage.setItem('devsync_user', JSON.stringify(response.data));
    } catch {
      // Token expired or invalid
    }
  },
}));
