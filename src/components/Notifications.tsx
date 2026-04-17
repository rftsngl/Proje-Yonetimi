import { useState, useEffect } from 'react';
import { Notification } from '../types';
import { Bell, CheckCircle2, Clock, MessageSquare, Briefcase, MoreHorizontal, Settings, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationsProps {
  notifications: Notification[];
  onReadAll?: () => void;
  onDelete?: (id: string) => void;
  onDeleteAll?: () => void;
  onToggleRead?: (id: string, read: boolean) => void;
  onOpenDetail?: (notification: Notification) => void;
  checkIsValidTarget?: (notification: Notification) => boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export default function Notifications({ notifications, onReadAll, onDelete, onDeleteAll, onToggleRead, onOpenDetail, checkIsValidTarget, hasMore, isLoadingMore, onLoadMore }: NotificationsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);
  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="h-5 w-5 text-indigo-500" />;
      case 'project':
        return <Briefcase className="h-5 w-5 text-blue-500" />;
      case 'mention':
        return <MessageSquare className="h-5 w-5 text-amber-500" />;
      case 'system':
        return <Settings className="h-5 w-5 text-rose-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-indigo-50';
      case 'project':
        return 'bg-blue-50';
      case 'mention':
        return 'bg-amber-50';
      case 'system':
        return 'bg-rose-50';
      default:
        return 'bg-slate-50';
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bildirimler</h1>
          <p className="mt-1 text-slate-500">Uygulama genelindeki tüm aktiviteleri buradan takip edebilirsiniz.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReadAll}
            className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-100"
          >
            Hepsini Okundu İşaretle
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            disabled={!notifications.length}
            className="rounded-xl bg-slate-50 p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="divide-y divide-slate-50">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group relative flex items-start gap-4 p-6 transition-all hover:bg-slate-50/50 ${!notification.read ? 'bg-indigo-50/20' : ''}`}
            >
              {!notification.read && <div className="absolute bottom-0 left-0 top-0 w-1 bg-indigo-500" />}

              <div className={`flex-shrink-0 rounded-2xl p-3 ${getBg(notification.type)}`}>{getIcon(notification.type)}</div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`truncate font-bold text-slate-900 ${!notification.read ? 'text-indigo-900' : ''}`}>
                    {notification.title}
                  </h3>
                  <div className="flex flex-shrink-0 items-center gap-1.5 text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{notification.time}</span>
                  </div>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{notification.description}</p>

                <div className="mt-4 flex items-center gap-3">
                  {checkIsValidTarget?.(notification) ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onOpenDetail?.(notification); }}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Detayları Gör
                    </button>
                  ) : (
                    notification.entityType && notification.entityType !== 'none' ? (
                      <span className="text-xs text-slate-400">Detay artık mevcut değil</span>
                    ) : null
                  )}
                </div>
              </div>

              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === notification.id ? null : notification.id); }}
                  className={`p-2 text-slate-300 transition-all hover:text-slate-500 rounded-full hover:bg-slate-100 ${activeMenuId === notification.id ? 'opacity-100 bg-slate-100 text-slate-500' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                
                <AnimatePresence>
                  {activeMenuId === notification.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          onToggleRead?.(notification.id, !notification.read);
                          setActiveMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                      >
                        {notification.read ? 'Okunmadı İşaretle' : 'Okundu İşaretle'}
                      </button>
                      <button
                        onClick={() => {
                          onDelete?.(notification.id);
                          setActiveMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600"
                      >
                        Yoksay
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="p-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
              <Bell className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Henüz bildiriminiz yok</h3>
            <p className="mt-1 text-slate-500">Yeni bir gelişme olduğunda burada görünecektir.</p>
          </div>
        )}

        {hasMore && (
          <div className="border-t border-slate-50 bg-slate-50/50 p-4 text-center">
            <button 
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-sm font-bold text-slate-500 transition-all hover:text-indigo-600 disabled:opacity-50 disabled:cursor-wait"
            >
              {isLoadingMore ? 'Yükleniyor...' : 'Daha Eski Bildirimleri Yükle'}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900">Tümünü Sil</h3>
              <p className="mt-2 text-sm text-slate-500">
                Tüm bildirimleri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    onDeleteAll?.();
                  }}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-700"
                >
                  Evet, Sil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
