import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  MoreVertical,
  TrendingDown,
  TrendingUp,
  UserPlus,
  RefreshCw,
  ExternalLink,
  Settings,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Notification, ProjectProgress, Stat, Task, User } from '../types';
import { resolveAvatarUrl } from '../lib/avatar';

interface DashboardProps {
  stats: Stat[];
  upcomingTasks: Task[];
  projectProgress: ProjectProgress[];
  currentUser: User;
  onNavigateFromStat?: (targetTab: 'projects' | 'tasks') => void;
  onRefresh?: () => Promise<any>;
  onGenerateReport?: () => void;
  onTaskClick?: (taskId: string) => void;
  activities?: Notification[];
}

const iconMap: Record<string, any> = {
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle2,
};

export default function Dashboard({ 
  stats, 
  upcomingTasks, 
  projectProgress, 
  currentUser, 
  onNavigateFromStat, 
  onRefresh, 
  onGenerateReport,
  onTaskClick,
  activities = []
}: DashboardProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = async (id: string) => {
    if (!onRefresh) return;
    setActiveMenuId(null);
    setIsRefreshing(id);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(null), 800);
    }
  };

  const getMenuOptions = (id: string) => [
    { 
      label: 'Yenile', 
      icon: RefreshCw, 
      onClick: () => handleRefresh(id) 
    },
    { 
      label: 'Detayları Gör', 
      icon: ExternalLink, 
      onClick: () => {
        const target = id === 'tasks' ? 'tasks' : 'projects';
        onNavigateFromStat?.(target);
        setActiveMenuId(null);
      } 
    },
    { 
      label: 'Özelleştir', 
      icon: Settings, 
      iconColor: 'text-slate-300', 
      disabled: true,
      tooltip: 'Yakında Gelecek',
      onClick: () => {} 
    },
  ];

  const renderDropdown = (id: string) => (
    <AnimatePresence>
      {activeMenuId === id && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-100 bg-white shadow-xl ring-1 ring-slate-900/5"
        >
          <div className="p-1.5">
            {getMenuOptions(id).map((option, idx) => (
              <div key={idx} className="relative group/item">
                <button
                  disabled={option.disabled}
                  onClick={option.onClick}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                    option.disabled 
                      ? 'cursor-not-allowed text-slate-300' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <option.icon className={`h-4 w-4 ${option.iconColor || 'text-indigo-500'} ${option.label === 'Yenile' && isRefreshing === id ? 'animate-spin' : ''}`} />
                  {option.label}
                </button>
                
                {option.disabled && option.tooltip && (
                  <div className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:opacity-100 z-[60]">
                    <div className="whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xl">
                      {option.tooltip}
                      <div className="absolute -right-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }} 
      className="space-y-8"
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="text-2xl font-bold text-slate-900">Hoş geldin, {currentUser.name.split(' ')[0]}</h1>
        <p className="mt-1 text-slate-500">{currentUser.role} rolüne göre görünümün ve özet verilerin dinamik olarak hazırlandı.</p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {stats.map((stat, index) => {
          const Icon = iconMap[stat.iconName];
          const targetTab = stat.iconName === 'Briefcase' ? 'projects' : 'tasks';

          return (
            <motion.button
              variants={{ 
                hidden: { opacity: 0, y: 20 }, 
                visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } 
              }}
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' }}
              whileTap={{ scale: 0.98 }}
              key={index}
              type="button"
              onClick={() => onNavigateFromStat?.(targetTab)}
              className="rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-3 ${stat.bg} ${stat.color}`}>{Icon && <Icon className="h-6 w-6" />}</div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.trend}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-1"
        >
          <div className="relative flex items-center justify-between border-b border-slate-50 p-6" ref={activeMenuId === 'tasks' ? menuRef : null}>
            <h2 className="text-lg font-bold text-slate-900">Yaklaşan Görevler</h2>
            <button 
              onClick={() => setActiveMenuId(activeMenuId === 'tasks' ? null : 'tasks')}
              className={`rounded-lg p-1.5 transition-all ${activeMenuId === 'tasks' ? 'bg-slate-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {renderDropdown('tasks')}
          </div>
          <motion.div 
            className="flex-1 divide-y divide-slate-50 overflow-x-hidden"
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {upcomingTasks.map((task) => (
              <motion.div 
                variants={{ 
                  hidden: { opacity: 0, x: -20 }, 
                  visible: { opacity: 1, x: 0, transition: { ease: 'easeOut' } } 
                }}
                whileHover={{ x: 4, backgroundColor: 'rgba(248, 250, 252, 1)' }}
                key={task.id} 
                onClick={() => onTaskClick?.(task.id)}
                className="group flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={resolveAvatarUrl(task.assignees[0] || task.id, 40)}
                    alt="User"
                    className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="max-w-[160px] truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                      {task.title}
                    </h4>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-500">{task.date}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    task.priority === 'Yüksek'
                      ? 'bg-rose-50 text-rose-600'
                      : task.priority === 'Orta'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  {task.priority}
                </span>
              </motion.div>
            ))}
          </motion.div>
          <button
            type="button"
            onClick={() => onNavigateFromStat?.('tasks')}
            className="w-full border-t border-slate-50 py-4 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            Tüm Görevleri Gör
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-1"
        >
          <div className="relative flex items-center justify-between border-b border-slate-50 p-6" ref={activeMenuId === 'projects' ? menuRef : null}>
            <h2 className="text-lg font-bold text-slate-900">Proje İlerleme</h2>
            <button 
              onClick={() => setActiveMenuId(activeMenuId === 'projects' ? null : 'projects')}
              className={`rounded-lg p-1.5 transition-all ${activeMenuId === 'projects' ? 'bg-slate-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {renderDropdown('projects')}
          </div>
          <motion.div 
            className="flex-1 space-y-6 p-6"
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } } }}
          >
            {projectProgress.map((project) => (
              <motion.div 
                variants={{ hidden: { opacity: 0, x: 10 }, visible: { opacity: 1, x: 0 } }}
                key={project.id} 
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="max-w-[180px] truncate text-sm font-semibold text-slate-700">{project.name}</h4>
                  <span className="text-xs font-bold text-slate-900">%{project.progress}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${project.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-2 px-6 pb-6">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Aktif Proje</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{projectProgress.length} Devam Eden</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onGenerateReport}
                className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Yapay Zeka Raporu
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-1"
        >
          <div className="relative flex items-center justify-between border-b border-slate-50 p-6" ref={activeMenuId === 'activity' ? menuRef : null}>
            <h2 className="text-lg font-bold text-slate-900">Son Aktiviteler</h2>
            <button 
              onClick={() => setActiveMenuId(activeMenuId === 'activity' ? null : 'activity')}
              className={`rounded-lg p-1.5 transition-all ${activeMenuId === 'activity' ? 'bg-slate-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {renderDropdown('activity')}
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {activities.length > 0 ? (
              <motion.div 
                className="divide-y divide-slate-50"
                initial="hidden" animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              >
                {activities.slice(0, 4).map((activity) => (
                  <motion.div 
                    variants={{ 
                      hidden: { opacity: 0, x: 20 }, 
                      visible: { opacity: 1, x: 0, transition: { ease: 'easeOut' } } 
                    }}
                    whileHover={{ x: 4, backgroundColor: 'rgba(248, 250, 252, 1)' }}
                    key={activity.id} 
                    className="group flex gap-4 p-4 transition-colors hover:bg-slate-50 cursor-default"
                  >
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                      activity.type === 'task' ? 'bg-indigo-50 text-indigo-600' :
                      activity.type === 'project' ? 'bg-emerald-50 text-emerald-600' :
                      activity.type === 'mention' ? 'bg-amber-50 text-amber-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {activity.type === 'task' ? <CheckCircle2 className="h-5 w-5" /> :
                       activity.type === 'project' ? <Briefcase className="h-5 w-5" /> :
                       activity.type === 'mention' ? <MessageSquare className="h-5 w-5" /> :
                       <AlertCircle className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {activity.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                        {activity.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-medium text-slate-400">{activity.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-slate-50 p-4">
                  <Sparkles className="h-8 w-8 text-slate-200" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">Henüz bir aktivite bulunmuyor.</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => onNavigateFromStat?.('tasks')}
            className="w-full border-t border-slate-50 py-4 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-indigo-600"
          >
            Tüm Aktiviteyi Gör
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
