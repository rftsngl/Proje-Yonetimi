import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { Task, TaskComment, User } from '../types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit2,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Share2,
  Trash2,
  Upload,
  UserMinus,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  allTasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onNavigateToTask?: (task: Task) => void;
  onAddComment?: (task: Task, content: string) => Promise<void>;
  onUpdateComment?: (task: Task, commentId: string, content: string) => Promise<void>;
  onDeleteComment?: (task: Task, commentId: string) => Promise<void>;
  onAddAssignee?: (task: Task, userId: string) => Promise<void>;
  onRemoveAssignee?: (task: Task, userId: string) => Promise<void>;
  onAddAttachment?: (task: Task, file: File) => Promise<void>;
}

const getPriorityClasses = (priority: Task['priority']) => {
  if (priority === 'Orta') {
    return 'bg-amber-50 text-amber-600';
  }

  if (priority.toLowerCase().includes('d')) {
    return 'bg-emerald-50 text-emerald-600';
  }

  return 'bg-rose-50 text-rose-600';
};

const getAttachmentUrl = (url?: string | null) => {
  if (!url) {
    return null;
  }

  return url.startsWith('http') ? url : url;
};

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
  users,
  allTasks,
  onEdit,
  onDelete,
  onNavigateToTask,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onAddAssignee,
  onRemoveAssignee,
  onAddAttachment,
}: TaskDetailModalProps) {
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [isSavingCommentEdit, setIsSavingCommentEdit] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isAddAssigneeOpen, setIsAddAssigneeOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [isSubmittingAssignee, setIsSubmittingAssignee] = useState(false);
  const [removingAssigneeId, setRemovingAssigneeId] = useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const assignees = useMemo(() => {
    if (!task) {
      return [];
    }

    return users.filter((user) => task.assignees.includes(user.id));
  }, [task, users]);

  const availableUsers = useMemo(() => {
    if (!task) {
      return [];
    }

    return users.filter((user) => !task.assignees.includes(user.id));
  }, [task, users]);

  const parentTask = useMemo(() => {
    if (!task?.parentTaskId) {
      return null;
    }

    return allTasks.find((item) => item.id === task.parentTaskId) || null;
  }, [allTasks, task?.parentTaskId]);

  const subTasks = useMemo(() => {
    if (!task) {
      return [];
    }

    return allTasks.filter((item) => item.parentTaskId === task.id);
  }, [allTasks, task]);

  if (!task) {
    return null;
  }

  const handleCommentSubmit = async () => {
    if (!comment.trim() || !onAddComment) {
      return;
    }

    setIsSubmittingComment(true);
    try {
      await onAddComment(task, comment.trim());
      setComment('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAddAssignee = async () => {
    if (!selectedAssigneeId || !onAddAssignee) {
      return;
    }

    setIsSubmittingAssignee(true);
    try {
      await onAddAssignee(task, selectedAssigneeId);
      setSelectedAssigneeId('');
      setIsAddAssigneeOpen(false);
    } finally {
      setIsSubmittingAssignee(false);
    }
  };

  const handleRemoveAssignee = async (userId: string) => {
    if (!onRemoveAssignee) {
      return;
    }

    setRemovingAssigneeId(userId);
    try {
      await onRemoveAssignee(task, userId);
    } finally {
      setRemovingAssigneeId(null);
    }
  };

  const handleAttachmentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !onAddAttachment) {
      return;
    }

    setIsUploadingAttachment(true);
    try {
      await onAddAttachment(task, file);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const startCommentEdit = (item: TaskComment) => {
    setEditingCommentId(item.id);
    setEditingCommentContent(item.content);
  };

  const cancelCommentEdit = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const saveCommentEdit = async () => {
    if (!editingCommentId || !editingCommentContent.trim() || !onUpdateComment) {
      return;
    }

    setIsSavingCommentEdit(true);
    try {
      await onUpdateComment(task, editingCommentId, editingCommentContent.trim());
      cancelCommentEdit();
    } finally {
      setIsSavingCommentEdit(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!onDeleteComment) {
      return;
    }

    const confirmed = window.confirm('Bu yorumu silmek istediginize emin misiniz?');
    if (!confirmed) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      await onDeleteComment(task, commentId);
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-indigo-900/10"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getPriorityClasses(task.priority)}`}>
                  {task.priority} Oncelik
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{task.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit?.(task)}
                  className="rounded-xl p-2 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600">
                  <Share2 className="h-5 w-5" />
                </button>
                <button className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600">
                  <MoreVertical className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="ml-2 rounded-xl p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                  <div>
                    <h2 className="text-3xl font-bold leading-tight text-slate-900">{task.title}</h2>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5">
                        <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-bold text-slate-700">{task.status}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-bold text-slate-700">{task.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Bağlantılar</h4>
                      <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proje</p>
                          <p className="text-sm font-semibold text-slate-900">{task.project}</p>
                          <p className="text-xs text-slate-500">Görev, bu proje altında takip ediliyor.</p>
                        </div>

                        <div className="h-px bg-slate-200" />

                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Üst Görev</p>
                          {parentTask ? (
                            <button
                              onClick={() => onNavigateToTask?.(parentTask)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50"
                            >
                              <p className="text-sm font-bold text-slate-900">{parentTask.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{parentTask.wbsCode || parentTask.id}</p>
                            </button>
                          ) : (
                            <p className="text-sm text-slate-500">Bu görev kök görevdir.</p>
                          )}
                        </div>

                        <div className="h-px bg-slate-200" />

                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alt Görevler</p>
                          {subTasks.length ? (
                            <div className="space-y-2">
                              {subTasks.map((childTask) => (
                                <button
                                  key={childTask.id}
                                  onClick={() => onNavigateToTask?.(childTask)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50"
                                >
                                  <p className="text-sm font-bold text-slate-900">{childTask.title}</p>
                                  <p className="mt-1 text-xs text-slate-500">{childTask.wbsCode || childTask.id}</p>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">Bu görevin henüz alt görevi yok.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">Aciklama</h3>
                    <p className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 leading-relaxed text-slate-600">
                      {task.description || 'Bu gorev icin henuz bir aciklama girilmemis.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                        <Paperclip className="h-5 w-5 text-slate-400" />
                        Ekler ({task.attachments})
                      </h3>
                      <div className="flex items-center gap-3">
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleAttachmentChange} />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAttachment}
                          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Upload className="h-4 w-4" />
                          {isUploadingAttachment ? 'Yukleniyor...' : 'Dosya Yukle'}
                        </button>
                      </div>
                    </div>

                    {task.attachmentsList.length ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {task.attachmentsList.map((attachment) => {
                          const attachmentUrl = getAttachmentUrl(attachment.url);

                          return (
                            <div
                              key={attachment.id}
                              className="rounded-2xl border border-slate-100 p-4 transition-all hover:bg-slate-50"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                                  {attachment.fileType}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-bold text-slate-900">{attachment.name}</p>
                                  <p className="text-xs text-slate-400">{attachment.fileSizeLabel}</p>
                                  {attachmentUrl ? (
                                    <a
                                      href={attachmentUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                    >
                                      <Download className="h-4 w-4" />
                                      Dosyayi Ac
                                    </a>
                                  ) : (
                                    <span className="mt-3 inline-flex text-xs font-medium text-slate-400">
                                      Bu kayit demo eki, indirilebilir dosya bagli degil.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                        Bu goreve henuz dokuman yuklenmedi. PDF, Word, Excel, gorsel veya baska bir dosya yukleyebilirsin.
                      </div>
                    )}
                  </div>

                  <div className="space-y-6 border-t border-slate-100 pt-8">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <MessageSquare className="h-5 w-5 text-slate-400" />
                      Yorumlar ({task.comments})
                    </h3>

                    <div className="space-y-6">
                      {task.commentsList.length ? (
                        task.commentsList.map((item) => (
                          <div key={item.id} className="flex gap-4">
                            <img
                              src={`https://picsum.photos/seed/${item.authorAvatar}/40/40`}
                              alt={item.authorName}
                              className="h-10 w-10 flex-shrink-0 rounded-full"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 rounded-2xl rounded-tl-none border border-slate-100 bg-slate-50 p-4">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <div>
                                  <span className="text-sm font-bold text-slate-900">{item.authorName}</span>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {item.time}
                                    {item.updatedAt ? ' • duzenlendi' : ''}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => startCommentEdit(item)}
                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-indigo-600"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(item.id)}
                                    disabled={deletingCommentId === item.id}
                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {editingCommentId === item.id ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={editingCommentContent}
                                    onChange={(event) => setEditingCommentContent(event.target.value)}
                                    className="min-h-[90px] w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  />
                                  <div className="flex justify-end gap-3">
                                    <button
                                      onClick={cancelCommentEdit}
                                      className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 transition-colors hover:bg-white"
                                    >
                                      Vazgec
                                    </button>
                                    <button
                                      onClick={saveCommentEdit}
                                      disabled={!editingCommentContent.trim() || isSavingCommentEdit}
                                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Kaydet
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed text-slate-600">{item.content}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                          Bu gorev icin henuz yorum yok. Ilk yorumu sen ekleyebilirsin.
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <img
                        src={`https://picsum.photos/seed/${users[0]?.avatar || 'user1'}/40/40`}
                        alt="User"
                        className="h-10 w-10 flex-shrink-0 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                      <div className="relative flex-1">
                        <textarea
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          placeholder="Bir yorum yazin..."
                          className="min-h-[100px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 pr-12 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button
                          onClick={handleCommentSubmit}
                          disabled={!comment.trim() || isSubmittingComment}
                          className="absolute bottom-4 right-4 rounded-xl bg-indigo-600 p-2 text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Sorumlular</h4>
                      <button
                        onClick={() => setIsAddAssigneeOpen((current) => !current)}
                        disabled={!availableUsers.length}
                        className="flex items-center gap-2 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        Uye Ekle
                      </button>
                    </div>

                    {isAddAssigneeOpen && (
                      <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                        <select
                          value={selectedAssigneeId}
                          onChange={(event) => setSelectedAssigneeId(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">Uye secin</option>
                          {availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} - {user.role}
                            </option>
                          ))}
                        </select>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setSelectedAssigneeId('');
                              setIsAddAssigneeOpen(false);
                            }}
                            className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 transition-colors hover:bg-white"
                          >
                            Vazgec
                          </button>
                          <button
                            onClick={handleAddAssignee}
                            disabled={!selectedAssigneeId || isSubmittingAssignee}
                            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Uyeyi Ekle
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {assignees.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:bg-slate-50">
                          <img
                            src={`https://picsum.photos/seed/${user.avatar}/36/36`}
                            alt={user.name}
                            className="h-9 w-9 rounded-full"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                            <p className="truncate text-xs text-slate-500">{user.role}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveAssignee(user.id)}
                            disabled={removingAssigneeId === user.id}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Uyeyi gorevden cikar"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      {!assignees.length && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                          Bu goreve atanmis ekip uyesi yok.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Zaman Cizelgesi</h4>
                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Başlangıç</p>
                          <p className="text-xs font-bold text-slate-900">{task.startDate || 'Belirlenmedi'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                          <Calendar className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Olusturulma</p>
                          <p className="text-xs font-bold text-slate-900">{task.commentsList[0]?.createdAt?.slice(0, 10) || '27 Mart 2026'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                          <Clock className="h-4 w-4 text-rose-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Son Tarih</p>
                          <p className="text-xs font-bold text-slate-900">{task.dueDate || task.date || 'Belirlenmedi'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-8">
                    <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">
                      <Copy className="h-4 w-4" />
                      Gorevi Kopyala
                    </button>
                    <button
                      onClick={() => onDelete?.(task)}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Gorevi Sil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
