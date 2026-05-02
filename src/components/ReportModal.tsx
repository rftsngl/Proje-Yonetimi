import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportContent: string | null;
  isLoading: boolean;
  error: string | null;
  title?: string;
}

export default function ReportModal({ isOpen, onClose, reportContent, isLoading, error, title = 'Yapay Zeka Analizi' }: ReportModalProps) {
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
                  <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                  <p className="text-xs font-medium text-slate-500">Yapay Zeka Destekli Analiz</p>
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
                    <p className="text-sm font-bold text-slate-700">Analiz Ediliyor</p>
                    <p className="mt-1 text-xs font-medium text-slate-400 animate-pulse">Yapay zeka proje verilerini inceliyor...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex h-80 flex-col items-center justify-center space-y-4 p-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                    <AlertCircle className="h-7 w-7 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Rapor Oluşturulamadı</p>
                    <p className="mt-1 text-sm text-slate-500">{error}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    Kapat
                  </button>
                </div>
              ) : reportContent ? (
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
                    <ReactMarkdown>{reportContent}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-sm text-slate-500">Rapor içeriği bulunamadı.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {!isLoading && !error && reportContent && (
              <div className="flex flex-shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-3">
                <p className="text-[10px] font-medium text-slate-400">
                  Bu rapor yapay zeka tarafından oluşturulmuştur. İçerik doğruluğunu teyit ediniz.
                </p>
                <button
                  onClick={onClose}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                >
                  Kapat
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
