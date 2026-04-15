import React, { useEffect, useState } from 'react';
import { X, Calendar, Flag, User, Briefcase, AlignLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CreateTaskPayload, Project, Task, User as AppUser } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateTaskPayload) => Promise<void>;
  projects: Project[];
  tasks: Task[];
  members: AppUser[];
  initialTask?: Task | null;
  presetParentTask?: Task | null;
}

const initialState = {
  title: '',
  description: '',
  projectId: '',
  parentTaskId: '',
  assigneeId: '',
  startDate: '',
  dueDate: '',
  priority: 'Orta' as const,
};

const normalizeDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '');

export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreate,
  projects,
  tasks,
  members,
  initialTask,
  presetParentTask,
}: CreateTaskModalProps) {
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setForm({
          title: initialTask.title,
          description: initialTask.description,
          projectId: initialTask.projectId,
          parentTaskId: initialTask.parentTaskId || '',
          assigneeId: initialTask.assignees[0] || members[0]?.id || '',
          startDate: normalizeDateInput(initialTask.startDate),
          dueDate: normalizeDateInput(initialTask.dueDate),
          priority: initialTask.priority,
        });
      } else {
        setForm({
          ...initialState,
          projectId: presetParentTask?.projectId || projects[0]?.id || '',
          parentTaskId: presetParentTask?.id || '',
          assigneeId: members[0]?.id || '',
        });
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, projects, members, initialTask, presetParentTask]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate({
        title: form.title,
        description: form.description,
        projectId: form.projectId,
        parentTaskId: form.parentTaskId || undefined,
        assigneeIds: [form.assigneeId],
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
        priority: form.priority,
      });
      setForm(initialState);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Görev oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableParentTasks = tasks.filter(
    (task) => task.projectId === form.projectId && task.id !== initialTask?.id,
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">
                {initialTask ? 'Görevi Düzenle' : 'Yeni Görev Oluştur'}
              </h2>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-5 p-6" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <AlignLeft className="h-4 w-4 text-slate-400" />
                  Görev Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Örn: Tasarım revizelerini tamamla"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <AlignLeft className="h-4 w-4 text-slate-400" />
                  Açıklama
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Görev detaylarını buraya yazın..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    Proje
                  </label>
                  <select
                    value={form.projectId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, projectId: event.target.value, parentTaskId: '' }))
                    }
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    Üst Görev (Opsiyonel)
                  </label>
                  <select
                    value={form.parentTaskId}
                    onChange={(event) => setForm((current) => ({ ...current, parentTaskId: event.target.value }))}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Kök görev (üst görev yok)</option>
                    {availableParentTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.wbsCode ? `${task.wbsCode} - ` : ''}{task.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <User className="h-4 w-4 text-slate-400" />
                    Atanan Kişi
                  </label>
                  <select
                    value={form.assigneeId}
                    onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value }))}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Flag className="h-4 w-4 text-slate-400" />
                    Öncelik
                  </label>
                  <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                    {(['Düşük', 'Orta', 'Yüksek'] as const).map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, priority }))}
                        className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                          form.priority === priority
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !projects.length || !members.length}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Kaydediliyor...' : initialTask ? 'Değişiklikleri Kaydet' : 'Görevi Oluştur'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
