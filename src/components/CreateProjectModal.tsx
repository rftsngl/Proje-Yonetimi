import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Target, User, Briefcase, AlignLeft, LayoutGrid, Palette, ChevronRight, ChevronLeft, CheckCircle2, ShieldAlert, Users, Layers, Activity, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CreateProjectPayload, Project, User as AppUser, CreateProjectStakeholderPayload, CreateProjectRequirementPayload, CreateProjectRiskPayload } from '../types';
import { resolveAvatarUrl } from '../lib/avatar';

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
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<CreateProjectPayload>>({
    name: '', description: '', category: 'Web Geliştirme', managerId: '', startDate: '', endDate: '', themeColor: colors[0],
    stakeholders: [], requirements: [], risks: [], createDefaultWbsTasks: false, selectedWbsTemplate: 'empty'
  });

  const [newStakeholder, setNewStakeholder] = useState<CreateProjectStakeholderPayload>({ name: '', role: '', interest: 'Orta', power: 'Orta', expectation: '', communicationMethod: '' });
  const [newRequirement, setNewRequirement] = useState<CreateProjectRequirementPayload>({ title: '', description: '', type: 'İşlevsel', priority: 'Must', difficulty: 3, businessValue: 3 });
  const [newRisk, setNewRisk] = useState<CreateProjectRiskPayload>({ title: '', category: 'Teknik', probability: 3, impact: 3, mitigation: '' });

  // Custom Date Picker & Dropdown State
  const [datePickerConfig, setDatePickerConfig] = useState<{ field: 'startDate' | 'endDate' | null; viewDate: Date; rect: DOMRect | null }>({ field: null, viewDate: new Date(), rect: null });
  const [activeDropdown, setActiveDropdown] = useState<{ 
    type: 'category' | 'manager' | 'interest' | 'power' | 'reqType' | 'reqPriority' | 'riskCategory' | 'wbsTemplate' | null; 
    rect: DOMRect | null 
  }>({ type: null, rect: null });

  const triggerRefs = {
    category: useRef<HTMLButtonElement>(null),
    manager: useRef<HTMLButtonElement>(null),
    startDate: useRef<HTMLButtonElement>(null),
    endDate: useRef<HTMLButtonElement>(null),
    interest: useRef<HTMLButtonElement>(null),
    power: useRef<HTMLButtonElement>(null),
    reqType: useRef<HTMLButtonElement>(null),
    reqPriority: useRef<HTMLButtonElement>(null),
    riskCategory: useRef<HTMLButtonElement>(null),
    wbsTemplate: useRef<HTMLButtonElement>(null),
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && !isSubmitting && form.name && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, form.name, isSubmitting]);

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
      setDirection(0);
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
    if (currentStep < STEPS.length && !initialProject) {
      setDirection(1);
      setCurrentStep(c => c + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(c => c - 1);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  const renderDatePicker = (field: 'startDate' | 'endDate') => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const days = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];
    const { viewDate, rect } = datePickerConfig;
    if (!rect) return null;

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const adjustedStartDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const calendarDays = [];
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      calendarDays.push({ day: prevMonthDays - i, current: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - calendarDays.length;
    for (let i = 1; i <= remaining; i++) {
      calendarDays.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }

    const dropdownTop = rect.bottom + 8;
    const dropdownLeft = rect.left;
    const isCloseToBottom = window.innerHeight - rect.bottom < 400;
    const finalTop = isCloseToBottom ? rect.top - 410 : dropdownTop;

    return (
      <div className="fixed inset-0 z-[200]">
        <div className="absolute inset-0" onClick={() => setDatePickerConfig({ field: null, viewDate: new Date(), rect: null })} />
        <motion.div
          initial={{ opacity: 0, y: isCloseToBottom ? 10 : -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isCloseToBottom ? 10 : -10, scale: 0.95 }}
          style={{ top: finalTop, left: dropdownLeft, width: 288 }}
          className="absolute z-[210] rounded-[24px] border border-slate-100 bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-slate-900/5"
        >
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={(e) => { e.stopPropagation(); setDatePickerConfig(c => ({ ...c, viewDate: new Date(year, month - 1, 1) })); }} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            <p className="text-sm font-bold text-slate-900">{months[month]} {year}</p>
            <button type="button" onClick={(e) => { e.stopPropagation(); setDatePickerConfig(c => ({ ...c, viewDate: new Date(year, month + 1, 1) })); }} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(d => <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d, i) => {
              const dateStr = d.date.toISOString().split('T')[0];
              const isSelected = form[field] === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateForm({ [field]: dateStr });
                    setDatePickerConfig({ field: null, viewDate: new Date(), rect: null });
                  }}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                    isSelected ? 'bg-indigo-600 text-white' : 
                    d.current ? 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600' : 'text-slate-300'
                  } ${isToday && !isSelected ? 'ring-1 ring-inset ring-indigo-200' : ''}`}
                >
                  {d.day}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2 pt-3 border-t border-slate-50">
            <button type="button" onClick={(e) => { e.stopPropagation(); updateForm({ [field]: new Date().toISOString().split('T')[0] }); setDatePickerConfig({ field: null, viewDate: new Date(), rect: null }); }} className="flex-1 rounded-lg bg-slate-50 py-2 text-[10px] font-bold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600">Bugün</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); updateForm({ [field]: '' }); setDatePickerConfig({ field: null, viewDate: new Date(), rect: null }); }} className="flex-1 rounded-lg bg-slate-50 py-2 text-[10px] font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600">Temizle</button>
          </div>
        </motion.div>
      </div>
    );
  };


  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
            className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[40px] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]"
          >
            {/* Header & Progress */}
            <div className="relative border-b border-slate-100 bg-white px-10 pt-8 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100`}>
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{initialProject ? 'Projeyi Düzenle' : 'Proje Planlama Sihirbazı'}</h2>
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={currentStep}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-sm font-medium text-slate-500"
                      >
                        Adım {currentStep} / {initialProject ? 1 : STEPS.length}: {STEPS[currentStep-1].title}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-rose-50 hover:text-rose-600"
                >
                  <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
                </button>
              </div>

              {!initialProject && (
                <div className="mt-8 flex items-center justify-between relative px-2">
                  <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-100 -z-10" />
                  <div 
                    className="absolute top-5 left-10 h-0.5 bg-indigo-600 transition-all duration-500 -z-10" 
                    style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 80}%`, marginLeft: '2.5%' }} 
                  />
                  {STEPS.map((step) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isPassed = currentStep > step.id;
                    return (
                      <button 
                        key={step.id} 
                        onClick={() => {
                          if (isPassed) {
                            setDirection(step.id < currentStep ? -1 : 1);
                            setCurrentStep(step.id);
                          }
                        }}
                        className={`group relative flex flex-col items-center gap-2 ${isPassed ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                          isActive 
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' 
                            : isPassed 
                              ? 'border-indigo-600 bg-white text-indigo-600' 
                              : 'border-slate-200 bg-white text-slate-400'
                        }`}>
                          <Icon className="h-5 w-5" />
                          {isPassed && !isActive && (
                            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <span className={`absolute -bottom-6 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          isActive ? 'text-indigo-600' : 'text-slate-400'
                        }`}>
                          {step.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content Area with Animation */}
            <div className="flex-1 overflow-y-auto px-10 py-8 no-scrollbar relative">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="w-full h-full"
                >
                  {currentStep === 1 && (
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs">01</span>
                            Proje Adı <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input 
                              type="text" 
                              required 
                              autoFocus
                              value={form.name} 
                              onChange={(e) => updateForm({ name: e.target.value })} 
                              placeholder="Örn: Mobil Uygulama Yenileme" 
                              className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-4 text-slate-900 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm" 
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs">02</span>
                            Kategori
                          </label>
                          <div className="relative">
                            <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
                            <button
                              ref={triggerRefs.category}
                              type="button"
                              onClick={() => {
                                const rect = triggerRefs.category.current?.getBoundingClientRect();
                                setActiveDropdown(curr => ({ type: curr.type === 'category' ? null : 'category', rect: rect || null }));
                              }}
                              className={`flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-4 text-left text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm ${
                                activeDropdown.type === 'category' ? 'ring-4 ring-indigo-500/10 border-indigo-500' : ''
                              }`}
                            >
                              <span className="font-medium text-slate-900">{form.category}</span>
                              <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${activeDropdown.type === 'category' ? 'rotate-180' : ''}`} />
                            </button>

                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs">03</span>
                            Proje Rengi
                          </label>
                          <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                            {colors.map((color) => (
                              <button 
                                key={color} 
                                type="button" 
                                onClick={() => updateForm({ themeColor: color })} 
                                className={`group relative h-10 w-10 rounded-xl ${color} transition-all duration-300 hover:scale-110 active:scale-95 ${
                                  form.themeColor === color ? 'ring-4 ring-indigo-500/20 shadow-lg scale-110' : 'opacity-60 grayscale-[0.2] hover:opacity-100 hover:grayscale-0'
                                }`}
                              >
                                {form.themeColor === color && <CheckCircle2 className="absolute -top-2 -right-2 h-5 w-5 bg-white text-indigo-600 rounded-full shadow-sm" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs">04</span>
                            Proje Yöneticisi
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
                            <button
                              ref={triggerRefs.manager}
                              type="button"
                              onClick={() => {
                                const rect = triggerRefs.manager.current?.getBoundingClientRect();
                                setActiveDropdown(curr => ({ type: curr.type === 'manager' ? null : 'manager', rect: rect || null }));
                              }}
                              className={`flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-4 text-left text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm ${
                                activeDropdown.type === 'manager' ? 'ring-4 ring-indigo-500/10 border-indigo-500' : ''
                              }`}
                            >
                              <span className="font-medium text-slate-900">
                                {managers.find(m => m.id === form.managerId)?.name || 'Yönetici Seçin'}
                              </span>
                              <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${activeDropdown.type === 'manager' ? 'rotate-180' : ''}`} />
                            </button>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700">Başlangıç Tarihi</label>
                            <div className="relative group">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-indigo-600 z-10" />
                              <button 
                                ref={triggerRefs.startDate}
                                type="button"
                                onClick={() => {
                                  const rect = triggerRefs.startDate.current?.getBoundingClientRect();
                                  setDatePickerConfig(c => ({ field: c.field === 'startDate' ? null : 'startDate', viewDate: form.startDate ? new Date(form.startDate) : new Date(), rect: rect || null }));
                                }}
                                className={`w-full flex items-center rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-4 text-slate-900 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm text-left text-sm ${
                                  datePickerConfig.field === 'startDate' ? 'ring-4 ring-indigo-500/10 border-indigo-500' : ''
                                }`}
                              >
                                {form.startDate ? new Date(form.startDate).toLocaleDateString('tr-TR') : <span className="text-slate-400">Tarih seçin...</span>}
                              </button>
                              </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700">Hedef Tarih</label>
                            <div className="relative group">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-indigo-600 z-10" />
                              <button 
                                ref={triggerRefs.endDate}
                                type="button"
                                onClick={() => {
                                  const rect = triggerRefs.endDate.current?.getBoundingClientRect();
                                  setDatePickerConfig(c => ({ field: c.field === 'endDate' ? null : 'endDate', viewDate: form.endDate ? new Date(form.endDate) : new Date(), rect: rect || null }));
                                }}
                                className={`w-full flex items-center rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-4 text-slate-900 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm text-left text-sm ${
                                  datePickerConfig.field === 'endDate' ? 'ring-4 ring-indigo-500/10 border-indigo-500' : ''
                                }`}
                              >
                                {form.endDate ? new Date(form.endDate).toLocaleDateString('tr-TR') : <span className="text-slate-400">Tarih seçin...</span>}
                              </button>
                              </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs">05</span>
                            Proje Amacı & Açıklama
                          </label>
                          <div className="relative">
                            <AlignLeft className="absolute left-4 top-4 h-5 w-5 text-slate-400 pointer-events-none" />
                            <textarea 
                              rows={4} 
                              value={form.description || ''} 
                              onChange={(e) => updateForm({ description: e.target.value })} 
                              placeholder="Projenin hedeflerini ve kapsamını kısaca açıklayın..." 
                              className="w-full resize-none rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-4 text-slate-900 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700">Problem Tanımı</label>
                          <textarea rows={3} value={form.problemStatement || ''} onChange={(e) => updateForm({ problemStatement: e.target.value })} placeholder="Çözülmek istenen sorun nedir?" className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700">Doğrudan Değer / Getiri</label>
                          <textarea rows={2} value={form.directValue || ''} onChange={(e) => updateForm({ directValue: e.target.value })} placeholder="Örn: %20 maliyet düşüşü veya operasyonel hız" className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700">Fizibilite Skoru (0-100)</label>
                          <div className="flex items-center gap-4">
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={form.feasibilityScore || 50} 
                              onChange={(e) => updateForm({ feasibilityScore: parseInt(e.target.value) })} 
                              className="flex-1 accent-indigo-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700">%{form.feasibilityScore || 50}</div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700">Hedef Kitle / Kullanıcılar</label>
                          <textarea rows={3} value={form.targetUsers || ''} onChange={(e) => updateForm({ targetUsers: e.target.value })} placeholder="Projeden kimler yararlanacak?" className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700">Stratejik Uyum</label>
                          <textarea rows={2} value={form.strategicAlignment || ''} onChange={(e) => updateForm({ strategicAlignment: e.target.value })} placeholder="Şirket vizyonu ve yıllık hedeflerle uyumu..." className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700">Yapılmama Etkisi (Opportunity Cost)</label>
                          <textarea rows={2} value={form.notDoingImpact || ''} onChange={(e) => updateForm({ notDoingImpact: e.target.value })} placeholder="Bu proje yapılmazsa ne kaybedilir veya hangi risk doğar?" className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                      <div className="space-y-6">
                        <div className="space-y-2.5">
                          <label className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg inline-block">Kapsam İçi (In Scope)</label>
                          <textarea rows={4} value={form.inScope || ''} onChange={(e) => updateForm({ inScope: e.target.value })} placeholder="Bu projede neler yapılacak? Ana teslimatlar neler?" className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-sm" />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-sm font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg inline-block">Kapsam Dışı (Out of Scope)</label>
                          <textarea rows={4} value={form.outOfScope || ''} onChange={(e) => updateForm({ outOfScope: e.target.value })} placeholder="Neler KESİNLİKLE yapılmayacak? Sınırlar nerede bitiyor?" className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 transition-all focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 shadow-sm" />
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2.5">
                          <label className="text-sm font-bold text-slate-700">Varsayımlar</label>
                          <textarea rows={2} value={form.assumptions || ''} onChange={(e) => updateForm({ assumptions: e.target.value })} placeholder="Dış kaynakların hazır olması, veri kalitesi vb..." className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm" />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-sm font-bold text-slate-700">Kısıtlar (Zaman, Bütçe, Teknoloji)</label>
                          <textarea rows={2} value={form.constraints || ''} onChange={(e) => updateForm({ constraints: e.target.value })} placeholder="Örn: 31 Aralık son tarih, React Native kullanımı zorunlu..." className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm" />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-sm font-bold text-slate-700">Kabul Kriterleri</label>
                          <textarea rows={3} value={form.acceptanceCriteria || ''} onChange={(e) => updateForm({ acceptanceCriteria: e.target.value })} placeholder="Projenin başarılı sayılması için hangi şartlar sağlanmalı?" className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-8">
                      <div className="rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">Paydaş Analizi</h3>
                            <p className="text-xs text-slate-500">Proje üzerindeki etkisi ve ilgisi olan kişileri tanımlayın.</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Ad Soyad</label>
                            <input type="text" placeholder="Örn: Ahmet Yılmaz" value={newStakeholder.name} onChange={(e) => setNewStakeholder(s => ({ ...s, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Rol / Departman</label>
                            <input type="text" placeholder="Örn: IT Müdürü" value={newStakeholder.role} onChange={(e) => setNewStakeholder(s => ({ ...s, role: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">İlgi Derecesi</label>
                            <div className="relative">
                              <button
                                ref={triggerRefs.interest}
                                type="button"
                                onClick={() => {
                                  const rect = triggerRefs.interest.current?.getBoundingClientRect();
                                  setActiveDropdown(curr => ({ type: curr.type === 'interest' ? null : 'interest', rect: rect || null }));
                                }}
                                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                              >
                                <span className="font-medium text-slate-900">{newStakeholder.interest} İlgi</span>
                                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown.type === 'interest' ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Güç / Karar Yetkisi</label>
                            <div className="relative">
                              <button
                                ref={triggerRefs.power}
                                type="button"
                                onClick={() => {
                                  const rect = triggerRefs.power.current?.getBoundingClientRect();
                                  setActiveDropdown(curr => ({ type: curr.type === 'power' ? null : 'power', rect: rect || null }));
                                }}
                                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                              >
                                <span className="font-medium text-slate-900">{newStakeholder.power} Güç</span>
                                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown.type === 'power' ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5 lg:col-span-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">İletişim Kanalı</label>
                            <input type="text" placeholder="Örn: Haftalık Toplantı, Slack" value={newStakeholder.communicationMethod} onChange={(e) => setNewStakeholder(s => ({ ...s, communicationMethod: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
                          </div>
                          <div className="flex items-end">
                            <button 
                              type="button" 
                              onClick={addStakeholder} 
                              disabled={!newStakeholder.name || !newStakeholder.role} 
                              className="w-full h-[46px] rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50 active:scale-95"
                            >
                              Listeye Ekle
                            </button>
                          </div>
                        </div>
                      </div>

                      {form.stakeholders && form.stakeholders.length > 0 && (
                        <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                              <tr>
                                <th className="px-6 py-4">Paydaş</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Matris (İ/G)</th>
                                <th className="px-6 py-4">İletişim</th>
                                <th className="px-6 py-4 text-right">İşlem</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {form.stakeholders.map((s, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                                  <td className="px-6 py-4 text-slate-600">{s.role}</td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${
                                      s.power === 'Yüksek' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {s.interest.charAt(0)} / {s.power.charAt(0)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-500">{s.communicationMethod || '-'}</td>
                                  <td className="px-6 py-4 text-right">
                                    <button type="button" onClick={() => removeStakeholder(i)} className="rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                      <X className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-8">
                      <div className="rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                            <AlignLeft className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">Gereksinimler (MoSCoW)</h3>
                            <p className="text-xs text-slate-500">Projenin olmazsa olmazlarını ve önceliklerini belirleyin.</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                          <div className="col-span-1 lg:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Gereksinim Başlığı</label>
                            <input type="text" placeholder="Örn: Kullanıcı Giriş Modülü" value={newRequirement.title} onChange={(e) => setNewRequirement(r => ({ ...r, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Tip</label>
                            <div className="relative">
                              <button
                                ref={triggerRefs.reqType}
                                type="button"
                                onClick={() => {
                                  const rect = triggerRefs.reqType.current?.getBoundingClientRect();
                                  setActiveDropdown(curr => ({ type: curr.type === 'reqType' ? null : 'reqType', rect: rect || null }));
                                }}
                                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                              >
                                <span className="font-medium text-slate-900">{newRequirement.type}</span>
                                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown.type === 'reqType' ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Öncelik (MoSCoW)</label>
                            <div className="relative">
                              <button
                                ref={triggerRefs.reqPriority}
                                type="button"
                                onClick={() => {
                                  const rect = triggerRefs.reqPriority.current?.getBoundingClientRect();
                                  setActiveDropdown(curr => ({ type: curr.type === 'reqPriority' ? null : 'reqPriority', rect: rect || null }));
                                }}
                                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                              >
                                <span className="font-medium text-slate-900">{newRequirement.priority}</span>
                                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown.type === 'reqPriority' ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                          <div className="col-span-1 lg:col-span-4 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Açıklama & Kabul Şartı</label>
                            <input type="text" placeholder="Gereksinimin detaylarını ve nasıl test edileceğini yazın..." value={newRequirement.description} onChange={(e) => setNewRequirement(r => ({ ...r, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
                          </div>
                          <div className="flex items-end lg:col-start-4">
                            <button 
                              type="button" 
                              onClick={addRequirement} 
                              disabled={!newRequirement.title || !newRequirement.description} 
                              className="w-full h-[46px] rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50"
                            >
                              Ekle
                            </button>
                          </div>
                        </div>
                      </div>

                      {form.requirements && form.requirements.length > 0 && (
                        <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                              <tr>
                                <th className="px-6 py-4">Başlık</th>
                                <th className="px-6 py-4">Öncelik</th>
                                <th className="px-6 py-4">Tip</th>
                                <th className="px-6 py-4 text-right">İşlem</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {form.requirements.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-900">{r.title}</td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold ${
                                      r.priority === 'Must' ? 'bg-rose-100 text-rose-700' : 
                                      r.priority === 'Should' ? 'bg-amber-100 text-amber-700' : 
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {r.priority}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-600">{r.type}</td>
                                  <td className="px-6 py-4 text-right">
                                    <button type="button" onClick={() => removeRequirement(i)} className="rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                      <X className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep === 6 && (
                    <div className="space-y-8">
                      <div className="rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                            <ShieldAlert className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">Risk Kaydı</h3>
                            <p className="text-xs text-slate-500">Olası tehditleri ve önleme stratejilerini şimdiden planlayın.</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                          <div className="col-span-1 lg:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Risk Başlığı</label>
                            <input type="text" placeholder="Örn: API Entegrasyon Gecikmesi" value={newRisk.title} onChange={(e) => setNewRisk(r => ({ ...r, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
                          </div>
                          <div className="col-span-1 lg:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Kategori</label>
                            <div className="relative">
                              <button
                                ref={triggerRefs.riskCategory}
                                type="button"
                                onClick={() => {
                                  const rect = triggerRefs.riskCategory.current?.getBoundingClientRect();
                                  setActiveDropdown(curr => ({ type: curr.type === 'riskCategory' ? null : 'riskCategory', rect: rect || null }));
                                }}
                                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                              >
                                <span className="font-medium text-slate-900">{newRisk.category}</span>
                                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${activeDropdown.type === 'riskCategory' ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                          <div className="col-span-1 lg:col-span-2 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Olasılık: {newRisk.probability}</label>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Etki: {newRisk.impact}</label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <input type="range" min="1" max="5" value={newRisk.probability} onChange={(e) => setNewRisk(r => ({ ...r, probability: parseInt(e.target.value) }))} className="accent-indigo-600 h-1.5 bg-slate-200 rounded-lg" />
                              <input type="range" min="1" max="5" value={newRisk.impact} onChange={(e) => setNewRisk(r => ({ ...r, impact: parseInt(e.target.value) }))} className="accent-indigo-600 h-1.5 bg-slate-200 rounded-lg" />
                            </div>
                          </div>
                          <div className="col-span-1 lg:col-span-2 flex items-end">
                            <button 
                              type="button" 
                              onClick={addRisk} 
                              disabled={!newRisk.title} 
                              className="w-full h-[46px] rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700"
                            >
                              Listeye Ekle
                            </button>
                          </div>
                        </div>
                      </div>

                      {form.risks && form.risks.length > 0 && (
                        <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                              <tr>
                                <th className="px-6 py-4">Risk</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4">Skor (OxE)</th>
                                <th className="px-6 py-4 text-right">İşlem</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {form.risks.map((r, i) => {
                                const score = r.probability * r.impact;
                                return (
                                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900">{r.title}</td>
                                    <td className="px-6 py-4 text-slate-600">{r.category}</td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full transition-all ${score >= 15 ? 'bg-rose-500' : score >= 8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${(score / 25) * 100}%` }}
                                          />
                                        </div>
                                        <span className={`text-[10px] font-bold ${score >= 15 ? 'text-rose-600' : score >= 8 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                          {score}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <button type="button" onClick={() => removeRisk(i)} className="rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                        <X className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep === 7 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="max-w-md w-full rounded-[40px] border border-slate-200 bg-slate-50/50 p-10 text-center space-y-6">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-100">
                          <Layers className="h-10 w-10" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Otomatik WBS & Görevler</h3>
                          <p className="text-sm text-slate-500 mt-2">Projenizin iskeletini oluşturmak ister misiniz? Şablonlarımızı kullanarak hızlı başlayın.</p>
                        </div>
                        
                        <div className="space-y-4">
                          <button 
                            type="button"
                            onClick={() => updateForm({ createDefaultWbsTasks: !form.createDefaultWbsTasks })}
                            className={`w-full flex items-center justify-between rounded-2xl border-2 px-6 py-4 transition-all ${
                              form.createDefaultWbsTasks 
                                ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="text-left">
                              <p className={`text-sm font-bold ${form.createDefaultWbsTasks ? 'text-indigo-700' : 'text-slate-700'}`}>Varsayılan Şablonu Kullan</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Analiz, Tasarım, Geliştirme, Test</p>
                            </div>
                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              form.createDefaultWbsTasks ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'
                            }`}>
                              {form.createDefaultWbsTasks && <CheckCircle2 className="h-4 w-4 text-white" />}
                            </div>
                          </button>
                        </div>

                        {form.createDefaultWbsTasks && (
                          <div className="pt-2 animate-in fade-in zoom-in-95">
                            <div className="relative">
                              <button
                                ref={triggerRefs.wbsTemplate}
                                type="button"
                                onClick={() => {
                                  const rect = triggerRefs.wbsTemplate.current?.getBoundingClientRect();
                                  setActiveDropdown(curr => ({ type: curr.type === 'wbsTemplate' ? null : 'wbsTemplate', rect: rect || null }));
                                }}
                                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 text-left text-sm font-bold text-slate-700 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                              >
                                <span>
                                  {form.selectedWbsTemplate === 'software' ? 'Yazılım Geliştirme Yaşam Döngüsü' : 
                                   form.selectedWbsTemplate === 'marketing' ? 'Pazarlama Kampanyası' : 
                                   form.selectedWbsTemplate === 'infrastructure' ? 'BT Altyapı Kurulumu' : 'Boş Proje'}
                                </span>
                                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${activeDropdown.type === 'wbsTemplate' ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 8 && (
                    <div className="flex flex-col items-center justify-center h-full space-y-10">
                      <div className="text-center space-y-4">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce shadow-xl shadow-emerald-50">
                          <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">Hazırsınız!</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                          Proje planlaması başarıyla tamamlandı. Artık projenizi başlatabilir ve ekibinizle çalışmaya koyulabilirsiniz.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                        <div className="group rounded-[32px] border border-slate-100 bg-white p-6 transition-all hover:shadow-xl hover:-translate-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Paydaşlar</p>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                              <Users className="h-5 w-5" />
                            </div>
                            <p className="text-2xl font-black text-slate-900">{form.stakeholders?.length || 0}</p>
                          </div>
                        </div>
                        <div className="group rounded-[32px] border border-slate-100 bg-white p-6 transition-all hover:shadow-xl hover:-translate-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Gereksinimler</p>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                              <AlignLeft className="h-5 w-5" />
                            </div>
                            <p className="text-2xl font-black text-slate-900">{form.requirements?.length || 0}</p>
                          </div>
                        </div>
                        <div className="group rounded-[32px] border border-slate-100 bg-white p-6 transition-all hover:shadow-xl hover:-translate-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Riskler</p>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                              <ShieldAlert className="h-5 w-5" />
                            </div>
                            <p className="text-2xl font-black text-slate-900">{form.risks?.length || 0}</p>
                          </div>
                        </div>
                        <div className="group rounded-[32px] border border-slate-100 bg-white p-6 transition-all hover:shadow-xl hover:-translate-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">WBS Kurulumu</p>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                              <Layers className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-black text-slate-900 uppercase">{form.createDefaultWbsTasks ? 'Aktif' : 'Atlandı'}</p>
                          </div>
                        </div>
                      </div>

                      {!form.name && (
                        <div className="flex items-center gap-3 rounded-[24px] bg-rose-50 px-6 py-4 text-sm font-bold text-rose-600 ring-1 ring-rose-100">
                          <ShieldAlert className="h-5 w-5 animate-pulse" />
                          Proje adı girilmedi! Lütfen 1. Adıma geri dönün.
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {error && (
              <div className="px-10 pb-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-rose-50 px-5 py-4 text-sm font-medium text-rose-600 flex items-center gap-3"
                >
                  <Activity className="h-5 w-5" />
                  {error}
                </motion.div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-6">
              <button 
                onClick={handlePrev} 
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-indigo-600 shadow-sm ${currentStep === 1 ? 'invisible' : ''}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="rounded-[20px] px-8 py-4 text-sm font-bold text-slate-500 transition-all hover:text-slate-900 hover:bg-slate-50"
                >
                  İptal
                </button>
                <button 
                  type="button" 
                  onClick={handleNext} 
                  disabled={isSubmitting || (currentStep === 1 && !form.name)} 
                  className={`group flex items-center gap-3 rounded-[20px] px-10 py-4 text-sm font-bold text-white shadow-2xl transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                    currentStep === STEPS.length ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      {currentStep === STEPS.length || initialProject ? (initialProject ? 'Değişiklikleri Kaydet' : 'Projeyi Hemen Başlat') : 'Sonraki Adım'}
                      {currentStep < STEPS.length && !initialProject && <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                    </>
                  )}
                </button>
              </div>
            </div>

          </motion.div>

          {/* Root Level Popovers (Escapes modal overflow restrictions) */}
          <AnimatePresence>
            {activeDropdown.type === 'category' && activeDropdown.rect && (
              <div className="fixed inset-0 z-[200]">
                <div className="absolute inset-0" onClick={() => setActiveDropdown({ type: null, rect: null })} />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{ top: activeDropdown.rect.bottom + 8, left: activeDropdown.rect.left, width: activeDropdown.rect.width }}
                  className="absolute z-[210] overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-slate-900/5"
                >
                  {['Web Geliştirme', 'Mobil Geliştirme', 'AI / ML', 'Diğer'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateForm({ category: cat });
                        setActiveDropdown({ type: null, rect: null });
                      }}
                      className={`flex w-full items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-600 rounded-xl ${
                        form.category === cat ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </motion.div>
              </div>
            )}
            
            {activeDropdown.type === 'manager' && activeDropdown.rect && (
              <div className="fixed inset-0 z-[200]">
                <div className="absolute inset-0" onClick={() => setActiveDropdown({ type: null, rect: null })} />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{ top: activeDropdown.rect.bottom + 8, left: activeDropdown.rect.left, width: activeDropdown.rect.width }}
                  className="absolute z-[210] max-h-[240px] overflow-y-auto no-scrollbar rounded-2xl border border-slate-100 bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-slate-900/5"
                >
                  {managers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateForm({ managerId: m.id });
                        setActiveDropdown({ type: null, rect: null });
                      }}
                      className={`flex w-full items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-600 rounded-xl ${
                        form.managerId === m.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={resolveAvatarUrl(m.avatar)} alt="" className="h-6 w-6 rounded-full" />
                        {m.name}
                      </div>
                    </button>
                  ))}
                </motion.div>
              </div>
            )}

            {activeDropdown.type === 'interest' && activeDropdown.rect && (
              <div className="fixed inset-0 z-[200]">
                <div className="absolute inset-0" onClick={() => setActiveDropdown({ type: null, rect: null })} />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{ top: activeDropdown.rect.bottom + 8, left: activeDropdown.rect.left, width: activeDropdown.rect.width }}
                  className="absolute z-[210] overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-slate-900/5"
                >
                  {['Düşük', 'Orta', 'Yüksek'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewStakeholder(s => ({ ...s, interest: opt as any }));
                        setActiveDropdown({ type: null, rect: null });
                      }}
                      className={`flex w-full items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-600 rounded-xl ${
                        newStakeholder.interest === opt ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      {opt} İlgi
                    </button>
                  ))}
                </motion.div>
              </div>
            )}

            {activeDropdown.type === 'power' && activeDropdown.rect && (
              <div className="fixed inset-0 z-[200]">
                <div className="absolute inset-0" onClick={() => setActiveDropdown({ type: null, rect: null })} />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{ top: activeDropdown.rect.bottom + 8, left: activeDropdown.rect.left, width: activeDropdown.rect.width }}
                  className="absolute z-[210] overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-slate-900/5"
                >
                  {['Düşük', 'Orta', 'Yüksek'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewStakeholder(s => ({ ...s, power: opt as any }));
                        setActiveDropdown({ type: null, rect: null });
                      }}
                      className={`flex w-full items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-600 rounded-xl ${
                        newStakeholder.power === opt ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      {opt} Güç
                    </button>
                  ))}
                </motion.div>
              </div>
            )}

            {activeDropdown.type === 'reqType' && activeDropdown.rect && (
              <div className="fixed inset-0 z-[200]">
                <div className="absolute inset-0" onClick={() => setActiveDropdown({ type: null, rect: null })} />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{ top: activeDropdown.rect.bottom + 8, left: activeDropdown.rect.left, width: activeDropdown.rect.width }}
                  className="absolute z-[210] overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-slate-900/5"
                >
                  {['İşlevsel', 'İşlevsel Olmayan'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewRequirement(r => ({ ...r, type: opt as any }));
                        setActiveDropdown({ type: null, rect: null });
                      }}
                      className={`flex w-full items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-600 rounded-xl ${
                        newRequirement.type === opt ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      {opt === 'İşlevsel Olmayan' ? 'Teknik / Kalite' : opt}
                    </button>
                  ))}
                </motion.div>
              </div>
            )}

            {activeDropdown.type === 'reqPriority' && activeDropdown.rect && (
              <div className="fixed inset-0 z-[200]">
                <div className="absolute inset-0" onClick={() => setActiveDropdown({ type: null, rect: null })} />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{ top: activeDropdown.rect.bottom + 8, left: activeDropdown.rect.left, width: activeDropdown.rect.width }}
                  className="absolute z-[210] overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-slate-900/5"
                >
                  {[
                    { val: 'Must', label: 'Must Have (Kritik)' },
                    { val: 'Should', label: 'Should Have (Önemli)' },
                    { val: 'Could', label: 'Could Have (Olsa İyi Olur)' },
                    { val: 'Won\'t', label: 'Won\'t Have (Gelecek Sürüm)' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewRequirement(r => ({ ...r, priority: opt.val as any }));
                        setActiveDropdown({ type: null, rect: null });
                      }}
                      className={`flex w-full items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-600 rounded-xl ${
                        newRequirement.priority === opt.val ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              </div>
            )}

            {activeDropdown.type === 'riskCategory' && activeDropdown.rect && (
              <div className="fixed inset-0 z-[200]">
                <div className="absolute inset-0" onClick={() => setActiveDropdown({ type: null, rect: null })} />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{ top: activeDropdown.rect.bottom + 8, left: activeDropdown.rect.left, width: activeDropdown.rect.width }}
                  className="absolute z-[210] overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-slate-900/5"
                >
                  {['Teknik', 'Planlama', 'Yönetim', 'Finansal', 'Dış Faktör'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewRisk(r => ({ ...r, category: opt as any }));
                        setActiveDropdown({ type: null, rect: null });
                      }}
                      className={`flex w-full items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-600 rounded-xl ${
                        newRisk.category === opt ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      {opt === 'Yönetim' ? 'Yönetim / İK' : opt === 'Dış Faktör' ? 'Dış Faktör / Yasal' : opt}
                    </button>
                  ))}
                </motion.div>
              </div>
            )}

            {activeDropdown.type === 'wbsTemplate' && activeDropdown.rect && (
              <div className="fixed inset-0 z-[200]">
                <div className="absolute inset-0" onClick={() => setActiveDropdown({ type: null, rect: null })} />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{ top: activeDropdown.rect.bottom + 8, left: activeDropdown.rect.left, width: activeDropdown.rect.width }}
                  className="absolute z-[210] overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-slate-900/5"
                >
                  {[
                    { val: 'empty', label: 'Boş Proje' },
                    { val: 'software', label: 'Yazılım Geliştirme Yaşam Döngüsü' },
                    { val: 'marketing', label: 'Pazarlama Kampanyası' },
                    { val: 'infrastructure', label: 'BT Altyapı Kurulumu' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateForm({ selectedWbsTemplate: opt.val as any });
                        setActiveDropdown({ type: null, rect: null });
                      }}
                      className={`flex w-full items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-600 rounded-xl ${
                        form.selectedWbsTemplate === opt.val ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              </div>
            )}

            {datePickerConfig.field && renderDatePicker(datePickerConfig.field)}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
