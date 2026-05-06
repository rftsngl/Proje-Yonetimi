import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Trash2, Clock, Loader2, AlertCircle, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { getUserReports, deleteReportApi } from '../services/ai';
import { ReportListItem } from '../types';
import { resolveAvatarUrl } from '../lib/avatar';

interface ReportHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReport: (reportId: string) => void;
  isAdmin: boolean;
  filterProjectId?: string | null;
}

export default function ReportHistory({ isOpen, onClose, onViewReport, isAdmin, filterProjectId }: ReportHistoryProps) {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getUserReports();
      const filtered = filterProjectId ? items.filter(r => r.projectId === filterProjectId) : items;
      setReports(filtered);
    } catch (err) {
      console.error('Raporlar yüklenemedi:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterProjectId]);

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen, loadReports]);

  const handleDelete = async (reportId: string) => {
    setDeletingId(reportId);
    try {
      await deleteReportApi(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      console.error('Rapor silinemedi:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    pending: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      label: 'Hazırlanıyor',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    completed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: 'Tamamlandı',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    failed: {
      icon: <AlertCircle className="h-4 w-4" />,
      label: 'Başarısız',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 9998 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-indigo-600 shadow-lg shadow-slate-200">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Rapor Geçmişi</h2>
                  <p className="text-xs font-medium text-slate-500">{reports.length} rapor</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-500">Raporlar yükleniyor...</p>
                  </div>
                </div>
              ) : reports.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center space-y-3 p-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                    <Sparkles className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Henüz rapor oluşturulmamış</p>
                  <p className="text-xs text-slate-400">Proje detay sayfasından "Rapor Al" ile yeni bir rapor oluşturabilirsiniz.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {reports.map((report, index) => {
                    const status = statusConfig[report.status] || statusConfig.pending;
                    return (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                      >
                        {/* Avatar */}
                        <img
                          src={resolveAvatarUrl(report.createdByAvatar, 36)}
                          alt={report.createdByName}
                          className="h-9 w-9 shrink-0 rounded-xl"
                          referrerPolicy="no-referrer"
                        />

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900">{report.title}</p>
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.bg} ${status.color}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(report.createdAt)}
                            </span>
                            {report.projectName && (
                              <span className="truncate rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                {report.projectName}
                              </span>
                            )}
                            <span className="text-slate-300">{report.createdByName}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-1.5">
                          {report.status === 'completed' && (
                            <button
                              onClick={() => { onViewReport(report.id); onClose(); }}
                              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-600 transition-all hover:bg-indigo-50 active:scale-95"
                            >
                              Görüntüle
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(report.id)}
                              disabled={deletingId === report.id}
                              className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 disabled:opacity-50"
                              title="Raporu sil"
                            >
                              {deletingId === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-3">
              <p className="text-[10px] font-medium text-slate-400">
                {isAdmin ? 'Tüm workspace raporları görüntüleniyor.' : 'Sizin ve adminlerin raporları görüntüleniyor.'}
              </p>
              <button
                onClick={onClose}
                className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
              >
                Kapat
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
