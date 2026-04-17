import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Project, TaskTreeItem } from '../types';
import { getTaskTree } from '../services/dashboard';
import WBSNode from './WBSNode';
import { sortTaskTreeByWbs } from '../lib/wbs';

interface WBSDiagramProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WBSDiagram({ project, isOpen, onClose }: WBSDiagramProps) {
  const [items, setItems] = useState<TaskTreeItem[]>([]);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleNode = (nodeId: string) => {
    setCollapsedNodeIds((current) => (current.includes(nodeId) ? current.filter((id) => id !== nodeId) : [...current, nodeId]));
  };

  const countNodes = (nodes: TaskTreeItem[]): number =>
    nodes.reduce((total, node) => total + 1 + countNodes(node.children || []), 0);

  const totalNodeCount = countNodes(items);
  const hasCollapsedNodes = collapsedNodeIds.length > 0;

  useEffect(() => {
    if (!isOpen || !project) {
      return;
    }

    let cancelled = false;

    const loadWbs = async () => {
      setIsLoading(true);
      setError(null);
      setCollapsedNodeIds([]);
      try {
        const response = await getTaskTree(project.id);
        if (!cancelled) {
          setItems(sortTaskTreeByWbs(response.items || []));
        }
      } catch (loadError) {
        if (!cancelled) {
          setItems([]);
          setError(loadError instanceof Error ? loadError.message : 'WBS şeması yüklenemedi.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadWbs();

    return () => {
      cancelled = true;
    };
  }, [isOpen, project]);

  if (!project) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">WBS Şeması</h2>
                <p className="text-sm text-slate-500">{project.name}</p>
              </div>
              <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-2.5 text-xs text-slate-500">
              <span>Toplam görev: {totalNodeCount}</span>
              {hasCollapsedNodes && (
                <button
                  onClick={() => setCollapsedNodeIds([])}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Tümünü Genişlet
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto p-6">
              {isLoading && (
                <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/60">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                  <p className="mt-3 text-sm font-medium text-slate-500">WBS yapısı yükleniyor...</p>
                </div>
              )}

              {!isLoading && error && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/60 px-5 py-12 text-center">
                  <AlertCircle className="h-8 w-8 text-rose-500" />
                  <p className="mt-3 text-sm font-semibold text-rose-700">WBS verisi yüklenemedi.</p>
                  <p className="mt-1 text-xs text-rose-600">{error}</p>
                </div>
              )}

              {!isLoading && !error && items.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-slate-700">Bu projede hiyerarşik görev yapısı bulunmuyor.</p>
                  <p className="mt-1 text-xs text-slate-500">WBS görünümü için proje altında görevler tanımlanmalıdır.</p>
                </div>
              )}

              {!isLoading && !error && items.length > 0 && (
                <div className="space-y-3">
                  {items.map((item) => (
                    <WBSNode key={item.id} item={item} collapsedNodeIds={collapsedNodeIds} onToggle={toggleNode} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5" />
                  Kapalı düğüm
                </span>
                <span className="inline-flex items-center gap-1">
                  <ChevronDown className="h-3.5 w-3.5" />
                  Açık düğüm
                </span>
              </div>
              <span>Salt okunur görünüm</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
