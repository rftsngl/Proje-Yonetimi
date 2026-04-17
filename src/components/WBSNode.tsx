import { TaskTreeItem } from '../types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface WBSNodeProps {
  key?: string;
  item: TaskTreeItem;
  level?: number;
  collapsedNodeIds: string[];
  onToggle: (nodeId: string) => void;
}

const statusStyles: Record<TaskTreeItem['status'], string> = {
  Yapılacak: 'bg-slate-100 text-slate-600 border-slate-200',
  'Devam Ediyor': 'bg-blue-50 text-blue-700 border-blue-200',
  Tamamlandı: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Gecikti: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function WBSNode({ item, level = 0, collapsedNodeIds, onToggle }: WBSNodeProps) {
  const hasChildren = (item.children?.length || 0) > 0;
  const isCollapsed = collapsedNodeIds.includes(item.id);
  const depthStyle =
    level === 0
      ? 'border-indigo-200 bg-indigo-50/30'
      : level === 1
        ? 'border-slate-200 bg-white'
        : 'border-slate-200/90 bg-slate-50/60';

  return (
    <div className="relative">
      {level > 0 && <div className="pointer-events-none absolute -left-5 top-0 h-full w-px bg-slate-200" />}

      <div className="relative">
        {level > 0 && <div className="pointer-events-none absolute -left-5 top-6 h-px w-5 bg-slate-200" />}
        <div className={`rounded-2xl border p-4 shadow-sm transition-colors ${depthStyle}`}>
          <div className="flex items-start gap-2">
            {hasChildren ? (
              <button
                onClick={() => onToggle(item.id)}
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                title={isCollapsed ? 'Alt görevleri aç' : 'Alt görevleri kapat'}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            ) : (
              <span className="inline-block h-6 w-6 shrink-0 rounded-md border border-dashed border-slate-200 bg-white/60" />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start gap-2">
                <span className="shrink-0 rounded-md bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-800">{item.wbsCode || '-'}</span>
                <p className="min-w-[180px] flex-1 break-words text-sm font-semibold leading-5 text-slate-900">{item.title}</p>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusStyles[item.status]}`}>{item.status}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-1.5 py-0.5">Seviye {level + 1}</span>
                {item.assigneeNames?.[0] ? <span>Atanan: {item.assigneeNames[0]}</span> : <span>Atanan: -</span>}
                {item.date ? <span>Tarih: {item.date}</span> : <span>Tarih: -</span>}
                {hasChildren && <span>Alt görev: {item.children.length}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-9 mt-3 space-y-3 overflow-hidden border-l border-slate-200 pl-4"
          >
            {item.children.map((child) => (
              <WBSNode
                key={child.id}
                item={child}
                level={level + 1}
                collapsedNodeIds={collapsedNodeIds}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
