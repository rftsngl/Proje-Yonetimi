import { Project, Task, User, ProjectPlanningDetails, ProjectStakeholder, ProjectRequirement, ProjectRisk, ProjectCostItem, ProjectCommunicationPlan, CreateProjectCommunicationPlanPayload, UpdateProjectPayload } from '../types';
import { resolveAvatarUrl } from '../lib/avatar';
import { X, Clock, Briefcase, Trash2, Edit2, ExternalLink, Target, BarChart3, UserPlus, AlignLeft, ShieldAlert, Users, LayoutGrid, Wallet, MessageSquare, Plus, Save, Pencil, Check, Sparkles, FileText } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import {
  getProjectPlanning, getProjectStakeholders, getProjectRequirements, getProjectRisks, getProjectCostItems, getProjectCommunicationPlans,
  createProjectRequirementApi, updateProjectRequirementApi, deleteProjectRequirementApi,
  createProjectRiskApi, updateProjectRiskApi, deleteProjectRiskApi,
  createProjectStakeholder, updateProjectStakeholderApi, deleteProjectStakeholderApi,
  createProjectCostItemApi, updateProjectCostItemApi, deleteProjectCostItemApi,
  createProjectCommunicationPlan, updateProjectCommunicationPlan, deleteProjectCommunicationPlan
} from '../services/dashboard';

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
  onOpenReportHistory?: (projectId: string) => void;
  onUpdateProject?: (projectId: string, payload: UpdateProjectPayload) => Promise<void>;
}

type TabType = 'overview' | 'tasks' | 'requirements' | 'risks' | 'stakeholders' | 'budget' | 'communications';

export default function ProjectDetailModal({
  project, isOpen, onClose, users, tasks, onEdit, onDelete, onViewAllTasks, onOpenWbs, onAddMember, onGenerateReport, onOpenReportHistory, onUpdateProject,
}: ProjectDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProjectPayload | null>(null);

  // Data states
  const [planningDetails, setPlanningDetails] = useState<ProjectPlanningDetails | null>(null);
  const [stakeholders, setStakeholders] = useState<ProjectStakeholder[]>([]);
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [costItems, setCostItems] = useState<ProjectCostItem[]>([]);
  const [commPlans, setCommPlans] = useState<ProjectCommunicationPlan[]>([]);
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
      setIsEditing(false);
      setEditForm(null);
      setIsSavingEdit(false);

      const loadData = async () => {
        setIsLoadingDetails(true);
        try {
          const [planRes, stakeRes, reqRes, riskRes, costRes, commRes] = await Promise.all([
            getProjectPlanning(project.id),
            getProjectStakeholders(project.id),
            getProjectRequirements(project.id),
            getProjectRisks(project.id),
            getProjectCostItems(project.id),
            getProjectCommunicationPlans(project.id),
          ]);
          setPlanningDetails(planRes);
          setStakeholders(stakeRes);
          setRequirements(reqRes);
          setRisks(riskRes);
          setCostItems(costRes);
          setCommPlans(commRes);
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

  const startEditProject = () => {
    if (!project) return;
    setEditForm({
      name: project.name,
      description: project.description,
      category: project.category,
      managerId: project.managerId,
      startDate: project.startDate || undefined,
      endDate: project.endDate || undefined,
    });
    setIsEditing(true);
  };

  const handleSaveProject = async () => {
    if (!project || !editForm || !onUpdateProject) return;
    setIsSavingEdit(true);
    try {
      await onUpdateProject(project.id, editForm);
      setIsEditing(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (!project) return null;

  const criticalRiskCount = risks.filter(r => r.probability * r.impact >= 15).length;
  const totalEstimatedBudget = costItems.reduce((sum, item) => sum + item.estimatedCost, 0);

  const TABS: { id: TabType; label: string; icon: any; count?: number; countLabel?: string; countColor?: string }[] = [
    { id: 'overview', label: 'Genel Bakış', icon: Target },
    { id: 'tasks', label: 'Görevler & WBS', icon: LayoutGrid, count: projectTasks.length },
    { id: 'requirements', label: 'Gereksinimler', icon: AlignLeft, count: requirements.length },
    { id: 'risks', label: 'Riskler', icon: ShieldAlert, count: criticalRiskCount, countLabel: 'Kritik', countColor: 'bg-rose-100 text-rose-700' },
    { id: 'stakeholders', label: 'Paydaşlar', icon: Users, count: stakeholders.length },
    { id: 'budget', label: 'Bütçe', icon: Wallet },
    { id: 'communications', label: 'İletişim Planı', icon: MessageSquare, count: commPlans.length },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            className="relative flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-indigo-900/10"
          >
            {/* Header */}
            <div className="relative shrink-0 border-b border-slate-100 bg-white px-8 py-6">
              <div className="absolute right-6 top-6 flex items-center gap-2">
                <button onClick={onClose} className="rounded-full bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mr-24 flex items-start gap-5">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${project.themeColor || 'bg-indigo-600'} text-white shadow-lg`}>
                  <Briefcase className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div 
                        key="edit-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 max-w-2xl overflow-hidden"
                      >
                        <input className="w-full text-2xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500" value={editForm?.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Proje Adı" />
                        <textarea className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-indigo-500" rows={3} value={editForm?.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Proje Açıklaması" />
                        <div className="flex items-center gap-2">
                          <button onClick={handleSaveProject} disabled={isSavingEdit || !editForm?.name?.trim()} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:bg-indigo-700">Kaydet</button>
                          <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200">İptal</button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="view-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-black text-slate-900">{project.name}</h2>
                          <span className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider ${project.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700' : project.status === 'Aktif' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {project.status}
                          </span>
                          {onUpdateProject && (
                            <button onClick={startEditProject} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-slate-500">{project.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="mt-4 flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500">
                    <div className="flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-slate-400" /> Kategori: {project.category}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> Bitiş: {project.endDate ? new Date(project.endDate).toLocaleDateString('tr-TR') : 'Belirsiz'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-8 py-3 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`group relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeDetailTab"
                        className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-slate-100"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className={`relative z-10 h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="relative z-10">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`relative z-10 ml-1.5 rounded-full px-2 py-0.5 text-[10px] ${tab.countColor || 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}`}>
                        {tab.count} {tab.countLabel || ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/30 p-8">
              {isLoadingDetails ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-8">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-bold text-slate-900">Proje Ekibi</h3>
                              {canManage(project, availableUsers.length) && (
                                <button onClick={() => setIsAddMemberOpen(!isAddMemberOpen)} className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-100">
                                  <UserPlus className="h-4 w-4" /> Ekip Üyesi Ekle
                                </button>
                              )}
                            </div>
                            {isAddMemberOpen && (
                              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <select className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                                  {availableUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                </select>
                                <button disabled={isSavingMember || !selectedUserId} onClick={handleAddMember} className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50">Ekle</button>
                                <button onClick={() => setIsAddMemberOpen(false)} className="rounded-xl bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200"><X className="h-5 w-5" /></button>
                              </div>
                            )}
                            <motion.div 
                              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                              initial="hidden" animate="visible"
                            >
                              {teamMembers.map((member) => (
                                <motion.div 
                                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                                  key={member.id} 
                                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                                >
                                  <img src={resolveAvatarUrl(member.avatar, 40)} alt={member.name} className="h-10 w-10 rounded-xl" referrerPolicy="no-referrer" />
                                  <div>
                                    <p className="font-bold text-slate-900">{member.name}</p>
                                    <p className="text-xs font-medium text-slate-500">{member.role || 'Üye'}</p>
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
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
                              <Sparkles className="h-4 w-4 text-indigo-500" /> Proje Raporu İste
                            </button>
                            <button onClick={() => onOpenReportHistory?.(project.id)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100">
                              <FileText className="h-4 w-4 text-slate-400" /> Geçmiş Raporlar
                            </button>
                            <button onClick={() => onDelete?.(project)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50">
                              <Trash2 className="h-4 w-4" /> Projeyi Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'tasks' && (
                      <div className="space-y-8">
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
                      <RequirementsTab project={project} requirements={requirements} setRequirements={setRequirements} onUpdateProject={onUpdateProject} />
                    )}

                    {activeTab === 'risks' && (
                      <RisksTab project={project} risks={risks} setRisks={setRisks} onUpdateProject={onUpdateProject} />
                    )}

                    {activeTab === 'stakeholders' && (
                      <StakeholdersTab project={project} stakeholders={stakeholders} setStakeholders={setStakeholders} onUpdateProject={onUpdateProject} />
                    )}

                    {activeTab === 'budget' && (
                      <BudgetTab project={project} costItems={costItems} setCostItems={setCostItems} onUpdateProject={onUpdateProject} />
                    )}

                    {activeTab === 'communications' && (
                      <CommunicationPlanTab projectId={project.id} plans={commPlans} users={users} onRefresh={async () => {
                        const fresh = await getProjectCommunicationPlans(project.id);
                        setCommPlans(fresh);
                      }} />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function canManage(project: Project, hasUsers: number) {
  return hasUsers > 0;
}

// ---------------------------------------------------------------------------
// Alt Bileşenler (Tabs)
// ---------------------------------------------------------------------------

function RequirementsTab({ project, requirements, setRequirements, onUpdateProject }: any) {
  const [showAddReq, setShowAddReq] = useState(false);
  const [newReq, setNewReq] = useState({ title: '', description: '', type: 'İşlevsel', priority: 'Must', difficulty: 3, businessValue: 3 });
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [editReq, setEditReq] = useState<any>({});
  const [savingReq, setSavingReq] = useState(false);

  const refreshReqs = async () => { const fresh = await getProjectRequirements(project.id); setRequirements(fresh); };
  
  const handleAddReq = async () => {
    if (!newReq.title.trim() || !newReq.description.trim()) return;
    setSavingReq(true);
    try { 
      await createProjectRequirementApi(project.id, newReq); 
      await refreshReqs(); 
      setShowAddReq(false); 
      setNewReq({ title: '', description: '', type: 'İşlevsel', priority: 'Must', difficulty: 3, businessValue: 3 }); 
    } finally { setSavingReq(false); }
  };
  
  const handleDeleteReq = async (id: string) => { await deleteProjectRequirementApi(project.id, id); await refreshReqs(); };
  
  const handleSaveReq = async () => {
    if (!editingReqId) return;
    setSavingReq(true);
    try { 
      await updateProjectRequirementApi(project.id, editingReqId, editReq); 
      await refreshReqs(); 
      setEditingReqId(null); 
    } finally { setSavingReq(false); }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Gereksinimler (MoSCoW)</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">{requirements.length} Gereksinim</span>
          {onUpdateProject && <button onClick={() => setShowAddReq(!showAddReq)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"><Plus className="h-3.5 w-3.5" /> Ekle</button>}
        </div>
      </div>
      
      {showAddReq && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Başlık *" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={newReq.title} onChange={e => setNewReq({ ...newReq, title: e.target.value })} />
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={newReq.priority} onChange={e => setNewReq({ ...newReq, priority: e.target.value })}>
              {['Must', 'Should', 'Could', 'Won\'t'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <textarea placeholder="Açıklama *" rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:border-indigo-500 focus:outline-none" value={newReq.description} onChange={e => setNewReq({ ...newReq, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={newReq.type} onChange={e => setNewReq({ ...newReq, type: e.target.value })}>
              {['İşlevsel', 'İşlevsel Olmayan', 'Teknik', 'Arayüz'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="flex items-center gap-2"><label className="text-[10px] font-bold text-slate-500">Zorluk</label><input type="number" min={1} max={5} className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-center" value={newReq.difficulty} onChange={e => setNewReq({ ...newReq, difficulty: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2"><label className="text-[10px] font-bold text-slate-500">Değer</label><input type="number" min={1} max={5} className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-center" value={newReq.businessValue} onChange={e => setNewReq({ ...newReq, businessValue: Number(e.target.value) })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowAddReq(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Vazgeç</button>
            <button disabled={savingReq || !newReq.title.trim() || !newReq.description.trim()} onClick={handleAddReq} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{savingReq ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </div>
        </div>
      )}
      
      {requirements.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white no-scrollbar overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
            <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
              <tr><th className="p-4">Başlık & Açıklama</th><th className="p-4 w-28">Öncelik</th><th className="p-4 w-28">Tip</th><th className="p-4 w-20 text-center">Zorluk</th><th className="p-4 w-20 text-center">Değer</th>{onUpdateProject && <th className="p-4 w-20"></th>}</tr>
            </thead>
            <motion.tbody 
              className="divide-y divide-slate-100"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden" animate="visible"
            >
              {requirements.map((r: any) => editingReqId === r.id ? (
                <tr key={r.id} className="bg-indigo-50/30">
                  <td className="p-3">
                    <input className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm mb-2" value={editReq.title || ''} onChange={e => setEditReq({ ...editReq, title: e.target.value })} />
                    <textarea className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs resize-none" rows={2} value={editReq.description || ''} onChange={e => setEditReq({ ...editReq, description: e.target.value })} />
                  </td>
                  <td className="p-3"><select className="rounded-lg border border-slate-200 bg-white px-1 py-1 text-xs" value={editReq.priority || 'Must'} onChange={e => setEditReq({ ...editReq, priority: e.target.value })}>{['Must', 'Should', 'Could', 'Won\'t'].map(p => <option key={p} value={p}>{p}</option>)}</select></td>
                  <td className="p-3"><select className="rounded-lg border border-slate-200 bg-white px-1 py-1 text-xs" value={editReq.type || 'İşlevsel'} onChange={e => setEditReq({ ...editReq, type: e.target.value })}>{['İşlevsel', 'İşlevsel Olmayan', 'Teknik', 'Arayüz'].map(t => <option key={t} value={t}>{t}</option>)}</select></td>
                  <td className="p-3"><input type="number" min={1} max={5} className="w-12 mx-auto block rounded-lg border border-slate-200 bg-white px-1 py-1 text-xs text-center" value={editReq.difficulty || 3} onChange={e => setEditReq({ ...editReq, difficulty: Number(e.target.value) })} /></td>
                  <td className="p-3"><input type="number" min={1} max={5} className="w-12 mx-auto block rounded-lg border border-slate-200 bg-white px-1 py-1 text-xs text-center" value={editReq.businessValue || 3} onChange={e => setEditReq({ ...editReq, businessValue: Number(e.target.value) })} /></td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <button disabled={savingReq} onClick={handleSaveReq} className="text-emerald-600 hover:bg-emerald-50 rounded p-1"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingReqId(null)} className="text-slate-400 hover:bg-slate-100 rounded p-1"><X className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <motion.tr 
                  variants={{ hidden: { opacity: 0, x: -5 }, visible: { opacity: 1, x: 0 } }}
                  key={r.id} className="hover:bg-slate-50 group transition-colors"
                >
                  <td className="p-4"><p className="font-bold text-slate-900">{r.title}</p><p className="text-xs mt-1">{r.description}</p></td>
                  <td className="p-4"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${r.priority === 'Must' ? 'bg-rose-100 text-rose-700' : r.priority === 'Should' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{r.priority}</span></td>
                  <td className="p-4">{r.type}</td>
                  <td className="p-4 text-center font-medium">{r.difficulty}/5</td>
                  <td className="p-4 text-center font-medium">{r.businessValue}/5</td>
                  {onUpdateProject && (
                    <td className="p-4">
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 justify-end transition-opacity">
                        <button onClick={() => { setEditingReqId(r.id); setEditReq({ title: r.title, description: r.description, type: r.type, priority: r.priority, difficulty: r.difficulty, businessValue: r.businessValue }); }} className="text-indigo-600 hover:bg-indigo-50 rounded p-1.5"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteReq(r.id)} className="text-rose-500 hover:bg-rose-50 rounded p-1.5"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">Henüz gereksinim eklenmemiş.</div>
      )}
    </div>
  );
}

function RisksTab({ project, risks, setRisks, onUpdateProject }: any) {
  const [showAddRisk, setShowAddRisk] = useState(false);
  const [newRisk, setNewRisk] = useState({ title: '', category: 'Teknik', probability: 3, impact: 3, mitigation: '', contingency: '' });
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [editRisk, setEditRisk] = useState<any>({});
  const [savingRisk, setSavingRisk] = useState(false);

  const refreshRisks = async () => { const fresh = await getProjectRisks(project.id); setRisks(fresh); };
  
  const handleAddRisk = async () => {
    if (!newRisk.title.trim() || !newRisk.category.trim()) return;
    setSavingRisk(true);
    try { 
      await createProjectRiskApi(project.id, newRisk); 
      await refreshRisks(); 
      setShowAddRisk(false); 
      setNewRisk({ title: '', category: 'Teknik', probability: 3, impact: 3, mitigation: '', contingency: '' }); 
    } finally { setSavingRisk(false); }
  };

  const handleDeleteRisk = async (id: string) => { await deleteProjectRiskApi(project.id, id); await refreshRisks(); };
  
  const handleSaveRisk = async () => {
    if (!editingRiskId) return; 
    setSavingRisk(true);
    try { 
      await updateProjectRiskApi(project.id, editingRiskId, editRisk); 
      await refreshRisks(); 
      setEditingRiskId(null); 
    } finally { setSavingRisk(false); }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Risk Kaydı (Risk Register)</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">{risks.length} Risk</span>
          {onUpdateProject && <button onClick={() => setShowAddRisk(!showAddRisk)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"><Plus className="h-3.5 w-3.5" /> Ekle</button>}
        </div>
      </div>
      
      {showAddRisk && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Risk Başlığı *" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={newRisk.title} onChange={e => setNewRisk({ ...newRisk, title: e.target.value })} />
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={newRisk.category} onChange={e => setNewRisk({ ...newRisk, category: e.target.value })}>
              {['Teknik', 'İş', 'Maliyet', 'Zaman', 'Operasyonel'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <textarea placeholder="Azaltma Planı (Mitigation)" rows={2} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:border-indigo-500 focus:outline-none" value={newRisk.mitigation} onChange={e => setNewRisk({ ...newRisk, mitigation: e.target.value })} />
            <textarea placeholder="B Planı (Contingency)" rows={2} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:border-indigo-500 focus:outline-none" value={newRisk.contingency} onChange={e => setNewRisk({ ...newRisk, contingency: e.target.value })} />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><label className="text-xs font-bold text-slate-500">Olasılık (1-5)</label><input type="number" min={1} max={5} className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-center" value={newRisk.probability} onChange={e => setNewRisk({ ...newRisk, probability: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2"><label className="text-xs font-bold text-slate-500">Etki (1-5)</label><input type="number" min={1} max={5} className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-center" value={newRisk.impact} onChange={e => setNewRisk({ ...newRisk, impact: Number(e.target.value) })} /></div>
            <div className="flex-1 flex justify-end gap-2">
              <button onClick={() => setShowAddRisk(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Vazgeç</button>
              <button disabled={savingRisk || !newRisk.title.trim()} onClick={handleAddRisk} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{savingRisk ? 'Kaydediliyor...' : 'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}

      {risks.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white no-scrollbar overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[700px]">
            <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
              <tr><th className="p-4">Risk Başlığı</th><th className="p-4 w-32">Kategori</th><th className="p-4 w-24 text-center">Skor</th><th className="p-4">Planlar (Azaltma / B Planı)</th>{onUpdateProject && <th className="p-4 w-20"></th>}</tr>
            </thead>
            <motion.tbody 
              className="divide-y divide-slate-100"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden" animate="visible"
            >
              {risks.map((r: any) => editingRiskId === r.id ? (
                <tr key={r.id} className="bg-indigo-50/30">
                  <td className="p-3"><input className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm" value={editRisk.title || ''} onChange={e => setEditRisk({ ...editRisk, title: e.target.value })} /></td>
                  <td className="p-3"><select className="w-full rounded-lg border border-slate-200 bg-white px-1 py-1 text-xs" value={editRisk.category || 'Teknik'} onChange={e => setEditRisk({ ...editRisk, category: e.target.value })}>{['Teknik', 'İş', 'Maliyet', 'Zaman', 'Operasyonel'].map(c => <option key={c} value={c}>{c}</option>)}</select></td>
                  <td className="p-3 flex items-center justify-center gap-1">
                    <input type="number" min={1} max={5} className="w-10 rounded border border-slate-200 p-1 text-xs text-center" value={editRisk.probability || 3} onChange={e => setEditRisk({ ...editRisk, probability: Number(e.target.value) })} title="Olasılık" />
                    x
                    <input type="number" min={1} max={5} className="w-10 rounded border border-slate-200 p-1 text-xs text-center" value={editRisk.impact || 3} onChange={e => setEditRisk({ ...editRisk, impact: Number(e.target.value) })} title="Etki" />
                  </td>
                  <td className="p-3 space-y-1">
                    <input className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs" placeholder="Azaltma Planı" value={editRisk.mitigation || ''} onChange={e => setEditRisk({ ...editRisk, mitigation: e.target.value })} />
                    <input className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs" placeholder="B Planı" value={editRisk.contingency || ''} onChange={e => setEditRisk({ ...editRisk, contingency: e.target.value })} />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <button disabled={savingRisk} onClick={handleSaveRisk} className="text-emerald-600 hover:bg-emerald-50 rounded p-1"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingRiskId(null)} className="text-slate-400 hover:bg-slate-100 rounded p-1"><X className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <motion.tr 
                  variants={{ hidden: { opacity: 0, x: -5 }, visible: { opacity: 1, x: 0 } }}
                  key={r.id} className="hover:bg-slate-50 group transition-colors"
                >
                  <td className="p-4 font-bold text-slate-900">{r.title}</td>
                  <td className="p-4">{r.category}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${r.probability * r.impact >= 15 ? 'bg-rose-100 text-rose-700' : r.probability * r.impact >= 8 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {r.probability * r.impact}
                    </span>
                  </td>
                  <td className="p-4 text-xs space-y-1">
                    {r.mitigation && <div><span className="font-semibold text-slate-700">Azaltma:</span> {r.mitigation}</div>}
                    {r.contingency && <div><span className="font-semibold text-slate-700">B Planı:</span> {r.contingency}</div>}
                    {(!r.mitigation && !r.contingency) && <span className="text-slate-400">-</span>}
                  </td>
                  {onUpdateProject && (
                    <td className="p-4">
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 justify-end transition-opacity">
                        <button onClick={() => { setEditingRiskId(r.id); setEditRisk({ title: r.title, category: r.category, probability: r.probability, impact: r.impact, mitigation: r.mitigation, contingency: r.contingency }); }} className="text-indigo-600 hover:bg-indigo-50 rounded p-1.5"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteRisk(r.id)} className="text-rose-500 hover:bg-rose-50 rounded p-1.5"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">Henüz risk eklenmemiş.</div>
      )}
    </div>
  );
}

function StakeholdersTab({ project, stakeholders, setStakeholders, onUpdateProject }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', role: '', interest: 'High', power: 'High', expectation: '', communicationMethod: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const refreshItems = async () => { const fresh = await getProjectStakeholders(project.id); setStakeholders(fresh); };
  
  const handleAdd = async () => {
    if (!newItem.name.trim() || !newItem.role.trim()) return;
    setIsSaving(true);
    try { 
      await createProjectStakeholder(project.id, newItem); 
      await refreshItems(); 
      setShowAdd(false); 
      setNewItem({ name: '', role: '', interest: 'High', power: 'High', expectation: '', communicationMethod: '' }); 
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => { await deleteProjectStakeholderApi(project.id, id); await refreshItems(); };
  
  const handleSave = async () => {
    if (!editingId) return; 
    setIsSaving(true);
    try { 
      await updateProjectStakeholderApi(project.id, editingId, editItem); 
      await refreshItems(); 
      setEditingId(null); 
    } finally { setIsSaving(false); }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Paydaşlar</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{stakeholders.length} Paydaş</span>
          {onUpdateProject && <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"><Plus className="h-3.5 w-3.5" /> Ekle</button>}
        </div>
      </div>
      
      {showAdd && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Ad Soyad *" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            <input placeholder="Rol / Unvan *" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={newItem.role} onChange={e => setNewItem({ ...newItem, role: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">İlgi Seviyesi</label>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={newItem.interest} onChange={e => setNewItem({ ...newItem, interest: e.target.value })}>{['High', 'Medium', 'Low'].map(o => <option key={o} value={o}>{o}</option>)}</select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Güç / Etki</label>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={newItem.power} onChange={e => setNewItem({ ...newItem, power: e.target.value })}>{['High', 'Medium', 'Low'].map(o => <option key={o} value={o}>{o}</option>)}</select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Beklenti</label>
              <input placeholder="Paydaşın temel beklentisi" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={newItem.expectation} onChange={e => setNewItem({ ...newItem, expectation: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowAdd(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Vazgeç</button>
            <button disabled={isSaving || !newItem.name.trim() || !newItem.role.trim()} onClick={handleAdd} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </div>
        </div>
      )}

      {stakeholders.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden" animate="visible"
        >
          {stakeholders.map((s: any) => editingId === s.id ? (
            <div key={s.id} className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 space-y-3">
               <input className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm font-bold" value={editItem.name || ''} onChange={e => setEditItem({ ...editItem, name: e.target.value })} placeholder="Ad Soyad" />
               <input className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm" value={editItem.role || ''} onChange={e => setEditItem({ ...editItem, role: e.target.value })} placeholder="Rol / Unvan" />
               <div className="grid grid-cols-2 gap-2">
                 <select className="rounded border border-slate-200 bg-white px-2 py-1 text-xs" value={editItem.interest || 'High'} onChange={e => setEditItem({ ...editItem, interest: e.target.value })}>{['High', 'Medium', 'Low'].map(o => <option key={o} value={o}>{o}</option>)}</select>
                 <select className="rounded border border-slate-200 bg-white px-2 py-1 text-xs" value={editItem.power || 'High'} onChange={e => setEditItem({ ...editItem, power: e.target.value })}>{['High', 'Medium', 'Low'].map(o => <option key={o} value={o}>{o}</option>)}</select>
               </div>
               <textarea className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs resize-none" rows={2} value={editItem.expectation || ''} onChange={e => setEditItem({ ...editItem, expectation: e.target.value })} placeholder="Beklenti" />
               <div className="flex gap-2 justify-end pt-2">
                 <button disabled={isSaving} onClick={handleSave} className="rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700">Kaydet</button>
                 <button onClick={() => setEditingId(null)} className="rounded bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-300">İptal</button>
               </div>
            </div>
          ) : (
            <motion.div 
              variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
              key={s.id} className="group relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:border-indigo-100 transition-colors"
            >
              {onUpdateProject && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button onClick={() => { setEditingId(s.id); setEditItem({ name: s.name, role: s.role, interest: s.interest, power: s.power, expectation: s.expectation }); }} className="text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg p-1.5"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg p-1.5"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )}
              <h4 className="font-bold text-slate-900 text-lg pr-12">{s.name}</h4>
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
                    <p className="text-slate-900 leading-relaxed text-xs">{s.expectation}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">Henüz paydaş eklenmemiş.</div>
      )}
    </div>
  );
}

function BudgetTab({ project, costItems, setCostItems, onUpdateProject }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', category: 'Yazılım', estimatedCost: 0, currency: 'TRY' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const refreshItems = async () => { const fresh = await getProjectCostItems(project.id); setCostItems(fresh); };
  
  const handleAdd = async () => {
    if (!newItem.title.trim() || newItem.estimatedCost <= 0) return;
    setIsSaving(true);
    try { 
      await createProjectCostItemApi(project.id, newItem); 
      await refreshItems(); 
      setShowAdd(false); 
      setNewItem({ title: '', category: 'Yazılım', estimatedCost: 0, currency: 'TRY' }); 
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => { await deleteProjectCostItemApi(project.id, id); await refreshItems(); };
  
  const handleSave = async () => {
    if (!editingId) return; 
    setIsSaving(true);
    try { 
      await updateProjectCostItemApi(project.id, editingId, editItem); 
      await refreshItems(); 
      setEditingId(null); 
    } finally { setIsSaving(false); }
  };

  const total = costItems.reduce((acc: number, c: any) => acc + (Number(c.estimatedCost) || 0), 0);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Bütçe ve Maliyetler</h3>
        <div className="flex items-center gap-2">
          {onUpdateProject && <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"><Plus className="h-3.5 w-3.5" /> Ekle</button>}
        </div>
      </div>

      <div className="rounded-3xl bg-indigo-50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-indigo-900/60 uppercase tracking-wider mb-1">Toplam Tahmini Bütçe</p>
          <p className="text-3xl font-black text-indigo-700">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(total)}</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm"><Wallet className="h-6 w-6" /></div>
        </div>
      </div>
      
      {showAdd && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input placeholder="Kalem Açıklaması *" className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
              {['Yazılım', 'Donanım', 'Hizmet', 'Lisans', 'Diğer'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="relative">
              <input type="number" placeholder="Tutar *" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm pr-12 focus:border-indigo-500 focus:outline-none" value={newItem.estimatedCost || ''} onChange={e => setNewItem({ ...newItem, estimatedCost: Number(e.target.value) })} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">TRY</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowAdd(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Vazgeç</button>
            <button disabled={isSaving || !newItem.title.trim() || newItem.estimatedCost <= 0} onClick={handleAdd} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </div>
        </div>
      )}

      {costItems.length > 0 ? (
        <motion.div 
          className="space-y-3"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden" animate="visible"
        >
          {costItems.map((c: any) => editingId === c.id ? (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
               <input className="flex-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm" value={editItem.title || ''} onChange={e => setEditItem({ ...editItem, title: e.target.value })} />
               <select className="w-32 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm" value={editItem.category || 'Yazılım'} onChange={e => setEditItem({ ...editItem, category: e.target.value })}>{['Yazılım', 'Donanım', 'Hizmet', 'Lisans', 'Diğer'].map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
               <input type="number" className="w-32 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-right" value={editItem.estimatedCost || 0} onChange={e => setEditItem({ ...editItem, estimatedCost: Number(e.target.value) })} />
               <div className="flex gap-1 ml-2">
                 <button disabled={isSaving} onClick={handleSave} className="text-emerald-600 hover:bg-emerald-50 rounded p-1.5"><Check className="h-4 w-4" /></button>
                 <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 rounded p-1.5"><X className="h-4 w-4" /></button>
               </div>
            </div>
          ) : (
            <motion.div 
              variants={{ hidden: { opacity: 0, x: -5 }, visible: { opacity: 1, x: 0 } }}
              key={c.id} className="group flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-indigo-100"
            >
              <div>
                <span className="font-bold text-slate-900 block">{c.title}</span>
                <span className="text-xs text-slate-500">{c.category}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-bold text-slate-900 text-lg">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: c.currency || 'TRY' }).format(c.estimatedCost)}</span>
                {onUpdateProject && (
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    <button onClick={() => { setEditingId(c.id); setEditItem({ title: c.title, category: c.category, estimatedCost: c.estimatedCost, currency: c.currency }); }} className="text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg p-1.5"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg p-1.5"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">Henüz maliyet kalemi eklenmemiş.</div>
      )}
    </div>
  );
}

function CommunicationPlanTab({ projectId, plans, users, onRefresh }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<any>({ meetingType: '', frequency: '', channel: '', participants: '', responsibleUserId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const FREQUENCY_OPTIONS = ['Günlük', 'Haftalık', 'İki Haftada Bir', 'Aylık', 'İhtiyaç Halinde'];
  const CHANNEL_OPTIONS = ['Toplantı Odası', 'Zoom/Teams', 'E-posta', 'Slack/Discord', 'Proje Panosu'];

  const handleAdd = async () => {
    if (!form.meetingType.trim()) return;
    setIsSaving(true);
    try {
      await createProjectCommunicationPlan(projectId, form);
      await onRefresh();
      setIsAdding(false);
      setForm({ meetingType: '', frequency: '', channel: '', participants: '', responsibleUserId: '' });
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleUpdate = async (id: string) => {
    setIsSaving(true);
    try {
      await updateProjectCommunicationPlan(projectId, id, form);
      await onRefresh();
      setEditingId(null);
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    try {
      await deleteProjectCommunicationPlan(projectId, id);
      await onRefresh();
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const startEdit = (plan: any) => {
    setForm({ meetingType: plan.meetingType, frequency: plan.frequency, channel: plan.channel, participants: plan.participants, responsibleUserId: plan.responsibleUserId || '' });
    setEditingId(plan.id);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">İletişim Planı</h3>
        <button onClick={() => { setIsAdding(true); setEditingId(null); setForm({ meetingType: '', frequency: '', channel: '', participants: '', responsibleUserId: '' }); }} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Yeni Toplantı Ekle
        </button>
      </div>

      {isAdding && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
             <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Toplantı Türü (örn: Daily Scrum)" value={form.meetingType} onChange={e => setForm({ ...form, meetingType: e.target.value })} />
             <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
               <option value="">Sıklık Seçin</option>
               {FREQUENCY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
             </select>
             <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>
               <option value="">Kanal Seçin</option>
               {CHANNEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
             </select>
             <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={form.responsibleUserId} onChange={e => setForm({ ...form, responsibleUserId: e.target.value })}>
               <option value="">Sorumlu Seçin</option>
               {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>
          </div>
          <input className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm mb-3" placeholder="Katılımcılar (örn: Tüm Ekip, Yazılım Ekibi)" value={form.participants} onChange={e => setForm({ ...form, participants: e.target.value })} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl">Vazgeç</button>
            <button disabled={isSaving || !form.meetingType} onClick={handleAdd} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">Kaydet</button>
          </div>
        </div>
      )}

      {plans.length > 0 ? (
        <motion.div 
          className="space-y-3"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden" animate="visible"
        >
          {plans.map((plan: any) => (
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              key={plan.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              {editingId === plan.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={form.meetingType} onChange={e => setForm({ ...form, meetingType: e.target.value })} />
                    <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option value="">Sıklık Seçin</option>{FREQUENCY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                    <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}><option value="">Kanal Seçin</option>{CHANNEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                    <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={form.responsibleUserId} onChange={e => setForm({ ...form, responsibleUserId: e.target.value })}><option value="">Sorumlu Seçin</option>{users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                  </div>
                  <input className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={form.participants} onChange={e => setForm({ ...form, participants: e.target.value })} />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl">Vazgeç</button>
                    <button disabled={isSaving} onClick={() => handleUpdate(plan.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">Güncelle</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-slate-900">{plan.meetingType}</h4>
                      {plan.frequency && <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{plan.frequency}</span>}
                      {plan.channel && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{plan.channel}</span>}
                    </div>
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-4">
                      {plan.responsibleUserName && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> <span className="font-medium text-slate-700">{plan.responsibleUserName}</span></span>}
                      {plan.participants && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {plan.participants}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(plan)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(plan.id)} disabled={isSaving} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">Henüz iletişim planı oluşturulmamış.</div>
      )}
    </div>
  );
}
