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
    <div className="min-h-screen bg-gray-50 flex">
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
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          notifications={notifications}
          onReadAllNotifications={onReadAllNotifications}
          currentUser={currentUser}
          onLogout={onLogout}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
