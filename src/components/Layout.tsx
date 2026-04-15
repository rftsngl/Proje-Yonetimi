import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Notification, User } from '../types';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  notifications: Notification[];
  onReadAllNotifications?: () => void;
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
          currentUser={currentUser}
          onLogout={onLogout}
        />
        
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
