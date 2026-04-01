import { Notification } from '../types';
import { Bell, CheckCircle2, MessageSquare, Briefcase, Settings, Clock, X, CheckCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  onClose: () => void;
  onReadAll?: () => void;
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  isOpen,
  onClose,
  onReadAll,
}: NotificationDropdownProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="h-4 w-4 text-indigo-500" />;
      case 'project':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'mention':
        return <MessageSquare className="h-4 w-4 text-amber-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-rose-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.18 }}
          className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(24rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl shadow-indigo-900/10"
        >
          <div className="border-b border-slate-50 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Bildirimler</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} okunmamış bildirimin var` : 'Tüm bildirimler güncel'}
                </p>
              </div>
              <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-50">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Son aktiviteler</span>
              <button
                onClick={onReadAll}
                disabled={!unreadCount}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-600 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Hepsini okundu yap
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={onClose}
                  className={`relative flex w-full gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${
                    !notification.read ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  {!notification.read && <div className="absolute bottom-0 left-0 top-0 w-1 bg-indigo-500" />}
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50">
                    {getIcon(notification.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`truncate text-sm font-bold ${!notification.read ? 'text-indigo-900' : 'text-slate-900'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notification.description}</p>
                    <div className="mt-2 flex items-center gap-1 text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-medium">{notification.time}</span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-500">Henüz bildirimin yok.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
