'use client';

import React, { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, X } from 'lucide-react';

export default function RealtimeManager() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    activeWorkspace,
    activeProject,
    applyRemoteTaskCreated,
    applyRemoteTaskUpdated,
    applyRemoteTaskStatusChanged,
    applyRemoteTaskDeleted,
    applyRemoteCommentAdded,
  } = useWorkspaceStore();

  const {
    toasts,
    dismissToast,
    setSocketConnected,
    fetchNotifications,
    pushLiveNotification,
  } = useNotificationStore();

  // Connect WebSocket once authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    fetchNotifications();
    const socket = getSocket();

    const onConnect = () => {
      setSocketConnected(true);
      socket.emit('joinUser', user.id);
      if (activeWorkspace?.id) socket.emit('joinWorkspace', activeWorkspace.id);
      if (activeProject?.id) socket.emit('joinProject', activeProject.id);
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('task:created', applyRemoteTaskCreated);
    socket.on('task:updated', applyRemoteTaskUpdated);
    socket.on('task:statusChanged', (data: { taskId: string; status: any }) => {
      applyRemoteTaskStatusChanged(data.taskId, data.status);
    });
    socket.on('task:deleted', (data: { taskId: string }) => {
      applyRemoteTaskDeleted(data.taskId);
    });
    socket.on('comment:added', (data: { taskId: string; comment: any }) => {
      applyRemoteCommentAdded(data.taskId, data.comment);
    });
    socket.on('notification:new', pushLiveNotification);

    if (!socket.connected) {
      socket.connect();
    } else {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('task:created', applyRemoteTaskCreated);
      socket.off('task:updated', applyRemoteTaskUpdated);
      socket.off('task:statusChanged');
      socket.off('task:deleted');
      socket.off('comment:added');
      socket.off('notification:new', pushLiveNotification);
    };
  }, [
    isAuthenticated,
    user?.id,
    activeWorkspace?.id,
    activeProject?.id,
    fetchNotifications,
    setSocketConnected,
    applyRemoteTaskCreated,
    applyRemoteTaskUpdated,
    applyRemoteTaskStatusChanged,
    applyRemoteTaskDeleted,
    applyRemoteCommentAdded,
    pushLiveNotification,
  ]);

  // Room switching for workspace & project
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) return;
    if (activeWorkspace?.id) {
      socket.emit('joinWorkspace', activeWorkspace.id);
    }
    return () => {
      if (activeWorkspace?.id) socket.emit('leaveWorkspace', activeWorkspace.id);
    };
  }, [activeWorkspace?.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) return;
    if (activeProject?.id) {
      socket.emit('joinProject', activeProject.id);
    }
    return () => {
      if (activeProject?.id) socket.emit('leaveProject', activeProject.id);
    };
  }, [activeProject?.id]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900/95 border border-blue-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{toast.title}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{toast.message}</div>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-slate-500 hover:text-white p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
