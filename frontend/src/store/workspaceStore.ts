import { create } from 'zustand';
import { api } from '../lib/api';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  taskNumber: number;
  projectId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  orderIndex: number;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  project?: {
    id: string;
    key: string;
    color?: string;
  };
  createdAt: string;
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

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  projects: Project[];
  activeProject: Project | null;
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  fetchWorkspaces: () => Promise<void>;
  selectWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string, description?: string) => Promise<boolean>;

  fetchProjects: (workspaceId: string) => Promise<void>;
  selectProject: (project: Project) => void;
  createProject: (name: string, key: string, description?: string, color?: string) => Promise<boolean>;

  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (data: { title: string; description?: string; priority?: TaskPriority; status?: TaskStatus }) => Promise<boolean>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  projects: [],
  activeProject: null,
  tasks: [],
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/workspaces');
      const workspaces = res.data;
      set({
        workspaces,
        activeWorkspace: get().activeWorkspace || workspaces[0] || null,
        isLoading: false,
      });

      if (workspaces.length > 0 && !get().activeWorkspace) {
        get().selectWorkspace(workspaces[0]);
      }
    } catch {
      set({ isLoading: false });
    }
  },

  selectWorkspace: (workspace: Workspace) => {
    set({ activeWorkspace: workspace, activeProject: null, tasks: [] });
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
    set({ activeProject: project });
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

  fetchTasks: async (projectId: string) => {
    try {
      const res = await api.get(`/tasks?projectId=${projectId}`);
      set({ tasks: res.data });
    } catch {
      set({ tasks: [] });
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

  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
    // Optimistic UI update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));

    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
    } catch {
      // Revert if failed
      if (get().activeProject) {
        get().fetchTasks(get().activeProject!.id);
      }
    }
  },
}));
