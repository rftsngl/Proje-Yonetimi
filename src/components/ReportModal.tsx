import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, AlertCircle, Copy, Check, Clock, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { ReportDetail } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Eski uyum: doğrudan string rapor içeriği */
  reportContent?: string | null;
  /** Yeni: detaylı rapor nesnesi */
  report?: ReportDetail | null;
  isLoading: boolean;
  error: string | null;
  title?: string;
  onOpenHistory?: () => void;
}

export default function ReportModal({
  isOpen, onClose, reportContent, report, isLoading, error, title, onOpenHistory,
}: ReportModalProps) {
  const [copied, setCopied] = useState(false);

  const content = report?.content || reportContent || null;
  const displayTitle = title || report?.title || 'Yapay Zeka Analizi';
  const displayError = error || (report?.status === 'failed' ? report.errorMessage : null);
  const isPending = report?.status === 'pending';

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard api unavailable
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 9999 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-200">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{displayTitle}</h2>
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                    {report?.projectName && <span>{report.projectName}</span>}
                    {report?.createdAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(report.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {content && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-700"
                    title="Panoya kopyala"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-600">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {(isLoading || isPending) ? (
                <div className="flex h-80 flex-col items-center justify-center space-y-5">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-100" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-200"
                    >
                      <Sparkles className="h-7 w-7 text-white" />
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">Rapor Hazırlanıyor</p>
                    <p className="mt-1 text-xs font-medium text-slate-400 animate-pulse">Yapay zeka proje verilerini analiz ediyor...</p>
                    <p className="mt-3 text-[10px] text-slate-400">Rapor hazır olduğunda bildirim alacaksınız.</p>
                  </div>
                </div>
              ) : displayError ? (
                <div className="flex h-80 flex-col items-center justify-center space-y-4 p-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                    <AlertCircle className="h-7 w-7 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Rapor Oluşturulamadı</p>
                    <p className="mt-1 text-sm text-slate-500">{displayError}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    Kapat
                  </button>
                </div>
              ) : content ? (
                <div className="p-6 sm:p-8">
                  <div className="ai-report-content prose prose-slate max-w-none
                    prose-headings:text-slate-900 prose-headings:font-bold
                    prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-100
                    prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2
                    prose-p:text-sm prose-p:leading-relaxed prose-p:text-slate-600
                    prose-li:text-sm prose-li:text-slate-600 prose-li:leading-relaxed
                    prose-strong:text-slate-800 prose-strong:font-bold
                    prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                    prose-hr:border-slate-100 prose-hr:my-6
                    prose-ul:my-2 prose-ol:my-2
                    prose-blockquote:border-l-indigo-400 prose-blockquote:bg-indigo-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:text-sm
                    prose-code:bg-slate-100 prose-code:text-indigo-700 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
                    prose-table:text-sm prose-th:bg-slate-50 prose-th:font-bold prose-th:text-slate-700 prose-td:text-slate-600
                  ">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-sm text-slate-500">Rapor içeriği bulunamadı.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {!isLoading && !isPending && !displayError && content && (
              <div className="flex flex-shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-3">
                <div className="flex items-center gap-4">
                  <p className="text-[10px] font-medium text-slate-400">
                    Bu rapor yapay zeka tarafından oluşturulmuştur. İçerik doğruluğunu teyit ediniz.
                  </p>
                  {report?.id && (
                    <span className="text-[10px] font-mono text-slate-300">{report.id}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {onOpenHistory && (
                    <button
                      onClick={() => { onClose(); onOpenHistory(); }}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Geçmiş
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
