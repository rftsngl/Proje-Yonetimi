import { ChevronDown, ChevronRight, Download, Edit2, Filter, MoreVertical, Plus, Search, Trash2, Check, X } from 'lucide-react';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';
import { resolveAvatarUrl } from '../lib/avatar';

interface TaskListProps {
  tasks: Task[];
  onAddTask?: () => void;
  onAddSubtask?: (task: Task) => void;
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

const allStatuses = ['Yapılacak', 'Devam Ediyor', 'Tamamlandı', 'Gecikti'];

export default function TaskList({
  tasks,
  onAddTask,
  onAddSubtask,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  canManageTasks,
}: TaskListProps) {
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<string[]>([]);
  const [taskScope, setTaskScope] = useState<'all' | 'root'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { orderedTasks, childrenByParent } = useMemo(() => {
    const taskIdSet = new Set(tasks.map((task) => task.id));
    const childrenByParentMap = new Map<string, Task[]>();

    for (const task of tasks) {
      const parentKey = task.parentTaskId && taskIdSet.has(task.parentTaskId) ? task.parentTaskId : 'ROOT';
      childrenByParentMap.set(parentKey, [...(childrenByParentMap.get(parentKey) || []), task]);
    }

    const flattenByHierarchy = (parentId: string, level = 0): Array<{ task: Task; level: number }> => {
      const siblings = [...(childrenByParentMap.get(parentId) || [])].sort((left, right) =>
        (left.wbsCode || left.id).localeCompare(right.wbsCode || right.id),
      );

      return siblings.flatMap((task) => [{ task, level }, ...flattenByHierarchy(task.id, level + 1)]);
    };

    return {
      orderedTasks: flattenByHierarchy('ROOT'),
      childrenByParent: childrenByParentMap,
    };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    return orderedTasks.filter(({ task, level }) => {
      // 1. Status Filter
      if (statusFilter && task.status !== statusFilter) {
        return false;
      }

      // 2. Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          task.title.toLowerCase().includes(query) ||
          task.id.toLowerCase().includes(query) ||
          (task.project || '').toLowerCase().includes(query) ||
          (task.assigneeNames || []).some((name) => name.toLowerCase().includes(query));

        if (!matches) {
          return false;
        }
      }

      // 3. Scope filter (root tasks only)
      if (taskScope === 'root' && level > 0) {
        return false;
      }

      // 4. Collapsed parents filter
      let parentId = task.parentTaskId;
      while (parentId) {
        if (collapsedTaskIds.includes(parentId)) {
          return false;
        }
        const parent = tasks.find((item) => item.id === parentId);
        parentId = parent?.parentTaskId || null;
      }
      return true;
    });
  }, [collapsedTaskIds, orderedTasks, taskScope, tasks, searchQuery, statusFilter]);

  const toggleCollapsed = (taskId: string) => {
    setCollapsedTaskIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  };

  const handleExport = () => {
    setIsExporting(true);
    
    // Create CSV content
    const headers = ['ID', 'Gorev Adi', 'Proje', 'Atanan Kisi', 'Durum', 'Bitis Tarihi'];
    const rows = visibleTasks.map(({ task }) => [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${(task.project || '').replace(/"/g, '""')}"`,
      `"${(task.assigneeNames?.[0] || '').replace(/"/g, '""')}"`,
      task.status,
      task.date || '-'
    ]);

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Add BOM for Excel Turkish characters
    const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gorev_listesi_${new Date().toISOString().split('T')[0]}.csv`);
    
    setTimeout(() => {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 1000); // Small delay for UX feel
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-4 border-b border-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className={`h-4 w-4 transition-colors ${searchQuery ? 'text-indigo-500' : 'text-slate-400'}`} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm leading-5 placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            placeholder="Görevlerde ara (ID, başlık, kişi...)"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setTaskScope('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                taskScope === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Tüm Görevler
            </button>
            <button
              onClick={() => setTaskScope('root')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                taskScope === 'root' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Kök Görevler
            </button>
          </div>

          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                statusFilter 
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600' 
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden lg:inline">{statusFilter || 'Filtrele'}</span>
              {statusFilter && (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 p-0.5 text-[10px] text-white">
                  1
                </div>
              )}
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl"
                >
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Duruma Göre Filtrele</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setStatusFilter(null); setIsFilterOpen(false); }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${!statusFilter ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      Bütün Durumlar
                      {!statusFilter && <Check className="h-4 w-4" />}
                    </button>
                    {allStatuses.map(status => (
                      <button
                        key={status}
                        onClick={() => { setStatusFilter(status); setIsFilterOpen(false); }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${statusFilter === status ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {status}
                        {statusFilter === status && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-all active:scale-95 hover:bg-slate-50 ${isExporting ? 'cursor-wait opacity-50' : ''}`}
          >
            {isExporting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" /> : <Download className="h-4 w-4" />}
            <span className="hidden lg:inline">{isExporting ? 'Aktarılıyor...' : 'Dışa Aktar'}</span>
          </button>

          {canManageTasks && (
            <button
              onClick={onAddTask}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-100 transition-all active:scale-95 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni Görev</span>
            </button>
          )}
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
            <AnimatePresence mode="popLayout">
              {visibleTasks.length > 0 ? (
                visibleTasks.map(({ task, level }, index) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ 
                      duration: 0.2,
                      delay: Math.min(index * 0.02, 0.3) 
                    }}
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">{task.id}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div 
                        className="flex items-center gap-2 pl-[var(--indent)]" 
                        style={{ '--indent': `${level * 14}px` } as React.CSSProperties}
                      >
                        {childrenByParent.has(task.id) ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleCollapsed(task.id);
                            }}
                            className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          >
                            {collapsedTaskIds.includes(task.id) ? (
                              <ChevronRight className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : (
                          <span className="w-4" />
                        )}
                        {task.wbsCode && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{task.wbsCode}</span>
                        )}
                        <div className="text-sm font-semibold text-slate-900">{task.title}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-slate-500">{task.project}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={resolveAvatarUrl(task.assignees[0] || task.id, 32)}
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
                              onAddSubtask?.(task);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600"
                            title="Alt Görev Ekle"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
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
                  </motion.tr>
                ))
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                      <Search className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-slate-900">Sonuç Bulunamadı</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {statusFilter || searchQuery 
                        ? 'Filtreleme kriterlerinize uygun görev bulunamadı.' 
                        : 'Henüz bir görev bulunmuyor.'}
                    </p>
                    {(statusFilter || searchQuery) && (
                      <button 
                        onClick={() => { setSearchQuery(''); setStatusFilter(null); }}
                        className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        Filtreleri Temizle
                      </button>
                    )}
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
