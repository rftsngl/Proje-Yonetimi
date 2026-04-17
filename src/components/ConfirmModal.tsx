import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Info, X, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  showCancel?: boolean;
  variant?: 'danger' | 'warning' | 'info' | 'success';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Tamam',
  cancelLabel = 'İptal',
  onConfirm,
  onCancel,
  isDestructive = true,
  showCancel = true,
  variant = 'danger',
}: ConfirmModalProps) {
  const getIcon = () => {
    switch (variant) {
      case 'success': return <CheckCircle2 className="h-7 w-7" />;
      case 'info': return <Info className="h-7 w-7" />;
      case 'warning': return <AlertTriangle className="h-7 w-7" />;
      default: return <AlertTriangle className="h-7 w-7" />;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'success': return 'bg-emerald-100 text-emerald-600';
      case 'info': return 'bg-blue-100 text-blue-600';
      case 'warning': return 'bg-amber-100 text-amber-600';
      default: return isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600';
    }
  };

  const getConfirmButtonStyles = () => {
    switch (variant) {
      case 'success': return 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700';
      case 'info': return 'bg-blue-600 shadow-blue-200 hover:bg-blue-700';
      case 'warning': return 'bg-amber-600 shadow-amber-200 hover:bg-amber-700';
      default: return isDestructive 
        ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' 
        : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700';
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[24px] bg-white p-6 shadow-2xl shadow-indigo-900/10"
          >
            <div className="mb-5 flex flex-col items-center text-center">
              <div 
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${getIconColor()}`}
              >
                {getIcon()}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-500">{message}</p>
            </div>

            <div className="flex gap-3">
              {showCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                onClick={() => {
                  onConfirm();
                }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white shadow-lg transition-colors active:scale-95 ${getConfirmButtonStyles()}`}
              >
                {confirmLabel}
              </button>
            </div>
            
            <button
              onClick={onCancel}
              className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
