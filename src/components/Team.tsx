import { Filter, Mail, MoreVertical, Search, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { AppRole, TeamMember, UserAuditLogItem } from '../types';
import { DEPARTMENTS } from '../lib/departments';

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
  canInvite?: boolean;
  canManageRoles?: boolean;
  currentUserId?: string;
  onUpdateMemberRole?: (userId: string, role: AppRole) => Promise<void>;
  updatingUserRoleId?: string | null;
  onUpdateMemberDepartment?: (userId: string, department: string) => Promise<void>;
  updatingUserDepartmentId?: string | null;
  auditLogs?: UserAuditLogItem[];
  isAuditLogsLoading?: boolean;
}

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
  isAuditLogsLoading,
}: TeamProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

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

  const formatAuditAction = (action: UserAuditLogItem['action']) =>
    action === 'role_update' ? 'Rol Güncelleme' : 'Departman Güncelleme';

  const formatAuditTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString('tr-TR');
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
            <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 hover:bg-indigo-700">
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
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-600 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Tüm Departmanlar</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
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
                src={`https://picsum.photos/seed/${member.avatar}/80/80`}
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
                <select
                  value={member.role}
                  disabled={member.id === currentUserId || updatingUserRoleId === member.id}
                  onChange={(event) => {
                    const nextRole = event.target.value as AppRole;
                    if (nextRole !== member.role) {
                      void onUpdateMemberRole(member.id, nextRole);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Departman</p>
                <select
                  value={member.department}
                  disabled={member.id === currentUserId || updatingUserDepartmentId === member.id}
                  onChange={(event) => {
                    const nextDepartment = event.target.value;
                    if (nextDepartment !== member.department) {
                      void onUpdateMemberDepartment(member.id, nextDepartment);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
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
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-50 py-2.5 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-100">
                <Mail className="h-4 w-4" />
                Mesaj Gönder
              </button>
              <button className="rounded-xl bg-slate-50 p-2.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
                <MoreVertical className="h-5 w-5" />
              </button>
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
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-indigo-600">{item.newValue || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
