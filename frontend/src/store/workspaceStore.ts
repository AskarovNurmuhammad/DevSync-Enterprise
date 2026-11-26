import { create } from 'zustand';
import { api } from '../lib/api';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatarUrl?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: UserSummary;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  uploaderId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploader?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Task {
  id: string;
  taskNumber: number;
  projectId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  orderIndex: number;
  assigneeId?: string | null;
  assignee?: UserSummary | null;
  creator?: UserSummary;
  project?: {
    id: string;
    name?: string;
    key: string;
    color?: string;
    workspace?: {
      members?: { user: UserSummary; role: string }[];
    };
  };
  _count?: {
    comments: number;
    attachments?: number;
  };
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  color?: string;
  status: string;
  _count?: {
    tasks: number;
  };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  userRole?: string;
  _count?: {
    projects: number;
    members: number;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  projects: Project[];
  activeProject: Project | null;
  tasks: Task[];
  paginatedTasks: Task[];
  paginationMeta: PaginationMeta;
  selectedTask: Task | null;
  isDetailLoading: boolean;
  isLoading: boolean;
  error: string | null;

  fetchWorkspaces: () => Promise<void>;
  selectWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string, description?: string) => Promise<boolean>;

  fetchProjects: (workspaceId: string) => Promise<void>;
  selectProject: (project: Project) => void;
  createProject: (name: string, key: string, description?: string, color?: string) => Promise<boolean>;

  fetchTasks: (projectId: string, filters?: { search?: string; priority?: string; status?: string }) => Promise<void>;
  searchWorkspaceTasks: (params: {
    workspaceId: string;
    projectId?: string;
    search?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) => Promise<Task[]>;

  createTask: (data: { title: string; description?: string; priority?: TaskPriority; status?: TaskStatus }) => Promise<boolean>;
  updateTask: (taskId: string, data: Partial<{ title: string; description: string; priority: TaskPriority; status: TaskStatus; assigneeId: string | null }>) => Promise<boolean>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<boolean>;

  openTaskDetail: (taskId: string) => Promise<void>;
  closeTaskDetail: () => void;

  addComment: (taskId: string, content: string) => Promise<boolean>;
  deleteComment: (taskId: string, commentId: string) => Promise<boolean>;

  uploadAttachment: (taskId: string, file: File) => Promise<boolean>;
  deleteAttachment: (taskId: string, attachmentId: string) => Promise<boolean>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  projects: [],
  activeProject: null,
  tasks: [],
  paginatedTasks: [],
  paginationMeta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  selectedTask: null,
  isDetailLoading: false,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/workspaces');
      const workspaces = res.data;
      const current = get().activeWorkspace;
      const nextActive = current && workspaces.some((w: Workspace) => w.id === current.id)
        ? current
        : workspaces[0] || null;

      set({
        workspaces,
        activeWorkspace: nextActive,
        isLoading: false,
      });

      if (nextActive && !get().activeProject) {
        get().fetchProjects(nextActive.id);
      }
    } catch {
      set({ isLoading: false });
    }
  },

  selectWorkspace: (workspace: Workspace) => {
    set({ activeWorkspace: workspace, activeProject: null, tasks: [], selectedTask: null });
    get().fetchProjects(workspace.id);
  },

  createWorkspace: async (name: string, description?: string) => {
    try {
      const res = await api.post('/workspaces', { name, description });
      await get().fetchWorkspaces();
      get().selectWorkspace(res.data);
      return true;
    } catch {
      return false;
    }
  },

  fetchProjects: async (workspaceId: string) => {
    try {
      const res = await api.get(`/projects?workspaceId=${workspaceId}`);
      const projects = res.data;
      set({
        projects,
        activeProject: projects[0] || null,
      });

      if (projects.length > 0) {
        get().fetchTasks(projects[0].id);
      }
    } catch {
      set({ projects: [], activeProject: null });
    }
  },

  selectProject: (project: Project) => {
    set({ activeProject: project, selectedTask: null });
    get().fetchTasks(project.id);
  },

  createProject: async (name: string, key: string, description?: string, color?: string) => {
    const activeWorkspace = get().activeWorkspace;
    if (!activeWorkspace) return false;

    try {
      await api.post('/projects', {
        workspaceId: activeWorkspace.id,
        name,
        key,
        description,
        color,
      });
      await get().fetchProjects(activeWorkspace.id);
      return true;
    } catch {
      return false;
    }
  },

  fetchTasks: async (projectId: string, filters?: { search?: string; priority?: string; status?: string }) => {
    try {
      const params = new URLSearchParams({ projectId });
      if (filters?.search) params.append('search', filters.search);
      if (filters?.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
      if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);

      const res = await api.get(`/tasks?${params.toString()}`);
      set({ tasks: res.data });
    } catch {
      set({ tasks: [] });
    }
  },

  searchWorkspaceTasks: async (params) => {
    try {
      const query = new URLSearchParams({ workspaceId: params.workspaceId });
      if (params.projectId) query.append('projectId', params.projectId);
      if (params.search) query.append('search', params.search);
      if (params.status && params.status !== 'ALL') query.append('status', params.status);
      if (params.priority && params.priority !== 'ALL') query.append('priority', params.priority);
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));

      const res = await api.get(`/tasks/search?${query.toString()}`);
      set({
        paginatedTasks: res.data.items || [],
        paginationMeta: res.data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 },
      });
      return res.data.items || [];
    } catch {
      return [];
    }
  },

  createTask: async (data) => {
    const activeProject = get().activeProject;
    if (!activeProject) return false;

    try {
      await api.post('/tasks', {
        projectId: activeProject.id,
        ...data,
      });
      await get().fetchTasks(activeProject.id);
      return true;
    } catch {
      return false;
    }
  },

  updateTask: async (taskId, data) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, data);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...res.data } : t)),
        selectedTask: state.selectedTask?.id === taskId ? { ...state.selectedTask, ...res.data } : state.selectedTask,
      }));
      return true;
    } catch {
      return false;
    }
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      selectedTask: state.selectedTask?.id === taskId ? { ...state.selectedTask, status } : state.selectedTask,
    }));

    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
    } catch {
      if (get().activeProject) {
        get().fetchTasks(get().activeProject!.id);
      }
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
        paginatedTasks: state.paginatedTasks.filter((t) => t.id !== taskId),
        selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask,
      }));
      return true;
    } catch {
      return false;
    }
  },

  openTaskDetail: async (taskId: string) => {
    set({ isDetailLoading: true });
    try {
      const res = await api.get(`/tasks/${taskId}`);
      set({ selectedTask: res.data, isDetailLoading: false });
    } catch {
      set({ isDetailLoading: false });
    }
  },

  closeTaskDetail: () => set({ selectedTask: null }),

  addComment: async (taskId: string, content: string) => {
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { content });
      set((state) => {
        if (!state.selectedTask || state.selectedTask.id !== taskId) return state;
        const comments = [...(state.selectedTask.comments || []), res.data];
        return {
          selectedTask: { ...state.selectedTask, comments },
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, _count: { ...t._count, comments: comments.length } }
              : t,
          ),
        };
      });
      return true;
    } catch {
      return false;
    }
  },

  deleteComment: async (taskId: string, commentId: string) => {
    try {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`);
      set((state) => {
        if (!state.selectedTask || state.selectedTask.id !== taskId) return state;
        const comments = (state.selectedTask.comments || []).filter((c) => c.id !== commentId);
        return {
          selectedTask: { ...state.selectedTask, comments },
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, _count: { ...t._count, comments: comments.length } }
              : t,
          ),
        };
      });
      return true;
    } catch {
      return false;
    }
  },

  uploadAttachment: async (taskId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/uploads/tasks/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set((state) => {
        if (!state.selectedTask || state.selectedTask.id !== taskId) return state;
        const attachments = [res.data, ...(state.selectedTask.attachments || [])];
        return {
          selectedTask: { ...state.selectedTask, attachments },
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, _count: { comments: t._count?.comments || 0, attachments: attachments.length } }
              : t,
          ),
        };
      });
      return true;
    } catch {
      return false;
    }
  },

  deleteAttachment: async (taskId: string, attachmentId: string) => {
    try {
      await api.delete(`/uploads/attachments/${attachmentId}`);
      set((state) => {
        if (!state.selectedTask || state.selectedTask.id !== taskId) return state;
        const attachments = (state.selectedTask.attachments || []).filter((a) => a.id !== attachmentId);
        return {
          selectedTask: { ...state.selectedTask, attachments },
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, _count: { comments: t._count?.comments || 0, attachments: attachments.length } }
              : t,
          ),
        };
      });
      return true;
    } catch {
      return false;
    }
  },
}));
