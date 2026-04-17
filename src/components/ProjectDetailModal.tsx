import { Project, Task, User } from '../types';
import { resolveAvatarUrl } from '../lib/avatar';
import { X, Clock, Briefcase, Trash2, Edit2, ExternalLink, Target, BarChart3, UserPlus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  tasks: Task[];
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onViewAllTasks?: (project: Project) => void;
  onOpenWbs?: (project: Project) => void;
  onAddMember?: (project: Project, userId: string) => Promise<void>;
}

export default function ProjectDetailModal({
  project,
  isOpen,
  onClose,
  users,
  tasks,
  onEdit,
  onDelete,
  onViewAllTasks,
  onOpenWbs,
  onAddMember,
}: ProjectDetailModalProps) {
  if (!project) {
    return null;
  }

  const teamMembers = users.filter((user) => project.team.includes(user.id));
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  const availableUsers = useMemo(
    () => users.filter((user) => !project.team.includes(user.id)),
    [users, project.team],
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId(availableUsers[0]?.id || '');
      setIsAddMemberOpen(false);
      setIsSavingMember(false);
    }
  }, [isOpen, availableUsers]);

  const handleAddMember = async () => {
    if (!selectedUserId || !onAddMember) {
      return;
    }

    setIsSavingMember(true);
    try {
      await onAddMember(project, selectedUserId);
      setIsAddMemberOpen(false);
    } finally {
      setIsSavingMember(false);
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
                <div
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    project.status === 'Aktif' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {project.status}
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{project.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit?.(project)}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700"
                >
                  <Edit2 className="h-4 w-4" />
                  Düzenle
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
                <div className="space-y-10 lg:col-span-2">
                  <div>
                    <h2 className="text-4xl font-bold leading-tight text-slate-900">{project.name}</h2>
                    <p className="mt-2 text-lg font-medium text-slate-500">{project.category}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                        <Target className="h-5 w-5 text-indigo-600" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">İlerleme</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">%{project.progress}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                        <Clock className="h-5 w-5 text-rose-600" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Kalan Süre</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{project.daysLeft} Gün</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Görevler</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{projectTasks.length}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900">Proje Hakkında</h3>
                    <p className="text-lg leading-relaxed text-slate-600">{project.description}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900">Proje Görevleri</h3>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onOpenWbs?.(project)}
                          className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                        >
                          WBS Şeması
                        </button>
                        <button
                          onClick={() => onViewAllTasks?.(project)}
                          className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:underline"
                        >
                          Tümünü Gör <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {projectTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-indigo-200"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                task.status === 'Tamamlandı'
                                  ? 'bg-emerald-500'
                                  : task.status === 'Devam Ediyor'
                                    ? 'bg-blue-500'
                                    : 'bg-slate-300'
                              }`}
                            />
                            <div>
                              <p className="text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600">{task.title}</p>
                              <p className="text-xs font-medium text-slate-400">{task.date}</p>
                            </div>
                          </div>
                          <span
                            className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              task.priority === 'Yüksek' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Proje Yöneticisi</h4>
                    <div className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                      <img
                        src={resolveAvatarUrl(project.managerAvatar, 48)}
                        alt={project.manager}
                        className="h-12 w-12 rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{project.manager}</p>
                        <p className="text-xs font-medium text-slate-500">Proje Lideri</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Ekip ({teamMembers.length})</h4>
                      <button
                        onClick={() => setIsAddMemberOpen((current) => !current)}
                        className="rounded-lg p-1.5 text-indigo-600 transition-all hover:bg-indigo-50"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                    {isAddMemberOpen && (
                      <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <select
                          value={selectedUserId}
                          onChange={(event) => setSelectedUserId(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {availableUsers.length ? (
                            availableUsers.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))
                          ) : (
                            <option value="">Eklenebilecek kullanıcı kalmadı</option>
                          )}
                        </select>
                        <button
                          onClick={handleAddMember}
                          disabled={!availableUsers.length || !selectedUserId || isSavingMember}
                          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSavingMember ? 'Ekleniyor...' : 'Ekibe Ekle'}
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-3">
                      {teamMembers.map((user) => (
                        <div key={user.id} className="group relative">
                          <img
                            src={resolveAvatarUrl(user.avatar, 40)}
                            alt={user.name}
                            className="h-10 w-10 cursor-pointer rounded-xl border-2 border-white shadow-sm transition-transform hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                            {user.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">İstatistikler</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-500">Bütçe Kullanımı</span>
                        <span className="font-bold text-slate-900">%42</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[42%] rounded-full bg-indigo-500" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-500">Zaman Sapması</span>
                        <span className="font-bold text-rose-600">+2 Gün</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-10">
                    <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">
                      <Briefcase className="h-4 w-4" />
                      Proje Raporu Al
                    </button>
                    <button
                      onClick={() => onDelete?.(project)}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Projeyi Sil
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
