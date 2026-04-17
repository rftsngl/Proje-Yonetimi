import { Activity, Briefcase, Calendar, CheckCircle, ChevronDown, ChevronRight, Clock, Filter, Info, Layout, Mail, MoreVertical, Search, Trash2, User, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AppRole, Project, TeamMember, UserAuditLogItem } from '../types';
import { DEPARTMENTS } from '../lib/departments';
import { resolveAvatarUrl } from '../lib/avatar';
import ConfirmModal from './ConfirmModal';

interface DropdownProps {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function CustomDropdown({ options, value, onChange, disabled, placeholder, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'hover:border-slate-300'
        }`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-indigo-900/10 custom-scrollbar"
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                  value === option ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                {option || placeholder}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ROLE_OPTIONS: AppRole[] = [
  'Admin',
  'Product Manager',
  'Senior Developer',
  'Frontend Developer',
  'UI/UX Designer',
  'QA Engineer',
];

interface TeamProps {
  members: TeamMember[];
  projects: Project[];
  canInvite?: boolean;
  canManageRoles?: boolean;
  currentUserId?: string;
  onUpdateMemberRole?: (userId: string, role: AppRole) => Promise<void>;
  updatingUserRoleId?: string | null;
  onUpdateMemberDepartment?: (userId: string, department: string) => Promise<void>;
  updatingUserDepartmentId?: string | null;
  auditLogs?: UserAuditLogItem[];
  isAuditLogsLoading?: boolean;
  onDeleteMember?: (userId: string) => Promise<void>;
}

const formatAuditTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('tr-TR');
};

const formatAuditAction = (action: UserAuditLogItem['action']) => {
  switch (action) {
    case 'role_update': return 'Rol Güncelleme';
    case 'department_update': return 'Departman Güncelleme';
    case 'user_deletion': return 'Üye Silme';
    default: return action;
  }
};

export default function Team({
  members,
  canInvite,
  canManageRoles,
  currentUserId,
  onUpdateMemberRole,
  updatingUserRoleId,
  onUpdateMemberDepartment,
  updatingUserDepartmentId,
  auditLogs = [],
  projects,
  isAuditLogsLoading,
  onDeleteMember,
}: TeamProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedMemberForProjects, setSelectedMemberForProjects] = useState<TeamMember | null>(null);
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        !searchQuery ||
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDepartment = !selectedDepartment || member.department === selectedDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [members, searchQuery, selectedDepartment]);

  const handleDeleteMember = async () => {
    if (!memberToDelete || !onDeleteMember) return;

    try {
      await onDeleteMember(memberToDelete.id);
    } catch (error) {
      // Hata App.tsx tarafından yakalanıp modal ile gösterilecek
    } finally {
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ekip Üyeleri</h1>
          <p className="mt-1 text-slate-500">Rolüne göre erişebildiğin ekip üyelerini burada görebilirsin.</p>
        </div>
        {canInvite && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 hover:bg-indigo-700"
            >
              <UserPlus className="h-5 w-5" />
              <span>Üye Davet Et</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="İsim, e-posta veya departman ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-600 transition-all hover:bg-slate-50"
            onClick={() => {
              setSearchQuery('');
              setSelectedDepartment('');
            }}
          >
            <Filter className="h-4 w-4" />
            <span>Temizle</span>
          </button>
          <CustomDropdown
            options={['', ...DEPARTMENTS]}
            value={selectedDepartment}
            onChange={setSelectedDepartment}
            placeholder="Tüm Departmanlar"
            className="min-w-[180px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="absolute right-4 top-4 flex items-center gap-1.5">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  member.status === 'Online' ? 'bg-emerald-500' : member.status === 'Busy' ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{member.status}</span>
            </div>

            <div className="flex items-start gap-4">
              <img
                src={resolveAvatarUrl(member.avatar, 80)}
                alt={member.name}
                className="h-16 w-16 rounded-2xl border-2 border-slate-50 object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-slate-900 transition-colors group-hover:text-indigo-600">{member.name}</h3>
                <p className="truncate text-sm text-slate-500">{member.role}</p>
                <div className="mt-1 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  {member.department}
                </div>
              </div>
            </div>

            {canManageRoles && onUpdateMemberRole && onUpdateMemberDepartment && (
              <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rol Atama</p>
                <CustomDropdown
                  options={ROLE_OPTIONS}
                  value={member.role}
                  disabled={member.id === currentUserId || updatingUserRoleId === member.id}
                  onChange={(nextRole) => {
                    if (nextRole !== member.role) {
                      void onUpdateMemberRole(member.id, nextRole as AppRole);
                    }
                  }}
                  className="w-full"
                />

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Departman</p>
                <CustomDropdown
                  options={DEPARTMENTS}
                  value={member.department}
                  disabled={member.id === currentUserId || updatingUserDepartmentId === member.id}
                  onChange={(nextDepartment) => {
                    if (nextDepartment !== member.department) {
                      void onUpdateMemberDepartment(member.id, nextDepartment);
                    }
                  }}
                  className="w-full"
                />
                {member.id === currentUserId && (
                  <p className="text-[11px] text-slate-500">Kendi rol ve departmanınızı buradan değiştiremezsiniz.</p>
                )}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-50 py-4">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{member.projectsCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proje</p>
              </div>
              <div className="border-l border-slate-50 text-center">
                <p className="text-xl font-bold text-slate-900">{member.tasksCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Görev</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <a
                href={`mailto:${member.email}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-50 py-2.5 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-100"
              >
                <Mail className="h-4 w-4" />
                Mesaj Gönder
              </a>
              <div className="relative">
                <button
                  onClick={() => setActiveMenuId(activeMenuId === member.id ? null : member.id)}
                  className={`rounded-xl p-2.5 transition-all ${
                    activeMenuId === member.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                <AnimatePresence>
                  {activeMenuId === member.id && (
                    <QuickActionMenu
                      member={member}
                      onClose={() => setActiveMenuId(null)}
                      onAction={() => setActiveMenuId(null)}
                      onViewProjects={(m) => setSelectedMemberForProjects(m as any)}
                      onShowProfile={(m) => setSelectedMemberForProfile(m)}
                      onDeleteMember={(m) => {
                        setMemberToDelete(m);
                        setIsDeleteModalOpen(true);
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {canManageRoles && (
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Yönetim İşlem Geçmişi</h2>
            <p className="mt-1 text-sm text-slate-500">Rol ve departman değişikliklerinin kayıtları.</p>
          </div>

          {isAuditLogsLoading ? (
            <p className="text-sm text-slate-500">Kayıtlar yükleniyor...</p>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz kayıt yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2 font-semibold">Zaman</th>
                    <th className="px-3 py-2 font-semibold">İşlemi Yapan</th>
                    <th className="px-3 py-2 font-semibold">Hedef Kullanıcı</th>
                    <th className="px-3 py-2 font-semibold">İşlem</th>
                    <th className="px-3 py-2 font-semibold">Eski</th>
                    <th className="px-3 py-2 font-semibold">Yeni</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 text-slate-700">
                      <td className="whitespace-nowrap px-3 py-2">{formatAuditTime(item.createdAt)}</td>
                      <td className="whitespace-nowrap px-3 py-2">{item.actorName}</td>
                      <td className="whitespace-nowrap px-3 py-2">{item.targetName}</td>
                      <td className="whitespace-nowrap px-3 py-2">{formatAuditAction(item.action)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{item.oldValue || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-indigo-600">
                        {item.action === 'user_deletion' ? '-' : (item.newValue || '-')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {isInviteModalOpen && (
          <InviteMemberModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMemberForProjects && (
          <MemberProjectsModal
            member={selectedMemberForProjects}
            projects={projects.filter((p) => p.team.includes(selectedMemberForProjects.id) || p.manager === selectedMemberForProjects.name)}
            onClose={() => setSelectedMemberForProjects(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMemberForProfile && (
          <MemberProfileModal
            member={selectedMemberForProfile}
            auditLogs={auditLogs.filter((log) => log.targetUserId === selectedMemberForProfile.id)}
            onClose={() => setSelectedMemberForProfile(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Üyeyi Çıkar"
        message={`${memberToDelete?.name} adlı kullanıcıyı sistemden çıkarmak istediğinizden emin misiniz? Bu işlem geri alınamaz ve kullanıcıya ait tüm bildirimler ve görev atamaları silinir.`}
        confirmLabel="Üyeyi Çıkar"
        cancelLabel="Vazgeç"
        onConfirm={handleDeleteMember}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setMemberToDelete(null);
        }}
        isDestructive={true}
        variant="danger"
      />
    </div>
  );
}

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>(ROLE_OPTIONS[3]); // Frontend Dev default
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [step, setStep] = useState<'form' | 'info'>('form');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStep('info');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-white shadow-2xl"
      >
        <div className="absolute right-4 top-4">
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Ekip Üyesi Davet Et</h2>
                  <p className="mt-1 text-slate-500">Yeni üyeyi sisteme dahil etmek için e-posta gönderin.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">İsim Soyisim</label>
                    <input
                      required
                      type="text"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Örn: Ahmet Yılmaz"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">E-posta Adresi</label>
                    <input
                      required
                      type="email"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="email@sirket.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rol</label>
                      <CustomDropdown
                        options={ROLE_OPTIONS}
                        value={role}
                        onChange={(val) => setRole(val as AppRole)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Departman</label>
                      <CustomDropdown
                        options={DEPARTMENTS}
                        value={department}
                        onChange={setDepartment}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-indigo-600 py-3.5 font-bold text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 hover:bg-indigo-700"
                    >
                      Davet Gönder
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="info"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                  <Info className="h-10 w-10 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Özel Davet Kısıtı</h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  Yönetim paneli üzerinden kullanıcıları <span className="font-bold text-indigo-600">özel olarak ekleme</span> veya davet etme özelliği şu an sistem kısıtlamaları nedeniyle aktif değildir.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Lütfen toplu ekleme veya veritabanı entegrasyonu için BT departmanı ile iletişime geçin. Bu alan gelecek sürümlerde aktif edilecektir.
                </p>
                <button
                  onClick={onClose}
                  className="mt-8 w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-all hover:bg-slate-200"
                >
                  Tamam, Anladım
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

interface QuickActionMenuProps {
  member: TeamMember;
  onClose: () => void;
  onAction: () => void;
  onViewProjects: (member: TeamMember) => void;
  onShowProfile: (member: TeamMember) => void;
  onDeleteMember: (member: TeamMember) => void;
}

function QuickActionMenu({ member, onClose, onAction, onViewProjects, onShowProfile, onDeleteMember }: QuickActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const actions = [
    { label: 'Profili Görüntüle', icon: User, onClick: () => { onShowProfile(member); onAction(); } },
    { label: 'Mesaj Gönder', icon: Mail, onClick: () => { window.location.href = `mailto:${member.email}`; onAction(); } },
    { label: 'Projelerini Gör', icon: Layout, onClick: () => { onViewProjects(member); onAction(); } },
    { label: 'Üyeyi Çıkar', icon: Trash2, onClick: () => { onDeleteMember(member); onAction(); }, danger: true },
  ];

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="absolute bottom-full right-0 z-50 mb-2 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-indigo-900/10"
    >
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
            action.danger
              ? 'text-rose-600 hover:bg-rose-50'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
          }`}
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </button>
      ))}
    </motion.div>
  );
}

interface MemberProjectsModalProps {
  member: TeamMember;
  projects: Project[];
  onClose: () => void;
}

function MemberProjectsModal({ member, projects, onClose }: MemberProjectsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <img src={resolveAvatarUrl(member.avatar, 64)} alt={member.name} className="h-12 w-12 rounded-xl object-cover" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">{member.name} - Projeler</h2>
              <p className="text-sm text-slate-500">Dahil olduğu aktif ve tamamlanmış projeler.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <Briefcase className="h-8 w-8" />
              </div>
              <p className="text-lg font-semibold text-slate-900">Henüz Kayıtlı Proje Yok</p>
              <p className="mt-1 text-slate-500">Bu ekip üyesi şu an herhangi bir projede yer almıyor.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div key={project.id} className="group rounded-2xl border border-slate-100 p-4 transition-all hover:border-indigo-100 hover:bg-indigo-50/30">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{project.name}</h3>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          project.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{project.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{project.category}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>İlerleme</span>
                      <span className="text-indigo-600">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        className={`h-full ${project.themeColor || 'bg-indigo-600'}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 p-6">
          <button onClick={onClose} className="w-full rounded-xl bg-white px-4 py-2.5 font-bold text-slate-700 shadow-sm border border-slate-200 transition-all hover:bg-slate-50">
            Kapat
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface MemberProfileModalProps {
  member: TeamMember;
  auditLogs: UserAuditLogItem[];
  onClose: () => void;
}

function MemberProfileModal({ member, auditLogs, onClose }: MemberProfileModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl"
      >
        {/* Simple Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Profile Content */}
        <div className="relative flex-1 overflow-y-auto px-8 py-10 custom-scrollbar">
          <div className="flex items-start justify-between">
            <div className="relative">
              <img
                src={resolveAvatarUrl(member.avatar, 256)}
                alt={member.name}
                className="h-32 w-32 rounded-[2rem] border-4 border-slate-50 object-cover shadow-xl"
              />
              <span className={`absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-white shadow-lg ${
                member.status === 'Online' ? 'bg-emerald-500' : member.status === 'Busy' ? 'bg-amber-500' : 'bg-slate-300'
              }`} />
            </div>
            
            <div className="mt-4 flex gap-3">
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
              >
                <Mail className="h-4 w-4" />
                E-posta Gönder
              </a>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{member.name}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                <Briefcase className="h-4 w-4" />
                {member.role}
              </div>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{member.department}</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-50/30">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Projeler</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{member.projectsCount}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-emerald-50/30">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Görevler</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{member.tasksCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="mt-12">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              <Activity className="h-4 w-4 text-indigo-600" />
              Son Hareketler
            </h3>

            <div className="mt-8 space-y-6">
              {auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 py-16 text-center">
                   <Clock className="h-10 w-10 text-slate-200 mb-3" />
                   <p className="text-sm font-medium text-slate-400">Henüz bir aktivite kaydı bulunmuyor.</p>
                </div>
              ) : (
                <div className="relative space-y-8 before:absolute before:bottom-4 before:left-[11px] before:top-4 before:w-0.5 before:bg-slate-100">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative pl-10">
                      <div className="absolute left-0 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-100 p-1">
                        <Clock className="h-full w-full text-slate-400" />
                      </div>
                      <div className="rounded-[1.5rem] border border-slate-50 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm font-bold text-slate-900">
                          {formatAuditAction(log.action)}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className={`${log.action === 'user_deletion' ? 'text-rose-600 font-bold' : 'text-slate-400 line-through'} text-xs`}>
                            {log.oldValue || 'Boş'}
                          </span>
                          {log.action !== 'user_deletion' && (
                            <>
                              <ChevronRight className="h-4 w-4 text-slate-300" />
                              <span className="rounded-lg bg-indigo-50 px-2 py-1 text-sm font-bold text-indigo-600">{log.newValue}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(log.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                            </div>
                            <span>{new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span>Yapan: {log.actorName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
