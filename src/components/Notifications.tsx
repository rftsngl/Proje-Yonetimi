import { useState, useEffect, useMemo } from 'react';
import { Notification } from '../types';
import { Bell, CheckCircle2, Clock, MessageSquare, Briefcase, MoreHorizontal, Settings, Trash2, Filter, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './ConfirmModal';

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

const TYPE_FILTERS = [
  { key: 'all', label: 'Tümü', icon: Bell, color: 'bg-slate-50 text-slate-600 ring-slate-200' },
  { key: 'task', label: 'Görevler', icon: CheckCircle2, color: 'bg-indigo-50 text-indigo-600 ring-indigo-200' },
  { key: 'project', label: 'Projeler', icon: Briefcase, color: 'bg-blue-50 text-blue-600 ring-blue-200' },
  { key: 'mention', label: 'Bahsetmeler', icon: MessageSquare, color: 'bg-amber-50 text-amber-600 ring-amber-200' },
  { key: 'system', label: 'Sistem', icon: Settings, color: 'bg-rose-50 text-rose-600 ring-rose-200' },
] as const;

export default function Notifications({ notifications, onReadAll, onDelete, onDeleteAll, onToggleRead, onOpenDetail, checkIsValidTarget, hasMore, isLoadingMore, onLoadMore }: NotificationsProps) {
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (typeFilter === 'all') return notifications;
    return notifications.filter(n => n.type === typeFilter);
  }, [notifications, typeFilter]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const getIcon = (type: string, entityType?: string) => {
    if (entityType === 'report') {
      return <Sparkles className="h-5 w-5 text-indigo-500" />;
    }
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Bildirimler</h1>
            {unreadCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                {unreadCount} okunmamış
              </span>
            )}
          </div>
          <p className="mt-1 text-slate-500">Uygulama genelindeki tüm aktiviteleri buradan takip edebilirsiniz.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReadAll}
            disabled={unreadCount === 0}
            className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hepsini Okundu İşaretle
          </button>
          <button 
            onClick={() => setIsDeleteAllConfirmOpen(true)} 
            disabled={!notifications.length}
            className="rounded-xl bg-slate-50 p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Type Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
        {TYPE_FILTERS.map(filter => {
          const Icon = filter.icon;
          const isActive = typeFilter === filter.key;
          const count = filter.key === 'all' ? notifications.length : notifications.filter(n => n.type === filter.key).length;
          return (
            <button
              key={filter.key}
              onClick={() => setTypeFilter(filter.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                isActive ? `${filter.color} ring-1` : 'bg-white text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-3 w-3" />
              {filter.label}
              <span className={`ml-0.5 text-[10px] ${isActive ? 'opacity-70' : 'opacity-50'}`}>({count})</span>
            </button>
          );
        })}
        {typeFilter !== 'all' && (
          <button
            onClick={() => setTypeFilter('all')}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-rose-500 transition-all hover:bg-rose-50"
          >
            <X className="h-3 w-3" />
            Temizle
          </button>
        )}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
        <motion.div 
          className="divide-y divide-slate-50"
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {filteredNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              variants={{ hidden: { opacity: 0, x: -15 }, visible: { opacity: 1, x: 0 } }}
              className={`group relative flex items-start gap-4 p-6 transition-all hover:bg-slate-50/50 ${!notification.read ? 'bg-indigo-50/20' : ''}`}
            >
              {!notification.read && <div className="absolute bottom-0 left-0 top-0 w-1 bg-indigo-500" />}

              <div className={`flex-shrink-0 rounded-2xl p-3 ${getBg(notification.type)}`}>{getIcon(notification.type, notification.entityType)}</div>

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
        </motion.div>

        {filteredNotifications.length === 0 && (
          <div className="p-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
              {typeFilter !== 'all' ? <Filter className="h-10 w-10 text-slate-300" /> : <Bell className="h-10 w-10 text-slate-300" />}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {typeFilter !== 'all' ? 'Bu kategoride bildirim yok' : 'Henüz bildiriminiz yok'}
            </h3>
            <p className="mt-1 text-slate-500">
              {typeFilter !== 'all' ? 'Farklı bir filtre seçebilirsiniz.' : 'Yeni bir gelişme olduğunda burada görünecektir.'}
            </p>
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

      {/* Delete All Confirmation - uses shared ConfirmModal */}
      <ConfirmModal
        isOpen={isDeleteAllConfirmOpen}
        title="Tümünü Sil"
        message="Tüm bildirimleri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Evet, Sil"
        cancelLabel="İptal"
        onConfirm={() => {
          setIsDeleteAllConfirmOpen(false);
          onDeleteAll?.();
        }}
        onCancel={() => setIsDeleteAllConfirmOpen(false)}
      />
    </div>
  );
}
