import { Filter, Mail, MoreVertical, Search, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { TeamMember } from '../types';

interface TeamProps {
  members: TeamMember[];
  canInvite?: boolean;
}

export default function Team({ members, canInvite }: TeamProps) {
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
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-600 transition-all hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            <span>Filtrele</span>
          </button>
          <select className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-600 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option>Tüm Departmanlar</option>
            <option>Yazılım</option>
            <option>Tasarım</option>
            <option>Yönetim</option>
            <option>Ürün</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member, index) => (
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
    </div>
  );
}
