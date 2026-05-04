import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, Clock, MessageSquare, Paperclip, Edit2, Trash2, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';
import { User } from '../types';
import { resolveAvatarUrl } from '../lib/avatar';

interface KanbanBoardProps {
  tasks: Task[];
  showHeader?: boolean;
  onAddTask?: () => void;
  onTaskClick?: (task: Task) => void;
  onMoveTask?: (taskId: string, status: Task['status']) => void | Promise<void>;
  onDeleteTask?: (task: Task) => void;
  currentUser?: User;
}

export default function KanbanBoard({ tasks, showHeader = true, onAddTask, onTaskClick, onMoveTask, onDeleteTask, currentUser }: KanbanBoardProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [hoveredColumnId, setHoveredColumnId] = useState<Task['status'] | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columns = [
    { id: 'Yapılacak', title: 'Yapılacaklar' },
    { id: 'Devam Ediyor', title: 'Devam Edenler' },
    { id: 'Tamamlandı', title: 'Tamamlananlar' },
    { id: 'Gecikti', title: 'Gecikenler' },
  ] as const;

  const canMoveTask = (task: Task) => Boolean(currentUser && (currentUser.role === 'Admin' || task.assignees.includes(currentUser.id)));

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Görevler (Kanban)</h1>
            <p className="mt-1 text-slate-500">Proje süreçlerini ve görev durumlarını buradan takip edebilirsiniz.</p>
            <p className="mt-1 text-xs font-medium text-slate-400">Kartları yalnızca admin veya göreve atanmış kullanıcılar taşıyabilir.</p>
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

      <motion.div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-4" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);
          return (
            <motion.div
              variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
              key={column.id}
              onDragOver={(event) => {
                event.preventDefault();
                setHoveredColumnId(column.id);
              }}
              onDragLeave={() => {
                if (hoveredColumnId === column.id) {
                  setHoveredColumnId(null);
                }
              }}
              onDrop={async (event) => {
                event.preventDefault();
                setHoveredColumnId(null);

                if (!draggingTaskId || draggingTaskId === '') {
                  return;
                }

                const draggedTask = tasks.find((task) => task.id === draggingTaskId);

                if (!draggedTask || !onMoveTask || draggedTask.status === column.id || !canMoveTask(draggedTask)) {
                  setDraggingTaskId(null);
                  return;
                }

                await onMoveTask(draggedTask.id, column.id);
                setDraggingTaskId(null);
              }}
              className={`flex h-[calc(100vh-220px)] flex-col gap-4 rounded-3xl bg-slate-50/60 p-4 ring-1 ring-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all lg:h-[calc(100vh-250px)] ${
                hoveredColumnId === column.id ? 'ring-2 ring-indigo-300' : ''
              }`}
            >
              <div className="flex items-center justify-between px-2 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">{column.title}</h3>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-500 shadow-sm">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === `col-${column.id}` ? null : `col-${column.id}`)}
                    className={`p-1 transition-colors hover:text-slate-600 ${openMenuId === `col-${column.id}` ? 'text-indigo-600' : 'text-slate-400'}`}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>

                  <AnimatePresence>
                    {openMenuId === `col-${column.id}` && (
                      <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1 shadow-xl"
                      >
                        <button
                          onClick={() => {
                            onAddTask?.();
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <Plus className="h-4 w-4" />
                          Görev Ekle
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                          onClick={() => {
                            // Logic to clear column could be implemented here if needed
                            setOpenMenuId(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Sütunu Temizle
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-6 pt-1">
                <AnimatePresence mode="popLayout">
                  {columnTasks.map((task) => (
                    <motion.div
                      layout
                      layoutId={`task-${task.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                    draggable={canMoveTask(task)}
                    onDragStart={() => {
                      if (canMoveTask(task)) {
                        setDraggingTaskId(task.id);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggingTaskId(null);
                      setHoveredColumnId(null);
                    }}
                    className={`group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md hover:ring-1 hover:ring-indigo-100 ${
                      canMoveTask(task) ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                    } ${draggingTaskId === task.id ? 'opacity-50 ring-2 ring-indigo-400 scale-95' : ''}`}
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
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === `task-${task.id}` ? null : `task-${task.id}`);
                          }}
                          className={`rounded-lg p-1 transition-colors ${openMenuId === `task-${task.id}` ? 'bg-slate-100 text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        <AnimatePresence>
                          {openMenuId === `task-${task.id}` && (
                            <motion.div
                              ref={menuRef}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-100 bg-white p-1 shadow-xl"
                            >
                              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 mb-1">Görev İşlemleri</p>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Open details/edit
                                  onTaskClick?.(task);
                                  setOpenMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                              >
                                <Edit2 className="h-4 w-4 text-indigo-500" />
                                Düzenle
                              </button>

                              <div className="my-1 border-t border-slate-50" />
                              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Durumu Değiştir</p>
                              
                              {columns.filter(c => c.id !== task.status).map(c => (
                                <button
                                  key={c.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveTask?.(task.id, c.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                                >
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" />
                                    {c.title}
                                  </div>
                                </button>
                              ))}

                              <div className="my-1 border-t border-slate-50" />
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTask?.(task);
                                  setOpenMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Sil
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <h4 className="mb-1 font-bold text-slate-900 transition-colors group-hover:text-indigo-600">{task.title}</h4>
                    <p className="mb-4 line-clamp-2 text-sm text-slate-500">{task.description}</p>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                      <div className="flex -space-x-2">
                        {task.assignees.map((userId, index) => (
                          <img
                            key={`${task.id}-${userId}-${index}`}
                            src={resolveAvatarUrl(userId, 32)}
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
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button
                  onClick={onAddTask}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-transparent py-3.5 text-sm font-bold text-slate-400 transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600"
                >
                  <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Yeni Görev Ekle
                </button>

              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
