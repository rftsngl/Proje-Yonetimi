import { ChevronRight, Download, Edit2, Filter, MoreVertical, Plus, Search, Trash2 } from 'lucide-react';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  onAddTask?: () => void;
  onTaskClick?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  canManageTasks?: boolean;
}

const statusStyles = {
  Yapılacak: 'bg-slate-100 text-slate-600 border-slate-200',
  'Devam Ediyor': 'bg-blue-50 text-blue-600 border-blue-100',
  Tamamlandı: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Gecikti: 'bg-rose-50 text-rose-600 border-rose-100',
};

export default function TaskList({ tasks, onAddTask, onTaskClick, onEditTask, onDeleteTask, canManageTasks }: TaskListProps) {
  return (
    <div className="animate-in overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm duration-500 fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-4 border-b border-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm leading-5 placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Görevlerde ara..."
          />
        </div>

        <div className="flex items-center gap-2">
          {canManageTasks && (
            <button
              onClick={onAddTask}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-100 transition-all active:scale-95 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Yeni Görev
            </button>
          )}
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filtrele
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Dışa Aktar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Görev ID</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Görev Adı</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Proje</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Atanan Kişi</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Durum</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Bitiş Tarihi</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tasks.map((task) => (
              <tr key={task.id} onClick={() => onTaskClick?.(task)} className="group cursor-pointer transition-colors hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">{task.id}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-semibold text-slate-900">{task.title}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-slate-500">{task.project}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://picsum.photos/seed/${task.assignees[0] || task.id}/32/32`}
                      alt="Assignee"
                      className="h-6 w-6 rounded-full border border-white shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-sm text-slate-700">{task.assigneeNames[0] || 'Atanmadı'}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusStyles[task.status]}`}>
                    {task.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-slate-600">{task.date || '-'}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  {canManageTasks ? (
                    <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onEditTask?.(task);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteTask?.(task);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="group-hover:hidden">
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
