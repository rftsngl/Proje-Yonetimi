import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Notification, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  notifications: Notification[];
  onReadAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
  onDeleteAllNotifications?: () => void;
  onToggleNotificationRead?: (id: string, read: boolean) => void;
  currentUser: User;
  visibleTabs: { id: string; label: string }[];
  onLogout?: () => Promise<void> | void;
}

export default function Layout({
  children,
  activeTab,
  onTabChange,
  notifications,
  onReadAllNotifications,
  onDeleteNotification,
  onDeleteAllNotifications,
  onToggleNotificationRead,
  currentUser,
  visibleTabs,
  onLogout,
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        activeTab={activeTab}
        onTabChange={onTabChange}
        currentUser={currentUser}
        visibleTabs={visibleTabs}
      />

      {/* Main Content Area */}
      <div className="min-w-0 flex flex-1 flex-col transition-all duration-300 lg:pl-64">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          notifications={notifications}
          onReadAllNotifications={onReadAllNotifications}
          onDeleteNotification={onDeleteNotification}
          onDeleteAllNotifications={onDeleteAllNotifications}
          onToggleNotificationRead={onToggleNotificationRead}
          currentUser={currentUser}
          onLogout={onLogout}
        />
        
        <main className="flex-1 overflow-x-hidden p-4 sm:p-5 lg:p-6">
          <div className="mx-auto max-w-7xl min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
