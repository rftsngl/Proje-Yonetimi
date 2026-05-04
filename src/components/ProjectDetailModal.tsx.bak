import { Project, Task, User, ProjectPlanningDetails, ProjectStakeholder, ProjectRequirement, ProjectRisk } from '../types';
import { resolveAvatarUrl } from '../lib/avatar';
import { X, Clock, Briefcase, Trash2, Edit2, ExternalLink, Target, BarChart3, UserPlus, AlignLeft, ShieldAlert, Users, LayoutGrid } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { getProjectPlanning, getProjectStakeholders, getProjectRequirements, getProjectRisks } from '../services/dashboard';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  tasks: Task[];
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onViewAllTasks?: (project: Project) => void;
  onOpenWbs?: (project: Project) => void;
  onAddMember?: (project: Project, userId: string) => Promise<void>;
  onGenerateReport?: (projectId: string) => void;
}

type TabType = 'overview' | 'tasks' | 'requirements' | 'risks' | 'stakeholders';

export default function ProjectDetailModal({
  project, isOpen, onClose, users, tasks, onEdit, onDelete, onViewAllTasks, onOpenWbs, onAddMember, onGenerateReport,
}: ProjectDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  // Data states
  const [planningDetails, setPlanningDetails] = useState<ProjectPlanningDetails | null>(null);
  const [stakeholders, setStakeholders] = useState<ProjectStakeholder[]>([]);
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const teamMembers = useMemo(() => project ? users.filter((u) => project.team.includes(u.id)) : [], [users, project]);
  const projectTasks = useMemo(() => project ? tasks.filter((t) => t.projectId === project.id) : [], [tasks, project]);
  const availableUsers = useMemo(() => project ? users.filter((u) => !project.team.includes(u.id)) : [], [users, project]);

  useEffect(() => {
    if (isOpen && project) {
      setActiveTab('overview');
      setSelectedUserId(availableUsers[0]?.id || '');
      setIsAddMemberOpen(false);
      setIsSavingMember(false);

      const loadData = async () => {
        setIsLoadingDetails(true);
        try {
          const [planRes, stakeRes, reqRes, riskRes] = await Promise.all([
            getProjectPlanning(project.id),
            getProjectStakeholders(project.id),
            getProjectRequirements(project.id),
            getProjectRisks(project.id),
          ]);
          setPlanningDetails(planRes);
          setStakeholders(stakeRes);
          setRequirements(reqRes);
          setRisks(riskRes);
        } catch (error) {
          console.error("Detaylar yüklenirken hata:", error);
        } finally {
          setIsLoadingDetails(false);
        }
      };
      loadData();
    }
  }, [isOpen, project, availableUsers]);

  const handleAddMember = async () => {
    if (!selectedUserId || !onAddMember || !project) return;
    setIsSavingMember(true);
    try {
      await onAddMember(project, selectedUserId);
      setIsAddMemberOpen(false);
    } finally {
      setIsSavingMember(false);
    }
  };

  if (!project) return null;

  const TABS: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Genel Bakış', icon: Target },
    { id: 'tasks', label: 'Görevler & WBS', icon: LayoutGrid },
    { id: 'requirements', label: 'Gereksinimler', icon: AlignLeft },
    { id: 'risks', label: 'Riskler', icon: ShieldAlert },
    { id: 'stakeholders', label: 'Paydaşlar', icon: Users },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-indigo-900/10">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${project.status === 'Aktif' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {project.status}
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{project.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit?.(project)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700">
                    <Edit2 className="h-4 w-4" /> Düzenle
                  </button>
                  <button onClick={onClose} className="ml-2 rounded-xl p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Tabs Container */}
              <div className="flex gap-6 px-8 overflow-x-auto no-scrollbar border-t border-slate-50 pt-2">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-bold transition-all ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                      <Icon className="h-4 w-4" /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
              {isLoadingDetails ? (
                <div className="flex h-40 items-center justify-center text-slate-400">Yükleniyor...</div>
              ) : (
                <>
                  {activeTab === 'overview' && (
                    <div className="animate-in fade-in slide-in-from-right-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
                      <div className="space-y-8 lg:col-span-2">
                        <div>
                          <h2 className="text-4xl font-bold leading-tight text-slate-900">{project.name}</h2>
                          <p className="mt-2 text-lg font-medium text-slate-500">{project.category}</p>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold text-slate-900">Proje Özeti</h3>
                          <p className="text-lg leading-relaxed text-slate-600">{project.description}</p>
                        </div>
                        {planningDetails && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            {planningDetails.problemStatement && (
                              <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-900 mb-2">Problem Tanımı</h4>
                                <p className="text-sm text-slate-600">{planningDetails.problemStatement}</p>
                              </div>
                            )}
                            {planningDetails.inScope && (
                              <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-900 mb-2">Kapsam İçi</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">{planningDetails.inScope}</p>
                              </div>
                            )}
                            {planningDetails.outOfScope && (
                              <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-900 mb-2">Kapsam Dışı</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">{planningDetails.outOfScope}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Proje Yöneticisi</h4>
                          <div className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                            <img src={resolveAvatarUrl(project.managerAvatar, 48)} alt={project.manager} className="h-12 w-12 rounded-2xl" referrerPolicy="no-referrer" />
                            <div>
                              <p className="text-sm font-bold text-slate-900">{project.manager}</p>
                              <p className="text-xs font-medium text-slate-500">Lider</p>
                            </div>
                          </div>
                        </div>
                        {planningDetails?.feasibilityScore != null && (
                          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                            <p className="text-sm font-bold text-slate-500 mb-2">Fizibilite Skoru</p>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${planningDetails.feasibilityScore > 70 ? 'bg-emerald-500' : planningDetails.feasibilityScore > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${planningDetails.feasibilityScore}%` }} />
                              </div>
                              <span className="font-bold text-slate-900">{planningDetails.feasibilityScore}/100</span>
                            </div>
                          </div>
                        )}
                        <div className="space-y-3 border-t border-slate-100 pt-8">
                          <button onClick={() => onGenerateReport?.(project.id)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100">
                            <Briefcase className="h-4 w-4" /> Proje Raporu Al
                          </button>
                          <button onClick={() => onDelete?.(project)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50">
                            <Trash2 className="h-4 w-4" /> Projeyi Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tasks' && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-8">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50"><Target className="h-5 w-5 text-indigo-600" /></div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">İlerleme</p>
                          <p className="mt-1 text-2xl font-bold text-slate-900">%{project.progress}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50"><Clock className="h-5 w-5 text-rose-600" /></div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Kalan Süre</p>
                          <p className="mt-1 text-2xl font-bold text-slate-900">{project.daysLeft} Gün</p>
                        </div>
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50"><BarChart3 className="h-5 w-5 text-emerald-600" /></div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Görevler</p>
                          <p className="mt-1 text-2xl font-bold text-slate-900">{projectTasks.length}</p>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-slate-900">Görev Listesi</h3>
                          <div className="flex items-center gap-3">
                            <button onClick={() => onOpenWbs?.(project)} className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100">WBS Şeması</button>
                            <button onClick={() => onViewAllTasks?.(project)} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800">Tümünü Yönet <ExternalLink className="h-4 w-4" /></button>
                          </div>
                        </div>
                        {projectTasks.length > 0 ? (
                          <div className="space-y-3">
                            {projectTasks.slice(0, 5).map((task) => (
                              <div key={task.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-indigo-200">
                                <div className="flex items-center gap-4">
                                  <div className={`h-2 w-2 rounded-full ${task.status === 'Tamamlandı' ? 'bg-emerald-500' : task.status === 'Devam Ediyor' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{task.title}</p>
                                    <p className="text-xs font-medium text-slate-400">{task.date}</p>
                                  </div>
                                </div>
                                <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${task.priority === 'Yüksek' ? 'bg-rose-50 text-rose-600' : 'bg-slate-200 text-slate-700'}`}>{task.priority}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">Henüz görev eklenmemiş.</p>
                        )}
                      </div>
                    </div>
                  )}
                  {activeTab === 'requirements' && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">Gereksinimler (MoSCoW)</h3>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">{requirements.length} Gereksinim</span>
                      </div>
                      {requirements.length > 0 ? (
                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                          <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                              <tr><th className="p-4">Başlık & Açıklama</th><th className="p-4 w-32">Öncelik</th><th className="p-4 w-32">Tip</th><th className="p-4 w-24">Zorluk</th><th className="p-4 w-24">Değer</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {requirements.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="p-4">
                                    <p className="font-bold text-slate-900">{r.title}</p>
                                    <p className="text-xs mt-1">{r.description}</p>
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${r.priority === 'Must' ? 'bg-rose-100 text-rose-700' : r.priority === 'Should' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{r.priority}</span>
                                  </td>
                                  <td className="p-4">{r.type}</td>
                                  <td className="p-4">{r.difficulty}/5</td>
                                  <td className="p-4">{r.businessValue}/5</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">Henüz gereksinim eklenmemiş.</div>
                      )}
                    </div>
                  )}

                  {activeTab === 'risks' && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">Risk Kaydı (Risk Register)</h3>
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">{risks.length} Risk</span>
                      </div>
                      {risks.length > 0 ? (
                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                          <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                              <tr><th className="p-4">Risk Başlığı</th><th className="p-4 w-32">Kategori</th><th className="p-4 w-24">Skor</th><th className="p-4">Azaltma / B Planı</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {risks.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="p-4 font-bold text-slate-900">{r.title}</td>
                                  <td className="p-4">{r.category}</td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${r.probability * r.impact >= 15 ? 'bg-rose-100 text-rose-700' : r.probability * r.impact >= 8 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {r.probability * r.impact}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-xs">{r.mitigation || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">Henüz risk eklenmemiş.</div>
                      )}
                    </div>
                  )}

                  {activeTab === 'stakeholders' && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">Paydaşlar</h3>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{stakeholders.length} Paydaş</span>
                      </div>
                      {stakeholders.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {stakeholders.map((s, i) => (
                            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                              <h4 className="font-bold text-slate-900 text-lg">{s.name}</h4>
                              <p className="text-sm text-indigo-600 font-medium mb-4">{s.role}</p>
                              
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">İlgi Seviyesi:</span>
                                  <span className="font-medium text-slate-900">{s.interest}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Güç/Etki:</span>
                                  <span className="font-medium text-slate-900">{s.power}</span>
                                </div>
                                {s.expectation && (
                                  <div className="pt-2 border-t border-slate-50">
                                    <span className="text-slate-500 block text-xs mb-1">Beklenti:</span>
                                    <p className="text-slate-900">{s.expectation}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">Henüz paydaş eklenmemiş.</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
