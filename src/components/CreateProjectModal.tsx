import React, { useEffect, useState } from 'react';
import { X, Calendar, Target, User, Briefcase, AlignLeft, LayoutGrid, Palette, ChevronRight, ChevronLeft, CheckCircle2, ShieldAlert, Users, Layers, Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CreateProjectPayload, Project, User as AppUser, CreateProjectStakeholderPayload, CreateProjectRequirementPayload, CreateProjectRiskPayload } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateProjectPayload) => Promise<void>;
  managers: AppUser[];
  initialProject?: Project | null;
  submitLabel?: string;
}

const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-blue-500'];

const STEPS = [
  { id: 1, title: 'Temel Bilgiler', icon: Briefcase },
  { id: 2, title: 'Değer ve Uygunluk', icon: Target },
  { id: 3, title: 'Kapsam', icon: LayoutGrid },
  { id: 4, title: 'Paydaşlar', icon: Users },
  { id: 5, title: 'Gereksinimler', icon: AlignLeft },
  { id: 6, title: 'Riskler', icon: ShieldAlert },
  { id: 7, title: 'WBS & Plan', icon: Layers },
  { id: 8, title: 'Özet', icon: CheckCircle2 },
];

export default function CreateProjectModal({ isOpen, onClose, onCreate, managers, initialProject, submitLabel }: CreateProjectModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<CreateProjectPayload>>({
    name: '', description: '', category: 'Web Geliştirme', managerId: '', startDate: '', endDate: '', themeColor: colors[0],
    stakeholders: [], requirements: [], risks: [], createDefaultWbsTasks: false, selectedWbsTemplate: 'empty'
  });

  const [newStakeholder, setNewStakeholder] = useState<CreateProjectStakeholderPayload>({ name: '', role: '', interest: 'Orta', power: 'Orta', expectation: '', communicationMethod: '' });
  const [newRequirement, setNewRequirement] = useState<CreateProjectRequirementPayload>({ title: '', description: '', type: 'İşlevsel', priority: 'Must', difficulty: 3, businessValue: 3 });
  const [newRisk, setNewRisk] = useState<CreateProjectRiskPayload>({ title: '', category: 'Teknik', probability: 3, impact: 3, mitigation: '' });

  const addStakeholder = () => {
    if (!newStakeholder.name || !newStakeholder.role) return;
    updateForm({ stakeholders: [...(form.stakeholders || []), newStakeholder] });
    setNewStakeholder({ name: '', role: '', interest: 'Orta', power: 'Orta', expectation: '', communicationMethod: '' });
  };
  const removeStakeholder = (index: number) => updateForm({ stakeholders: form.stakeholders?.filter((_, i) => i !== index) });

  const addRequirement = () => {
    if (!newRequirement.title || !newRequirement.description) return;
    updateForm({ requirements: [...(form.requirements || []), newRequirement] });
    setNewRequirement({ title: '', description: '', type: 'İşlevsel', priority: 'Must', difficulty: 3, businessValue: 3 });
  };
  const removeRequirement = (index: number) => updateForm({ requirements: form.requirements?.filter((_, i) => i !== index) });

  const addRisk = () => {
    if (!newRisk.title) return;
    updateForm({ risks: [...(form.risks || []), newRisk] });
    setNewRisk({ title: '', category: 'Teknik', probability: 3, impact: 3, mitigation: '' });
  };
  const removeRisk = (index: number) => updateForm({ risks: form.risks?.filter((_, i) => i !== index) });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      if (initialProject) {
        const matchingManager = managers.find((m) => m.name === initialProject.manager);
        setForm({
          name: initialProject.name, description: initialProject.description, category: initialProject.category,
          managerId: matchingManager?.id || managers[0]?.id || '', startDate: initialProject.startDate?.slice(0, 10) || '',
          endDate: initialProject.endDate?.slice(0, 10) || '', themeColor: initialProject.themeColor || colors[0],
        });
      } else {
        setForm({ name: '', description: '', category: 'Web Geliştirme', managerId: managers[0]?.id || '', startDate: '', endDate: '', themeColor: colors[0], stakeholders: [], requirements: [], risks: [], createDefaultWbsTasks: false, selectedWbsTemplate: 'empty' });
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, managers, initialProject]);

  const updateForm = (updates: Partial<CreateProjectPayload>) => setForm(curr => ({ ...curr, ...updates }));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate(form as CreateProjectPayload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Proje oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep(c => c + 1);
    else handleSubmit();
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl">
            {/* Header & Progress */}
            <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{initialProject ? 'Projeyi Düzenle' : 'Yeni Proje Planlama Sihirbazı'}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{initialProject ? 'Temel proje bilgilerini güncelleyin.' : 'Kapsamlı bir proje planı oluşturmak için adımları izleyin.'}</p>
                </div>
                <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"><X className="h-6 w-6" /></button>
              </div>
              {!initialProject && (
                <div className="mt-8 flex items-center justify-between">
                  {STEPS.map((step) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isPassed = currentStep > step.id;
                    return (
                      <div key={step.id} className="flex flex-col items-center gap-2">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${isActive ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : isPassed ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-400'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`text-xs font-bold ${isActive || isPassed ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">Proje Adı <span className="text-rose-500">*</span></label>
                        <input type="text" required value={form.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder="Örn: Mobil Uygulama Yenileme" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">Kategori</label>
                        <select value={form.category} onChange={(e) => updateForm({ category: e.target.value })} className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option>Web Geliştirme</option><option>Mobil Geliştirme</option><option>AI / ML</option><option>Diğer</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">Proje Tipi</label>
                        <select value={form.projectType || ''} onChange={(e) => updateForm({ projectType: e.target.value })} className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="">Seçiniz...</option><option>Yeni Ürün Geliştirme</option><option>Sistem Entegrasyonu</option><option>Altyapı Yenileme</option><option>Süreç İyileştirme</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">Proje Rengi</label>
                        <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                          {colors.map((color) => (
                            <button key={color} type="button" onClick={() => updateForm({ themeColor: color })} className={`h-8 w-8 rounded-full ${color} transition-all hover:ring-2 hover:ring-slate-300 ring-offset-2 ${form.themeColor === color ? 'ring-2 ring-slate-300' : ''}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">Proje Yöneticisi</label>
                        <select value={form.managerId} onChange={(e) => updateForm({ managerId: e.target.value })} className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          {managers.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">Başlangıç</label>
                          <input type="date" value={form.startDate} onChange={(e) => updateForm({ startDate: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">Hedef</label>
                          <input type="date" value={form.endDate} onChange={(e) => updateForm({ endDate: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">Proje Amacı</label>
                        <textarea rows={3} value={form.purpose || ''} onChange={(e) => updateForm({ purpose: e.target.value })} placeholder="Projenin varoluş amacı..." className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && !initialProject && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Problem Tanımı</label>
                        <textarea rows={3} value={form.problemStatement || ''} onChange={(e) => updateForm({ problemStatement: e.target.value })} placeholder="Çözülmek istenen sorun nedir?" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Doğrudan Değer / Getiri</label>
                        <textarea rows={2} value={form.directValue || ''} onChange={(e) => updateForm({ directValue: e.target.value })} placeholder="Örn: %20 maliyet düşüşü" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Fizibilite Skoru (0-100)</label>
                        <input type="number" min="0" max="100" value={form.feasibilityScore || ''} onChange={(e) => updateForm({ feasibilityScore: parseInt(e.target.value) || undefined })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Hedef Kitle / Kullanıcılar</label>
                        <textarea rows={3} value={form.targetUsers || ''} onChange={(e) => updateForm({ targetUsers: e.target.value })} placeholder="Projeden kimler yararlanacak?" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Stratejik Uyum</label>
                        <textarea rows={2} value={form.strategicAlignment || ''} onChange={(e) => updateForm({ strategicAlignment: e.target.value })} placeholder="Şirket hedefleriyle uyumu..." className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Yapılmama Etkisi (Risk)</label>
                        <textarea rows={2} value={form.notDoingImpact || ''} onChange={(e) => updateForm({ notDoingImpact: e.target.value })} placeholder="Bu proje yapılmazsa ne kaybedilir?" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && !initialProject && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Kapsam İçi (In Scope)</label>
                        <textarea rows={4} value={form.inScope || ''} onChange={(e) => updateForm({ inScope: e.target.value })} placeholder="Bu projede neler yapılacak?" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Kapsam Dışı (Out of Scope)</label>
                        <textarea rows={4} value={form.outOfScope || ''} onChange={(e) => updateForm({ outOfScope: e.target.value })} placeholder="Neler KESİNLİKLE yapılmayacak?" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Varsayımlar</label>
                        <textarea rows={2} value={form.assumptions || ''} onChange={(e) => updateForm({ assumptions: e.target.value })} placeholder="Proje başlarken kabul edilen doğrular..." className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Kısıtlar (Zaman, Bütçe, Kaynak)</label>
                        <textarea rows={2} value={form.constraints || ''} onChange={(e) => updateForm({ constraints: e.target.value })} placeholder="Örn: Bütçe 500k TL ile sınırlı." className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Kabul Kriterleri</label>
                        <textarea rows={2} value={form.acceptanceCriteria || ''} onChange={(e) => updateForm({ acceptanceCriteria: e.target.value })} placeholder="Projenin başarılı sayılması için gerekenler..." className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && !initialProject && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="mb-4 text-sm font-bold text-slate-900">Yeni Paydaş Ekle</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <input type="text" placeholder="Ad Soyad *" value={newStakeholder.name} onChange={(e) => setNewStakeholder(s => ({ ...s, name: e.target.value }))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm" />
                      <input type="text" placeholder="Rol / Organizasyon *" value={newStakeholder.role} onChange={(e) => setNewStakeholder(s => ({ ...s, role: e.target.value }))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm" />
                      <select value={newStakeholder.interest} onChange={(e) => setNewStakeholder(s => ({ ...s, interest: e.target.value as any }))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
                        <option value="Düşük">İlgi: Düşük</option><option value="Orta">İlgi: Orta</option><option value="Yüksek">İlgi: Yüksek</option>
                      </select>
                      <select value={newStakeholder.power} onChange={(e) => setNewStakeholder(s => ({ ...s, power: e.target.value as any }))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
                        <option value="Düşük">Güç: Düşük</option><option value="Orta">Güç: Orta</option><option value="Yüksek">Güç: Yüksek</option>
                      </select>
                      <input type="text" placeholder="Beklenti" value={newStakeholder.expectation} onChange={(e) => setNewStakeholder(s => ({ ...s, expectation: e.target.value }))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm" />
                      <button type="button" onClick={addStakeholder} disabled={!newStakeholder.name || !newStakeholder.role} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50">Listeye Ekle</button>
                    </div>
                  </div>

                  {form.stakeholders && form.stakeholders.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                          <tr><th className="p-4">Ad</th><th className="p-4">Rol</th><th className="p-4">İlgi/Güç</th><th className="p-4">Beklenti</th><th className="p-4 w-16">İşlem</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {form.stakeholders.map((s, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-4 font-medium text-slate-900">{s.name}</td>
                              <td className="p-4">{s.role}</td>
                              <td className="p-4">İ: {s.interest} / G: {s.power}</td>
                              <td className="p-4">{s.expectation || '-'}</td>
                              <td className="p-4"><button type="button" onClick={() => removeStakeholder(i)} className="text-rose-500 hover:text-rose-700"><X className="h-4 w-4" /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 5 && !initialProject && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="mb-4 text-sm font-bold text-slate-900">Yeni Gereksinim Ekle (MoSCoW)</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <input type="text" placeholder="Gereksinim Başlığı *" value={newRequirement.title} onChange={(e) => setNewRequirement(r => ({ ...r, title: e.target.value }))} className="col-span-1 lg:col-span-2 rounded-xl border border-slate-200 px-4 py-2 text-sm" />
                      <select value={newRequirement.type} onChange={(e) => setNewRequirement(r => ({ ...r, type: e.target.value as any }))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
                        <option value="İşlevsel">İşlevsel</option><option value="İşlevsel Olmayan">İşlevsel Olmayan</option>
                      </select>
                      <select value={newRequirement.priority} onChange={(e) => setNewRequirement(r => ({ ...r, priority: e.target.value as any }))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
                        <option value="Must">Must Have</option><option value="Should">Should Have</option><option value="Could">Could Have</option><option value="Won't">Won't Have</option>
                      </select>
                      <input type="text" placeholder="Açıklama *" value={newRequirement.description} onChange={(e) => setNewRequirement(r => ({ ...r, description: e.target.value }))} className="col-span-1 lg:col-span-4 rounded-xl border border-slate-200 px-4 py-2 text-sm" />
                      <div className="col-span-1 lg:col-span-2 flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500 w-24">Zorluk ({newRequirement.difficulty})</label>
                        <input type="range" min="1" max="5" value={newRequirement.difficulty} onChange={(e) => setNewRequirement(r => ({ ...r, difficulty: parseInt(e.target.value) }))} className="flex-1" />
                      </div>
                      <div className="col-span-1 lg:col-span-2 flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500 w-24">Değer ({newRequirement.businessValue})</label>
                        <input type="range" min="1" max="5" value={newRequirement.businessValue} onChange={(e) => setNewRequirement(r => ({ ...r, businessValue: parseInt(e.target.value) }))} className="flex-1" />
                      </div>
                      <button type="button" onClick={addRequirement} disabled={!newRequirement.title || !newRequirement.description} className="col-span-1 lg:col-span-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 mt-2">Listeye Ekle</button>
                    </div>
                  </div>

                  {form.requirements && form.requirements.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                          <tr><th className="p-4">Başlık</th><th className="p-4">Öncelik</th><th className="p-4">Tip</th><th className="p-4">Z/D</th><th className="p-4 w-16">İşlem</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {form.requirements.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-4 font-medium text-slate-900">{r.title}</td>
                              <td className="p-4">{r.priority}</td>
                              <td className="p-4">{r.type}</td>
                              <td className="p-4">{r.difficulty}/{r.businessValue}</td>
                              <td className="p-4"><button type="button" onClick={() => removeRequirement(i)} className="text-rose-500 hover:text-rose-700"><X className="h-4 w-4" /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 6 && !initialProject && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="mb-4 text-sm font-bold text-slate-900">Yeni Risk Ekle</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <input type="text" placeholder="Risk Başlığı *" value={newRisk.title} onChange={(e) => setNewRisk(r => ({ ...r, title: e.target.value }))} className="col-span-1 lg:col-span-2 rounded-xl border border-slate-200 px-4 py-2 text-sm" />
                      <select value={newRisk.category} onChange={(e) => setNewRisk(r => ({ ...r, category: e.target.value as any }))} className="col-span-1 lg:col-span-2 rounded-xl border border-slate-200 px-4 py-2 text-sm">
                        <option value="Teknik">Teknik</option><option value="Planlama">Planlama</option><option value="Yönetim">Yönetim</option><option value="Finansal">Finansal</option><option value="Kaynak">Kaynak</option><option value="Kalite">Kalite</option><option value="İletişim">İletişim</option><option value="Güvenlik">Güvenlik</option>
                      </select>
                      <div className="col-span-1 lg:col-span-2 flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500 w-24">Olasılık ({newRisk.probability})</label>
                        <input type="range" min="1" max="5" value={newRisk.probability} onChange={(e) => setNewRisk(r => ({ ...r, probability: parseInt(e.target.value) }))} className="flex-1" />
                      </div>
                      <div className="col-span-1 lg:col-span-2 flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500 w-24">Etki ({newRisk.impact})</label>
                        <input type="range" min="1" max="5" value={newRisk.impact} onChange={(e) => setNewRisk(r => ({ ...r, impact: parseInt(e.target.value) }))} className="flex-1" />
                      </div>
                      <input type="text" placeholder="Azaltma Planı (Mitigation)" value={newRisk.mitigation || ''} onChange={(e) => setNewRisk(r => ({ ...r, mitigation: e.target.value }))} className="col-span-1 lg:col-span-4 rounded-xl border border-slate-200 px-4 py-2 text-sm" />
                      <button type="button" onClick={addRisk} disabled={!newRisk.title} className="col-span-1 lg:col-span-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 mt-2">Listeye Ekle</button>
                    </div>
                  </div>

                  {form.risks && form.risks.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                          <tr><th className="p-4">Başlık</th><th className="p-4">Kategori</th><th className="p-4">Skor (OxE)</th><th className="p-4">Azaltma Planı</th><th className="p-4 w-16">İşlem</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {form.risks.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-4 font-medium text-slate-900">{r.title}</td>
                              <td className="p-4">{r.category}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${r.probability * r.impact >= 15 ? 'bg-rose-100 text-rose-700' : r.probability * r.impact >= 8 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {r.probability * r.impact}
                                </span>
                              </td>
                              <td className="p-4">{r.mitigation || '-'}</td>
                              <td className="p-4"><button type="button" onClick={() => removeRisk(i)} className="text-rose-500 hover:text-rose-700"><X className="h-4 w-4" /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 7 && !initialProject && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">İş Kırılım Yapısı (WBS)</h3>
                      <p className="text-sm text-slate-500 mt-1">Projenizin ilk görev hiyerarşisini otomatik olarak oluşturabilirsiniz.</p>
                    </div>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.createDefaultWbsTasks} onChange={(e) => updateForm({ createDefaultWbsTasks: e.target.checked })} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-slate-700">Başlangıç WBS görevlerini otomatik oluştur</span>
                    </label>

                    {form.createDefaultWbsTasks && (
                      <div className="pl-8 pt-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Şablon Seçimi</label>
                        <select value={form.selectedWbsTemplate} onChange={(e) => updateForm({ selectedWbsTemplate: e.target.value as any })} className="w-full md:w-1/2 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="software_development">Standart Yazılım Geliştirme (Analiz, Tasarım, Geliştirme, Test)</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-2">Not: Bu işlem, proje oluşturulduktan sonra projenin "Görevler" sekmesine temel görev hiyerarşisini ekleyecektir.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 8 && !initialProject && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="rounded-2xl border border-slate-200 p-8 text-center space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Planlama Tamamlandı!</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Proje planlama adımlarını tamamladınız. Aşağıdaki özeti kontrol ettikten sonra projeyi başlatabilirsiniz.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs font-bold text-slate-500 mb-1">Paydaşlar</p>
                      <p className="text-xl font-bold text-slate-900">{form.stakeholders?.length || 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs font-bold text-slate-500 mb-1">Gereksinimler</p>
                      <p className="text-xl font-bold text-slate-900">{form.requirements?.length || 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs font-bold text-slate-500 mb-1">Riskler</p>
                      <p className="text-xl font-bold text-slate-900">{form.risks?.length || 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs font-bold text-slate-500 mb-1">WBS Şablonu</p>
                      <p className="text-xl font-bold text-slate-900">{form.createDefaultWbsTasks ? 'Aktif' : 'Pasif'}</p>
                    </div>
                  </div>

                  {!form.name && (
                    <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5" />
                      Proje adı zorunludur. Lütfen 1. Adım'a dönerek proje adını giriniz.
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && <div className="px-8"><p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p></div>}

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-8 py-6">
              <button type="button" onClick={handlePrev} disabled={currentStep === 1} className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200 disabled:invisible">
                <ChevronLeft className="h-4 w-4" /> Geri
              </button>
              <div className="flex gap-4">
                <button type="button" onClick={onClose} className="rounded-2xl px-6 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200">İptal</button>
                <button type="button" onClick={handleNext} disabled={isSubmitting || !managers.length || !form.name} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Kaydediliyor...' : currentStep === STEPS.length || initialProject ? (initialProject ? 'Kaydet' : 'Projeyi Başlat') : 'İleri'}
                  {currentStep < STEPS.length && !initialProject && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
