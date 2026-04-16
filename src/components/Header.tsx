import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import NotificationDropdown from './NotificationDropdown';
import { Notification, User } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  notifications: Notification[];
  onReadAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
  onDeleteAllNotifications?: () => void;
  onToggleNotificationRead?: (id: string, read: boolean) => void;
  currentUser: User;
  onLogout?: () => Promise<void> | void;
}

export default function Header({ 
  onMenuClick, 
  notifications, 
  onReadAllNotifications, 
  onDeleteNotification,
  onDeleteAllNotifications,
  onToggleNotificationRead,
  currentUser, 
  onLogout 
}: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationAreaRef = useRef<HTMLDivElement | null>(null);
  const profileAreaRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationAreaRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }

      if (!profileAreaRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-4">
          <button onClick={onMenuClick} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden">
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden items-center gap-2 sm:flex lg:hidden">
            <img src="/logo.jpg" alt="Zodiac logo" className="h-7 w-7 rounded-md object-cover" />
            <span className="text-sm font-bold tracking-tight text-gray-900">Zodiac</span>
          </div>

          <div className="relative hidden w-full max-w-md sm:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm leading-5 placeholder-gray-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Proje veya görev ara..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div ref={notificationAreaRef} className="relative">
            <button
              onClick={() => setIsNotificationsOpen((current) => !current)}
              className={`relative rounded-full p-2 transition-all ${
                isNotificationsOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationDropdown
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              notifications={notifications}
              unreadCount={unreadCount}
              onReadAll={onReadAllNotifications}
              onDelete={onDeleteNotification}
              onDeleteAll={onDeleteAllNotifications}
              onToggleRead={onToggleNotificationRead}
            />
          </div>

          <div className="mx-2 hidden h-8 w-px bg-gray-200 sm:block" />

          <div ref={profileAreaRef} className="relative">
            <button
              onClick={() => setIsProfileOpen((current) => !current)}
              className="group flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-gray-100"
            >
              <img
                className="h-8 w-8 rounded-full border border-gray-200"
                src={`https://picsum.photos/seed/${currentUser.avatar}/32/32`}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
              />
              <div className="hidden text-left md:block">
                <span className="block text-sm font-medium text-gray-700">{currentUser.name.split(' ')[0]}</span>
                <span className="block text-[11px] text-gray-400">{currentUser.role}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-600" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full z-40 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 p-4">
                  <p className="font-bold text-slate-900">{currentUser.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{currentUser.email}</p>
                  <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                    {currentUser.role}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    void onLogout?.();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
