import {
  Bell,
  Briefcase,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: User;
  visibleTabs: { id: string; label: string }[];
}

const iconMap = {
  dashboard: LayoutDashboard,
  projects: Briefcase,
  tasks: CheckSquare,
  team: Users,
  calendar: Calendar,
  notifications: Bell,
  settings: Settings,
};

export default function Sidebar({ isOpen, onClose, activeTab, onTabChange, currentUser, visibleTabs }: SidebarProps) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 transform border-r border-gray-100 bg-white transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-6">
            <button
              type="button"
              onClick={() => {
                onTabChange('dashboard');
                onClose();
              }}
              className="mx-auto flex w-full max-w-[196px] items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all hover:border-indigo-200 hover:bg-indigo-50/60"
            >
              <img
                src="/logo.jpg"
                alt="Zodiac logo"
                className="h-8 w-8 rounded-lg object-cover"
              />
              <span className="text-xl font-bold tracking-tight text-gray-900">Zodiac</span>
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-4 flex-1 space-y-1 px-4">
            {visibleTabs.map((item) => {
              const Icon = iconMap[item.id as keyof typeof iconMap] || Briefcase;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    activeTab === item.id
                      ? 'bg-indigo-50 font-semibold text-indigo-600'
                      : 'text-gray-600 hover:bg-indigo-50/50 hover:text-indigo-600'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${activeTab === item.id ? 'text-indigo-600' : 'group-hover:text-indigo-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-gray-100 p-4">
            <div className="flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50">
              <img
                src={`https://picsum.photos/seed/${currentUser.avatar}/40/40`}
                alt={currentUser.name}
                className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{currentUser.name}</p>
                <p className="truncate text-xs text-gray-500">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
