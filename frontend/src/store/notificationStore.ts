import { create } from 'zustand';
import { api } from '../lib/api';

export interface NotificationItem {
  id: string;
  userId: string;
  workspaceId?: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  entityId?: string;
  createdAt: string;
}

export interface LiveToast {
  id: string;
  title: string;
  message: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  toasts: LiveToast[];
  isSocketConnected: boolean;

  setSocketConnected: (connected: boolean) => void;
  fetchNotifications: () => Promise<void>;
  pushLiveNotification: (item: NotificationItem) => void;
  addToast: (title: string, message: string) => void;
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  toasts: [],
  isSocketConnected: false,

  setSocketConnected: (connected) => set({ isSocketConnected: connected }),

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      set({
        notifications: res.data.items || [],
        unreadCount: res.data.unreadCount || 0,
      });
    } catch {
      // ignore if offline or unauthenticated
    }
  },

  pushLiveNotification: (item) => {
    set((state) => ({
      notifications: [item, ...state.notifications.filter((n) => n.id !== item.id)],
      unreadCount: state.unreadCount + 1,
    }));
    get().addToast(item.title, item.message);
  },

  addToast: (title, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-3), { id, title, message }],
    }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 4500);
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  markAsRead: async (id) => {
    set((state) => {
      const target = state.notifications.find((n) => n.id === id);
      const wasUnread = target && !target.isRead;
      return {
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // ignore
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await api.patch('/notifications/read-all');
    } catch {
      // ignore
    }
  },
}));
