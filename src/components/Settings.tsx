import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  AlertCircle,
  Bell,
  Camera,
  Check,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Moon,
  Palette,
  RefreshCw,
  Save,
  Sun,
  Monitor,
  User,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './ConfirmModal';
import {
  ChangePasswordPayload,
  LanguageCode,
  SettingsBundle,
  ThemeMode,
  User as AppUser,
} from '../types';
import {
  changePassword,
  getSettings,
  resetSettings,
  updateProfile,
  updateSettings,
  uploadProfilePhoto,
} from '../services/settings';
import { resolveAvatarUrl } from '../lib/avatar';
import { applyTheme } from '../lib/theme';

type SettingsTab = 'profile' | 'account' | 'notifications' | 'appearance';

interface SettingsProps {
  currentUser: AppUser;
  onDataRefresh?: () => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
}

const TABS = [
  { id: 'profile' as const, label: 'Profil', icon: User },
  { id: 'account' as const, label: 'Hesap', icon: Lock },
  { id: 'notifications' as const, label: 'Bildirimler', icon: Bell },
  { id: 'appearance' as const, label: 'Görünüm', icon: Palette },
];

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

export default function Settings({ currentUser, onDataRefresh, onDirtyChange }: SettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>('profile');
  const [bundle, setBundle] = useState<SettingsBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileDepartment, setProfileDepartment] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password form state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Notifications state
  const [notifyTaskAssigned, setNotifyTaskAssigned] = useState(true);
  const [notifyProjectUpdates, setNotifyProjectUpdates] = useState(true);
  const [notifyDeadlineReminders, setNotifyDeadlineReminders] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Appearance state
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [language, setLanguage] = useState<LanguageCode>('tr');
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ type, message });
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 4000);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setBundle(data);
      // Sync local form state
      setProfileName(data.profile.fullName);
      setProfileEmail(data.profile.email);
      setProfileDepartment(data.profile.department);
      setNotifyTaskAssigned(data.settings.notifyTaskAssigned);
      setNotifyProjectUpdates(data.settings.notifyProjectUpdates);
      setNotifyDeadlineReminders(data.settings.notifyDeadlineReminders);
      setTheme(data.settings.theme);
      setLanguage(data.settings.language);
      applyTheme(data.settings.theme);
    } catch {
      showFeedback('error', 'Ayarlar yuklenirken hata olustu.');
    } finally {
      setIsLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const isDirty = useMemo(() => {
    if (!bundle) return false;
    return (
      profileName !== bundle.profile.fullName ||
      profileEmail !== bundle.profile.email ||
      profileDepartment !== bundle.profile.department ||
      notifyTaskAssigned !== bundle.settings.notifyTaskAssigned ||
      notifyProjectUpdates !== bundle.settings.notifyProjectUpdates ||
      notifyDeadlineReminders !== bundle.settings.notifyDeadlineReminders ||
      theme !== bundle.settings.theme ||
      language !== bundle.settings.language ||
      currentPw !== '' ||
      newPw !== '' ||
      confirmPw !== ''
    );
  }, [
    bundle, profileName, profileEmail, profileDepartment, notifyTaskAssigned,
    notifyProjectUpdates, notifyDeadlineReminders, theme, language, currentPw, newPw, confirmPw
  ]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Cancel: restore from bundle
  const handleCancel = () => {
    if (!bundle) return;
    setProfileName(bundle.profile.fullName);
    setProfileEmail(bundle.profile.email);
    setProfileDepartment(bundle.profile.department);
    setNotifyTaskAssigned(bundle.settings.notifyTaskAssigned);
    setNotifyProjectUpdates(bundle.settings.notifyProjectUpdates);
    setNotifyDeadlineReminders(bundle.settings.notifyDeadlineReminders);
    setTheme(bundle.settings.theme);
    setLanguage(bundle.settings.language);
    applyTheme(bundle.settings.theme);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setFeedback(null);
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setConfirmModal({
        isOpen: true,
        title: 'Kaydedilmemiş Değişiklikler',
        message: 'Değişiklikleri kaydetmeden iptal etmek istediğinize emin misiniz? Yapılan değişiklikler kaybolacak.',
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          handleCancel();
        }
      });
    } else {
      handleCancel();
    }
  };

  // Profile save
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const updated = await updateProfile({
        fullName: profileName,
        email: profileEmail,
        department: profileDepartment,
      });
      setBundle(updated);
      showFeedback('success', 'Profil basariyla guncellendi.');
      onDataRefresh?.();
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'Profil guncellenemedi.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password save
  const handleSavePassword = async () => {
    setIsSavingPassword(true);
    try {
      const payload: ChangePasswordPayload = {
        currentPassword: currentPw,
        newPassword: newPw,
        confirmPassword: confirmPw,
      };
      await changePassword(payload);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      showFeedback('success', 'Sifre basariyla degistirildi.');
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'Sifre degistirilemedi.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Notifications save
  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      const updated = await updateSettings({
        notifyTaskAssigned,
        notifyProjectUpdates,
        notifyDeadlineReminders,
      });
      setBundle(updated);
      showFeedback('success', 'Bildirim tercihleri guncellendi.');
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'Bildirim tercihleri guncellenemedi.');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Appearance save
  const handleSaveAppearance = async () => {
    setIsSavingAppearance(true);
    try {
      const updated = await updateSettings({ theme, language });
      setBundle(updated);
      applyTheme(theme);
      showFeedback('success', 'Gorunum ayarlari kaydedildi.');
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'Gorunum ayarlari kaydedilemedi.');
    } finally {
      setIsSavingAppearance(false);
    }
  };

  // Theme change (selection only, no instant preview)
  const handleThemeChange = (next: ThemeMode) => {
    setTheme(next);
  };

  // Photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const updated = await uploadProfilePhoto(file);
      setBundle(updated);
      showFeedback('success', 'Profil fotografi guncellendi.');
      onDataRefresh?.();
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'Fotograf yuklenemedi.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reset settings
  const handleReset = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Ayarları Sıfırla',
      message: 'Tüm ayarlarınız varsayılan değerlere döndürülecek. Bu işlem geri alınamaz. Emin misiniz?',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsResetting(true);
        try {
          const updated = await resetSettings();
          setBundle(updated);
          setTheme(updated.settings.theme);
          setLanguage(updated.settings.language);
          setNotifyTaskAssigned(updated.settings.notifyTaskAssigned);
          setNotifyProjectUpdates(updated.settings.notifyProjectUpdates);
          setNotifyDeadlineReminders(updated.settings.notifyDeadlineReminders);
          applyTheme(updated.settings.theme);
          showFeedback('success', 'Ayarlar varsayilana dondu.');
        } catch {
          showFeedback('error', 'Ayarlar sıfırlanırken bir hata oluştu.');
        } finally {
          setIsResetting(false);
        }
      }
    });
  };


  const avatarUrl = bundle?.profile.avatarUrl || resolveAvatarUrl(currentUser.avatar);

  // Determine which save handler to use per tab
  const isSaving = isSavingProfile || isSavingPassword || isSavingNotifications || isSavingAppearance;
  const handleSave = () => {
    switch (activeSubTab) {
      case 'profile':
        return handleSaveProfile();
      case 'account':
        return handleSavePassword();
      case 'notifications':
        return handleSaveNotifications();
      case 'appearance':
        return handleSaveAppearance();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="space-y-3 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Ayarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="mt-1 text-slate-500">Profilini, güvenlik ayarlarını, bildirim tercihlerini ve görünümü buradan yönet.</p>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="flex-1">{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="p-1 opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <div className="flex min-h-[600px] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:flex-row">
        {/* Sidebar */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="w-full space-y-1 border-r border-slate-100 bg-slate-50/50 p-4 lg:w-64 lg:p-6"
        >
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              variants={{
                hidden: { opacity: 0, x: -10 },
                visible: { opacity: 1, x: 0 }
              }}
              onClick={() => setActiveSubTab(tab.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                activeSubTab === tab.id ? 'bg-white font-bold text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/50 hover:text-indigo-600'
              }`}
            >
              <tab.icon className={`h-5 w-5 ${activeSubTab === tab.id ? 'text-indigo-600' : 'group-hover:text-indigo-600'}`} />
              <span>{tab.label}</span>
            </motion.button>
          ))}

          <motion.div 
            variants={{
              hidden: { opacity: 0, x: -10 },
              visible: { opacity: 1, x: 0 }
            }}
            className="!mt-6 border-t border-slate-200 pt-4"
          >
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 transition-all hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Varsayılana Dön</span>
            </button>
            </motion.div>
        </motion.div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 p-6 lg:p-10">
            <div className="max-w-2xl h-full">
              <AnimatePresence mode="wait">
                {activeSubTab === 'profile' && (
                  <motion.div 
                    key="profile" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                  {/* Avatar section */}
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <div className="group relative">
                      <img
                        src={avatarUrl}
                        alt={bundle?.profile.fullName || currentUser.name}
                        className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg sm:h-32 sm:w-32"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-2 text-white shadow-lg transition-all active:scale-95 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isUploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg font-bold text-slate-900">Profil Fotoğrafı</h3>
                      <p className="mt-1 text-sm text-slate-500">Fotoğrafınızı yükleyerek profil görünümünüzü kişiselleştirin.</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="mt-3 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-100 disabled:opacity-50"
                      >
                        {isUploadingPhoto ? 'Yükleniyor...' : 'Değiştir'}
                      </button>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Ad Soyad</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Rol</label>
                      <input
                        type="text"
                        value={bundle?.profile.role || currentUser.role}
                        readOnly
                        className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none"
                      />
                      <p className="text-xs text-slate-400">Rol değişikliği yalnızca admin tarafından yapılabilir.</p>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-bold text-slate-700">E-posta</label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-bold text-slate-700">Departman</label>
                      <input
                        type="text"
                        value={profileDepartment}
                        onChange={(e) => setProfileDepartment(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSubTab === 'account' && (
                <motion.div 
                  key="account" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Şifre Değiştir</h3>
                    <p className="mt-1 text-sm text-slate-500">Güvenliğiniz için güçlü bir şifre kullanın.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Mevcut Şifre</label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          value={currentPw}
                          onChange={(e) => setCurrentPw(e.target.value)}
                          placeholder="Mevcut şifrenizi girin"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showCurrentPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Yeni Şifre</label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          placeholder="En az 6 karakter"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showNewPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Yeni Şifre (Tekrar)</label>
                      <input
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Yeni şifrenizi tekrar girin"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      {newPw && confirmPw && newPw !== confirmPw && (
                        <p className="text-xs text-rose-500">Şifreler eşleşmiyor.</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSubTab === 'notifications' && (
                <motion.div 
                  key="notifications" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Bildirim Tercihleri</h3>
                    <p className="mt-1 text-sm text-slate-500">Hangi durumlarda bildirim almak istediğinizi seçin.</p>
                  </div>

                  <div className="space-y-4">
                    <ToggleRow
                      label="Görev Ataması"
                      description="Size yeni bir görev atandığında bildirim alın."
                      checked={notifyTaskAssigned}
                      onChange={setNotifyTaskAssigned}
                    />
                    <ToggleRow
                      label="Proje Güncellemeleri"
                      description="Dahil olduğunuz projelerdeki değişikliklerden haberdar olun."
                      checked={notifyProjectUpdates}
                      onChange={setNotifyProjectUpdates}
                    />
                    <ToggleRow
                      label="Tarih Hatırlatıcıları"
                      description="Son teslim tarihi yaklaşan görevler için hatırlatma alın."
                      checked={notifyDeadlineReminders}
                      onChange={setNotifyDeadlineReminders}
                    />
                  </div>
                </motion.div>
              )}

              {activeSubTab === 'appearance' && (
                <motion.div 
                  key="appearance" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Görünüm Ayarları</h3>
                    <p className="mt-1 text-sm text-slate-500">Tema ve dil tercihlerinizi ayarlayın.</p>
                  </div>

                  {/* Theme selector */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700">Tema</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: 'light' as const, label: 'Açık', icon: Sun },
                        { value: 'dark' as const, label: 'Koyu', icon: Moon },
                        { value: 'system' as const, label: 'Sistem', icon: Monitor },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleThemeChange(opt.value)}
                          className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all ${
                            theme === opt.value
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <opt.icon className="h-6 w-6" />
                          <span className="text-sm font-bold">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language selector */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700">Dil</label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { value: 'tr' as const, label: 'Türkçe', flag: '🇹🇷' },
                        { value: 'en' as const, label: 'English', flag: '🇬🇧' },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setLanguage(opt.value)}
                          className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                            language === opt.value
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <Globe className="h-5 w-5" />
                          <span className="text-sm font-bold">{opt.flag} {opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/30 p-6">
            <button
              onClick={handleCancelClick}
              className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-2.5 font-bold text-white transition-all active:scale-95 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        {...confirmModal}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle row component
// ---------------------------------------------------------------------------
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          checked ? 'bg-indigo-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
