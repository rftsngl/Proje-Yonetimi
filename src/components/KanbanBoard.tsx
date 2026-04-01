import { MoreHorizontal, Plus, Clock, MessageSquare, Paperclip } from 'lucide-react';
import { Task } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  showHeader?: boolean;
  onAddTask?: () => void;
  onTaskClick?: (task: Task) => void;
}

export default function KanbanBoard({ tasks, showHeader = true, onAddTask, onTaskClick }: KanbanBoardProps) {
  const columns = [
    { id: 'Yapılacak', title: 'Yapılacaklar' },
    { id: 'Devam Ediyor', title: 'Devam Edenler' },
    { id: 'Tamamlandı', title: 'Tamamlananlar' },
  ] as const;

  return (
    <div className="animate-in slide-in-from-bottom-4 space-y-6 duration-500 fade-in">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Görevler (Kanban)</h1>
            <p className="mt-1 text-slate-500">Proje süreçlerini ve görev durumlarını buradan takip edebilirsiniz.</p>
          </div>
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5" />
            Yeni Görev
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);
          return (
            <div key={column.id} className="flex min-h-[500px] flex-col gap-4 rounded-2xl bg-slate-100/50 p-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">{column.title}</h3>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-500 shadow-sm">
                    {columnTasks.length}
                  </span>
                </div>
                <button className="p-1 text-slate-400 transition-colors hover:text-slate-600">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === 'Yüksek'
                            ? 'bg-rose-50 text-rose-600'
                            : task.priority === 'Orta'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <button className="text-slate-300 transition-colors group-hover:text-slate-500">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>

                    <h4 className="mb-1 font-bold text-slate-900 transition-colors group-hover:text-indigo-600">{task.title}</h4>
                    <p className="mb-4 line-clamp-2 text-sm text-slate-500">{task.description}</p>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                      <div className="flex -space-x-2">
                        {task.assignees.map((userId, index) => (
                          <img
                            key={`${task.id}-${userId}-${index}`}
                            src={`https://picsum.photos/seed/${userId}/32/32`}
                            alt={task.assigneeNames[index] || 'Kullanıcı'}
                            className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-slate-400">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span className="text-[10px] font-medium">{task.comments}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          <span className="text-[10px] font-medium">{task.attachments}</span>
                        </div>
                        <div className="ml-1 flex items-center gap-1 text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px] font-bold">{task.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={onAddTask}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-400 transition-all hover:border-indigo-200 hover:bg-white hover:text-indigo-600"
                >
                  <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Görev Ekle
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
