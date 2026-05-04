import { useState } from 'react';
import { Calendar, CalendarDays, ChevronDown, ChevronRight, Clock, Filter, LayoutGrid, MoreVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Task } from '../types';
import { resolveAvatarUrl } from '../lib/avatar';

interface ProjectsProps {
  projects: Project[];
  tasks?: Task[];
  onProjectClick?: (project: Project) => void;
  onAddProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  canManageProjects?: boolean;
  onGenerateReport?: (projectId: string) => void;
}

export default function Projects({
  projects,
  tasks = [],
  onProjectClick,
  onAddProject,
  onEditProject,
  onDeleteProject,
  canManageProjects,
  onGenerateReport,
}: ProjectsProps) {
  const [activeTab, setActiveTab] = useState<'Aktif' | 'Tamamlandı' | 'Tümü'>('Aktif');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'gantt'>('cards');
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('week');
  const [expandedProjectIds, setExpandedProjectIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [selectedManagerId, setSelectedManagerId] = useState<string>('Tümü');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const managers = ['Tümü', ...Array.from(new Set(projects.map((p) => p.managerId))).map(id => ({ id, name: projects.find(p => p.managerId === id)?.manager }))];

  const filteredProjects = projects.filter(
    (project) => {
      const matchSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = selectedCategory === 'Tümü' || project.category === selectedCategory;
      const matchManager = selectedManagerId === 'Tümü' || project.managerId === selectedManagerId;

      const isActive = ['Taslak', 'Planlanıyor', 'Aktif', 'Askıda'].includes(project.status);
      const isCompleted = ['Tamamlandı', 'İptal Edildi'].includes(project.status);

      let statusMatch = true;
      if (activeTab === 'Aktif') statusMatch = isActive;
      else if (activeTab === 'Tamamlandı') statusMatch = isCompleted;

      return matchSearch && matchCategory && matchManager && statusMatch;
    }
  );

  const toDate = (value?: string | null) => {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffInDays = (start: Date, end: Date) => {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((startOfDay(end).getTime() - startOfDay(start).getTime()) / msPerDay);
  };

  const projectTimelines = filteredProjects.map((project) => {
    const start = toDate(project.startDate) || (toDate(project.endDate) ? addDays(toDate(project.endDate) as Date, -14) : new Date());
    const end = toDate(project.endDate) || addDays(start, 14);
    const today = startOfDay(new Date());
    return {
      ...project,
      timelineStart: startOfDay(start),
      timelineEnd: startOfDay(end < start ? addDays(start, 1) : end),
      isOverdue: project.status !== 'Tamamlandı' && startOfDay(end < start ? addDays(start, 1) : end) < today,
    };
  });

  const visibleProjectIds = new Set(projectTimelines.map((project) => project.id));
  const taskTimelines = tasks
    .filter((task) => visibleProjectIds.has(task.projectId))
    .map((task) => {
      const project = projectTimelines.find((item) => item.id === task.projectId);
      if (!project) {
        return null;
      }

      const dueDate = toDate(task.dueDate) || new Date();
      const start = project.timelineStart;
      const rawEnd = startOfDay(dueDate < start ? addDays(start, 1) : dueDate);
      return {
        ...task,
        timelineStart: start,
        timelineEnd: rawEnd,
      };
    })
    .filter((task): task is NonNullable<typeof task> => Boolean(task));

  const timelineStart =
    projectTimelines.length > 0
      ? new Date(Math.min(...projectTimelines.map((project) => project.timelineStart.getTime())))
      : new Date();
  const timelineEnd =
    projectTimelines.length > 0
      ? new Date(Math.max(...projectTimelines.map((project) => project.timelineEnd.getTime())))
      : addDays(timelineStart, 30);

  const totalTimelineDays = Math.max(diffInDays(timelineStart, timelineEnd) + 1, 1);
  const baseZoomStep = zoom === 'day' ? 1 : zoom === 'week' ? 7 : 30;
  const maxColumns = 120;
  const zoomStep = Math.max(baseZoomStep, Math.ceil(totalTimelineDays / maxColumns));
  const columnCount = Math.max(Math.ceil(totalTimelineDays / zoomStep), 1);
  const dayColumns = Array.from({ length: columnCount }, (_, index) => addDays(timelineStart, index * zoomStep));
  const timelineColumnWidth = zoom === 'day' ? 48 : zoom === 'week' ? 70 : 120;
  const timelineWidth = Math.max(dayColumns.length * timelineColumnWidth, 740);
  const labelColumnWidth = 260;

  const toGridPosition = (start: Date, end: Date) => {
    const rawStart = Math.floor(diffInDays(timelineStart, start) / zoomStep);
    const rawEnd = Math.floor(diffInDays(timelineStart, end) / zoomStep);
    const startCol = Math.max(rawStart, 0) + 1;
    const span = Math.max(rawEnd - Math.max(rawStart, 0) + 1, 1);
    return { startCol, span };
  };

  const formatDayLabel = (value: Date) =>
    zoom === 'day'
      ? value.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
      : zoom === 'week'
        ? `Hf ${value.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}`
        : value.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });

  const formatMonthLabel = (value: Date) =>
    value.toLocaleDateString('tr-TR', {
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projeler</h1>
          <p className="mt-1 text-slate-500">Rolüne göre erişebildiğin projeleri ve ilerlemelerini buradan yönet.</p>
        </div>
        {canManageProjects && (
          <button
            onClick={onAddProject}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5" />
            Yeni Proje Oluştur
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1">
            {['Tümü', 'Aktif', 'Tamamlandı'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`relative rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === tab ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeProjectTab"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tab === 'Aktif' ? 'Aktif Projeler' : tab === 'Tamamlandı' ? 'Tamamlananlar' : 'Tümü'}</span>
              </button>
            ))}
          </div>

          <div className="flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Kartlar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                viewMode === 'gantt' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Gantt
            </motion.button>
          </div>

          {viewMode === 'gantt' && (
            <div className="flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setZoom('day')}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  zoom === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Gün
              </button>
              <button
                onClick={() => setZoom('week')}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  zoom === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Hafta
              </button>
              <button
                onClick={() => setZoom('month')}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  zoom === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Ay
              </button>
            </div>
          )}
        </div>

        <div className="flex max-w-md flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Proje ara..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`rounded-xl border p-2 transition-all ${
                isFilterOpen || selectedCategory !== 'Tümü'
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-5 w-5" />
            </motion.button>

            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-slate-900/5"
                  >
                    <div className="max-h-[320px] overflow-y-auto no-scrollbar space-y-4">
                      <div>
                        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Kategori</p>
                        <div className="space-y-0.5">
                          {['Tümü', ...Array.from(new Set(projects.map(p => p.category))).filter(Boolean)].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                                selectedCategory === cat ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {cat}
                              {selectedCategory === cat && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-50 pt-3">
                        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Yönetici</p>
                        <div className="space-y-0.5">
                          {managers.map((m: any) => (
                            <button
                              key={typeof m === 'string' ? m : m.id}
                              onClick={() => setSelectedManagerId(typeof m === 'string' ? m : m.id)}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                                selectedManagerId === (typeof m === 'string' ? m : m.id) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className="truncate">{typeof m === 'string' ? m : m.name}</span>
                              {selectedManagerId === (typeof m === 'string' ? m : m.id) && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {(selectedCategory !== 'Tümü' || selectedManagerId !== 'Tümü') && (
                      <div className="mt-2 border-t border-slate-50 p-2">
                        <button 
                          onClick={() => {
                            setSelectedCategory('Tümü');
                            setSelectedManagerId('Tümü');
                          }}
                          className="w-full rounded-xl bg-slate-50 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          Filtreleri Temizle
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'cards' ? (
          <motion.div
            key="cards-view"
            initial="hidden" animate="visible" exit="exit"
            variants={{ 
              visible: { transition: { staggerChildren: 0.1 } },
              exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          >
            {filteredProjects.map((project) => (
              <motion.div
                layout
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
                }}
                whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                key={project.id}
                className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all"
              >
                <div onClick={() => onProjectClick?.(project)} className="cursor-pointer space-y-2.5 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={resolveAvatarUrl(project.managerAvatar, 48)}
                          alt={project.manager}
                          className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                      </div>
                      <div>
                        <h3 className="line-clamp-1 font-bold text-slate-900 transition-colors group-hover:text-indigo-600">{project.name}</h3>
                        <p className="text-xs font-medium text-slate-500">{project.category}</p>
                      </div>
                    </div>

                    {canManageProjects && (
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(238, 242, 255, 1)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditProject?.(project);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition-all hover:text-indigo-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(254, 242, 242, 1)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteProject?.(project);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition-all hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(248, 250, 252, 1)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(event) => event.stopPropagation()} 
                          className="rounded-lg p-1.5 text-slate-400 transition-all hover:text-slate-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  <p className="h-9 line-clamp-2 text-[13px] leading-relaxed text-slate-500">{project.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">İlerleme</span>
                      <span className="text-indigo-600">%{project.progress}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${project.progress === 100 ? 'bg-emerald-500' : project.themeColor || 'bg-indigo-600'}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-bold">
                          {project.status === 'Tamamlandı' ? 'Tamamlandı' : `${project.daysLeft} Gün Kaldı`}
                        </span>
                      </div>
                    </div>

                    <div className="flex -space-x-2">
                      {project.team.slice(0, 4).map((member, index) => (
                        <img
                          key={`${project.id}-${member}-${index}`}
                          src={resolveAvatarUrl(member, 32)}
                          alt="Team member"
                          className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/50 px-5 py-2.5">
                  <button onClick={() => onProjectClick?.(project)} className="text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-700">
                    Detayları Gör
                  </button>
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {project.id}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="gantt-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-w-0 max-w-full space-y-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Proje Zaman Planı</h2>
              <p className="text-xs text-slate-500">{formatMonthLabel(timelineStart)} - {formatMonthLabel(timelineEnd)}</p>
            </div>

            {zoom === 'day' && zoomStep > 1 && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                Tarih araligi cok genis oldugu icin gun gorunumu {zoomStep} gunluk gruplama ile gosteriliyor.
              </p>
            )}

            <div className="w-full min-w-0 overflow-x-auto">
              <div style={{ width: `${labelColumnWidth + timelineWidth}px` }}>
                <motion.div layout className="grid border-b border-slate-100 pb-2" style={{ gridTemplateColumns: `${labelColumnWidth}px ${timelineWidth}px` }}>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Proje</div>
                  <motion.div
                    layout
                    className="grid gap-0.5"
                    style={{ gridTemplateColumns: `repeat(${dayColumns.length}, ${timelineColumnWidth}px)` }}
                  >
                    {dayColumns.map((day, index) => (
                      <div
                        key={`header-${index}`}
                        className={`text-center text-[10px] font-semibold ${day.getDate() === 1 ? 'text-indigo-600' : 'text-slate-400'}`}
                      >
                        {formatDayLabel(day)}
                      </div>
                    ))}
                  </motion.div>
                </motion.div>

                <div className="space-y-2 pt-3">
                  {projectTimelines.map((project) => {
                    const { startCol, span } = toGridPosition(project.timelineStart, project.timelineEnd);
                    const projectTasks = taskTimelines.filter((task) => task.projectId === project.id);
                    const isExpanded = expandedProjectIds.includes(project.id);
                    return (
                      <motion.div
                        layout
                        key={`gantt-${project.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                      >
                        <motion.div layout className="grid items-center gap-3" style={{ gridTemplateColumns: `${labelColumnWidth}px ${timelineWidth}px` }}>
                          <button
                            onClick={() => {
                              setExpandedProjectIds((current) =>
                                current.includes(project.id) ? current.filter((id) => id !== project.id) : [...current, project.id],
                              );
                            }}
                            className="flex items-center gap-2 truncate rounded-lg px-2 py-1 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="truncate">{project.name}</span>
                            {project.isOverdue && (
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">Gecikti</span>
                            )}
                          </button>
                          <motion.div
                            layout
                            className="grid items-center rounded-lg bg-slate-50 px-1 py-2"
                            style={{ gridTemplateColumns: `repeat(${dayColumns.length}, ${timelineColumnWidth}px)` }}
                          >
                            <motion.div
                              layout
                              initial={{ scaleX: 0, originX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-6 rounded-md ${
                                project.isOverdue ? 'bg-rose-500' : project.progress === 100 ? 'bg-emerald-500' : project.themeColor || 'bg-indigo-600'
                              }`}
                              style={{ gridColumn: `${startCol} / span ${span}` }}
                              title={`${project.name} (${formatDayLabel(project.timelineStart)} - ${formatDayLabel(project.timelineEnd)})`}
                            />
                          </motion.div>
                        </motion.div>

                        <AnimatePresence>
                          {isExpanded && projectTasks.map((task) => {
                            const taskGrid = toGridPosition(task.timelineStart, task.timelineEnd);
                            const taskOverdue = task.status !== 'Tamamlandı' && task.timelineEnd < startOfDay(new Date());
                            return (
                              <motion.div
                                key={`gantt-task-${task.id}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="grid items-center gap-3 overflow-hidden"
                                style={{ gridTemplateColumns: `${labelColumnWidth}px ${timelineWidth}px` }}
                              >
                                <div className="truncate pl-6 text-xs font-medium text-slate-600">{task.title}</div>
                                <motion.div
                                  layout
                                  className="grid items-center rounded-lg bg-slate-50/70 px-1 py-1.5"
                                  style={{ gridTemplateColumns: `repeat(${dayColumns.length}, ${timelineColumnWidth}px)` }}
                                >
                                  <motion.div
                                    layout
                                    initial={{ scaleX: 0, originX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className={`h-4 rounded ${taskOverdue ? 'bg-rose-300' : 'bg-indigo-300'}`}
                                    style={{ gridColumn: `${taskGrid.startCol} / span ${taskGrid.span}` }}
                                    title={`${task.title} (${task.status})`}
                                  />
                                </motion.div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
