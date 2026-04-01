import { useState } from 'react';
import { Calendar, Clock, Filter, MoreVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Project } from '../types';

interface ProjectsProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  onAddProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  canManageProjects?: boolean;
}

export default function Projects({
  projects,
  onProjectClick,
  onAddProject,
  onEditProject,
  onDeleteProject,
  canManageProjects,
}: ProjectsProps) {
  const [activeTab, setActiveTab] = useState<'Aktif' | 'Tamamlandı'>('Aktif');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(
    (project) =>
      project.status === activeTab &&
      (project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-6">
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
        <div className="flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('Aktif')}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'Aktif' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Aktif Projeler
          </button>
          <button
            onClick={() => setActiveTab('Tamamlandı')}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'Tamamlandı' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Tamamlananlar
          </button>
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
          <button className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-all hover:bg-slate-50">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={project.id}
            className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md"
          >
            <div onClick={() => onProjectClick?.(project)} className="cursor-pointer space-y-4 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={`https://picsum.photos/seed/${project.managerAvatar}/48/48`}
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
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditProject?.(project);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteProject?.(project);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button onClick={(event) => event.stopPropagation()} className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="h-10 line-clamp-2 text-sm leading-relaxed text-slate-600">{project.description}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">İlerleme</span>
                  <span className="text-indigo-600">%{project.progress}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
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
                      src={`https://picsum.photos/seed/${member}/32/32`}
                      alt="Team member"
                      className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/50 px-6 py-3">
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
      </div>
    </div>
  );
}
