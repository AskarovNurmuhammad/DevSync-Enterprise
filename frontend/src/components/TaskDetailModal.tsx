'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore, TaskStatus, TaskPriority } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import {
  X,
  Trash2,
  Paperclip,
  MessageSquare,
  Send,
  Upload,
  FileText,
  Download,
  User,
  Save,
  Loader2,
  Clock,
} from 'lucide-react';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace('/api/v1', '');

export default function TaskDetailModal() {
  const {
    selectedTask,
    isDetailLoading,
    closeTaskDetail,
    updateTask,
    deleteTask,
    addComment,
    deleteComment,
    uploadAttachment,
    deleteAttachment,
  } = useWorkspaceStore();

  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || '');
    }
  }, [selectedTask]);

  if (!selectedTask && !isDetailLoading) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSaveDetails = async () => {
    if (!selectedTask || !title.trim()) return;
    setIsSaving(true);
    await updateTask(selectedTask.id, { title, description });
    setIsSaving(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;
    setIsSendingComment(true);
    const ok = await addComment(selectedTask.id, commentText.trim());
    if (ok) setCommentText('');
    setIsSendingComment(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTask) return;
    setIsUploading(true);
    await uploadAttachment(selectedTask.id, file);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    if (window.confirm('Ushbu vazifani butunlay o‘chirishni tasdiqlaysizmi?')) {
      await deleteTask(selectedTask.id);
    }
  };

  const members = selectedTask?.project?.workspace?.members || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
      <div className="bg-[#0d131f] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {isDetailLoading && !selectedTask ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <span className="text-xs">Vazifa tafsilotlari yuklanmoqda...</span>
          </div>
        ) : selectedTask ? (
          <>
            {/* Top Bar */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/30">
                  {selectedTask.project?.key}-{selectedTask.taskNumber}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(selectedTask.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteTask}
                  title="Vazifani o'chirish"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={closeTaskDetail}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Left 2 cols: Title, Description, Attachments, Comments */}
              <div className="lg:col-span-2 p-6 space-y-6">
                {/* Editable Title & Description */}
                <div className="space-y-3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-lg font-bold text-white bg-transparent border border-transparent hover:border-slate-800 focus:border-blue-500 focus:bg-slate-950/60 rounded-xl px-3 py-1.5 focus:outline-none transition-all"
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Vazifa tavsifini kiriting..."
                    rows={4}
                    className="w-full text-sm text-slate-300 bg-slate-950/40 border border-slate-800/80 focus:border-blue-500 rounded-xl p-3 focus:outline-none transition-all resize-y"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveDetails}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      O‘zgarishlarni saqlash
                    </button>
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                      Biriktirilgan Fayllar ({selectedTask.attachments?.length || 0})
                    </h4>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Fayl yuklash
                    </button>
                  </div>

                  {!selectedTask.attachments || selectedTask.attachments.length === 0 ? (
                    <div className="text-xs text-slate-500 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-4 text-center">
                      Hozircha fayl biriktirilmagan (max 10 MB)
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedTask.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <div className="truncate">
                              <div className="text-slate-200 font-medium truncate">{att.fileName}</div>
                              <div className="text-[10px] text-slate-500">{formatBytes(att.fileSize)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <a
                              href={`${API_BASE}${att.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800"
                              title="Yuklab olish"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            {att.uploaderId === user?.id && (
                              <button
                                onClick={() => deleteAttachment(selectedTask.id, att.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                                title="O'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="pt-4 border-t border-slate-800/80">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Muhokama va Izohlar ({selectedTask.comments?.length || 0})
                  </h4>

                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                    {!selectedTask.comments || selectedTask.comments.length === 0 ? (
                      <div className="text-xs text-slate-500 py-2">
                        Hozircha izohlar yo‘q. Birinchi bo‘lib fikr qoldiring!
                      </div>
                    ) : (
                      selectedTask.comments.map((c) => (
                        <div key={c.id} className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold">
                                {c.user.firstName?.[0]}
                              </div>
                              <span className="text-xs font-semibold text-slate-200">
                                {c.user.firstName} {c.user.lastName}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {c.userId === user?.id && (
                              <button
                                onClick={() => deleteComment(selectedTask.id, c.id)}
                                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                title="Izohni o'chirish"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap pl-8">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Izoh yozing..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={isSendingComment || !commentText.trim()}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Yuborish
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Sidebar: Metadata Controls */}
              <div className="p-6 space-y-5 bg-slate-900/20">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Holat (Status)
                  </label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => updateTask(selectedTask.id, { status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">Bajarilishi kerak</option>
                    <option value="IN_PROGRESS">Jarayonda</option>
                    <option value="IN_REVIEW">Tekshiruvda</option>
                    <option value="DONE">Bajarildi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Ustuvorlik (Priority)
                  </label>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => updateTask(selectedTask.id, { priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Oddiy (Low)</option>
                    <option value="MEDIUM">O‘rta (Medium)</option>
                    <option value="HIGH">Yuqori (High)</option>
                    <option value="URGENT">Shoshilinch (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Mas‘ul Ijrochi (Assignee)
                  </label>
                  <select
                    value={selectedTask.assigneeId || ''}
                    onChange={(e) =>
                      updateTask(selectedTask.id, { assigneeId: e.target.value || null })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Biriktirilmagan</option>
                    {members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.firstName} {m.user.lastName} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Yaratuvchi:</span>
                    <span className="text-slate-200 font-medium flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-400" />
                      {selectedTask.creator?.firstName} {selectedTask.creator?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Loyiha:</span>
                    <span className="text-slate-200 font-medium">{selectedTask.project?.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
