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
} from 'lucide-react';
import { motion } from 'motion/react';
import { ProjectProgress, Stat, Task, User } from '../types';
import { resolveAvatarUrl } from '../lib/avatar';

interface DashboardProps {
  stats: Stat[];
  upcomingTasks: Task[];
  projectProgress: ProjectProgress[];
  currentUser: User;
  onNavigateFromStat?: (targetTab: 'projects' | 'tasks') => void;
}

const iconMap: Record<string, any> = {
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle2,
};

export default function Dashboard({ stats, upcomingTasks, projectProgress, currentUser, onNavigateFromStat }: DashboardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }} 
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hoş geldin, {currentUser.name.split(' ')[0]}</h1>
        <p className="mt-1 text-slate-500">{currentUser.role} rolüne göre görünümün ve özet verilerin dinamik olarak hazırlandı.</p>
      </div>

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
              whileActive={{ scale: 0.98 }}
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
          transition={{ delay: 0.3 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-1"
        >
          <div className="flex items-center justify-between border-b border-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-900">Yaklaşan Görevler</h2>
            <button className="text-slate-400 transition-colors hover:text-slate-600">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
          <motion.div 
            className="flex-1 divide-y divide-slate-50"
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {upcomingTasks.map((task) => (
              <motion.div 
                variants={{ 
                  hidden: { opacity: 0, x: -20 }, 
                  visible: { opacity: 1, x: 0, transition: { ease: 'easeOut' } } 
                }}
                key={task.id} 
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
          transition={{ delay: 0.4 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-1"
        >
          <div className="flex items-center justify-between border-b border-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-900">Proje İlerleme</h2>
            <button className="text-slate-400 transition-colors hover:text-slate-600">
              <MoreVertical className="h-5 w-5" />
            </button>
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
              <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-100">
                Rapor
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-1"
        >
          <div className="flex items-center justify-between border-b border-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-900">Son Aktiviteler</h2>
            <button className="text-slate-400 transition-colors hover:text-slate-600">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-6 p-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">{currentUser.name}</span> için görünür yorum ve görev akışı burada özetlenir.
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">Canlı rol görünümü</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tamamlanan görevler ve proje ilerlemeleri yetkine göre filtrelenir.</p>
                <p className="mt-1 text-xs font-medium text-slate-400">Rol tabanlı görünüm</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <UserPlus className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Ekip ve proje aksiyonları yalnızca yetkili rollerde aktif olur.</p>
                <p className="mt-1 text-xs font-medium text-slate-400">Güvenli izin modeli</p>
              </div>
            </div>
          </div>
          <button className="w-full border-t border-slate-50 py-4 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50">
            Tüm Aktiviteyi Gör
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
