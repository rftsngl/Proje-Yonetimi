import React, { useEffect, useState } from 'react';
import { X, Calendar, Target, User, Briefcase, AlignLeft, LayoutGrid, Palette } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CreateProjectPayload, Project, User as AppUser } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateProjectPayload) => Promise<void>;
  managers: AppUser[];
  initialProject?: Project | null;
  submitLabel?: string;
}

const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-blue-500'];

const initialState = {
  name: '',
  description: '',
  category: 'Web Geliştirme',
  managerId: '',
  startDate: '',
  endDate: '',
  themeColor: colors[0],
};

const normalizeDateInput = (value?: string | null) => {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
};

export default function CreateProjectModal({
  isOpen,
  onClose,
  onCreate,
  managers,
  initialProject,
  submitLabel,
}: CreateProjectModalProps) {
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialProject) {
        const matchingManager = managers.find((manager) => manager.name === initialProject.manager);
        setForm({
          name: initialProject.name,
          description: initialProject.description,
          category: initialProject.category,
          managerId: matchingManager?.id || managers[0]?.id || '',
          startDate: normalizeDateInput(initialProject.startDate),
          endDate: normalizeDateInput(initialProject.endDate),
          themeColor: initialProject.themeColor || colors[0],
        });
      } else {
        setForm({
          ...initialState,
          managerId: managers[0]?.id || '',
        });
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, managers, initialProject]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate({
        name: form.name,
        description: form.description,
        category: form.category,
        managerId: form.managerId,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        themeColor: form.themeColor,
      });
      setForm(initialState);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Proje oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {initialProject ? 'Projeyi Düzenle' : 'Yeni Proje Başlat'}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {initialProject ? 'Proje bilgilerini güncelleyip kaydedin.' : 'Ekibinizle birlikte yeni bir süreç başlatın.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form className="space-y-6 p-8" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      Proje Adı
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Örn: Mobil Uygulama Yenileme"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <LayoutGrid className="h-4 w-4 text-slate-400" />
                      Kategori
                    </label>
                    <select
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                      className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option>UI/UX Tasarım</option>
                      <option>Web Geliştirme</option>
                      <option>Mobil Geliştirme</option>
                      <option>Backend</option>
                      <option>AI / ML</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <AlignLeft className="h-4 w-4 text-slate-400" />
                      Proje Özeti
                    </label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Projenin temel amaçlarını ve kapsamını açıklayın..."
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <User className="h-4 w-4 text-slate-400" />
                      Proje Yöneticisi
                    </label>
                    <select
                      value={form.managerId}
                      onChange={(event) => setForm((current) => ({ ...current, managerId: event.target.value }))}
                      className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        Başlangıç
                      </label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                        className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Target className="h-4 w-4 text-slate-400" />
                        Hedef
                      </label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                        className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Palette className="h-4 w-4 text-slate-400" />
                      Proje Rengi
                    </label>
                    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, themeColor: color }))}
                          className={`h-8 w-8 rounded-full ${color} transition-all hover:ring-2 hover:ring-slate-300 ring-offset-2 ${
                            form.themeColor === color ? 'ring-2 ring-slate-300' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}

              <div className="flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl px-8 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !managers.length}
                  className="rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-200 transition-all active:scale-95 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Kaydediliyor...' : submitLabel || (initialProject ? 'Değişiklikleri Kaydet' : 'Projeyi Oluştur')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
