import { useState } from 'react';
import { Bell, Camera, Check, Lock, Palette, Save, User } from 'lucide-react';
import { motion } from 'motion/react';
import { User as AppUser } from '../types';

type SettingsTab = 'profile' | 'account' | 'notifications' | 'appearance';

interface SettingsProps {
  currentUser: AppUser;
}

export default function Settings({ currentUser }: SettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>('profile');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const subTabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'account', label: 'Hesap', icon: Lock },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'appearance', label: 'Görünüm', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="mt-1 text-slate-500">Oturum açan kullanıcı bilgilerine göre profil görünümü dinamik olarak doldurulur.</p>
      </div>

      <div className="flex min-h-[600px] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:flex-row">
        <div className="w-full space-y-1 border-r border-slate-100 bg-slate-50/50 p-4 lg:w-64 lg:p-6">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SettingsTab)}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                activeSubTab === tab.id ? 'bg-white font-bold text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/50 hover:text-indigo-600'
              }`}
            >
              <tab.icon className={`h-5 w-5 ${activeSubTab === tab.id ? 'text-indigo-600' : 'group-hover:text-indigo-600'}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex-1 p-6 lg:p-10">
            <div className="max-w-2xl">
              {activeSubTab === 'profile' ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <div className="group relative">
                      <img
                        src={`https://picsum.photos/seed/${currentUser.avatar}/120/120`}
                        alt={currentUser.name}
                        className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg sm:h-32 sm:w-32"
                        referrerPolicy="no-referrer"
                      />
                      <button className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-2 text-white shadow-lg transition-all active:scale-95 hover:bg-indigo-700">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg font-bold text-slate-900">Profil Fotoğrafı</h3>
                      <p className="mt-1 text-sm text-slate-500">Mevcut oturum bilgisine göre profil alanı otomatik dolduruldu.</p>
                      <button className="mt-3 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-100">
                        Değiştir
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Ad Soyad</label>
                      <input
                        type="text"
                        defaultValue={currentUser.name}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Rol</label>
                      <input
                        type="text"
                        defaultValue={currentUser.role}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-bold text-slate-700">E-posta</label>
                      <input
                        type="email"
                        defaultValue={currentUser.email}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-bold text-slate-700">Departman</label>
                      <input
                        type="text"
                        defaultValue={currentUser.department}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Palette className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Bu bölüm yakında gelecek</h3>
                  <p className="mt-1 text-slate-500">Bu ayar sekmesini gerekirse sonraki adımda birlikte detaylandırırız.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/30 p-6">
            <button className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100">İptal</button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 rounded-xl px-8 py-2.5 font-bold transition-all active:scale-95 ${
                isSaved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isSaved ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
              {isSaved ? 'Kaydedildi' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
