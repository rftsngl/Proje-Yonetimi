import { useMemo, useState, useRef, useEffect } from 'react';
import { Project, Task, CalendarEvent, CreateCalendarEventPayload } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2, X, Sparkles, Briefcase, CheckSquare } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface CalendarProps {
  events: CalendarEvent[];
  projects: Project[];
  tasks: Task[];
  onCreateEvent?: (payload: CreateCalendarEventPayload) => Promise<void>;
  onUpdateEvent?: (eventId: string, payload: CreateCalendarEventPayload) => Promise<void>;
  onDeleteEvent?: (eventId: string) => Promise<void>;
}

const DAYS_OF_WEEK = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const EVENT_OPTIONS = [
  { label: 'Tasarım', value: 'tasarim', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-indigo-50' },
  { label: 'Toplantı', value: 'toplanti', color: 'bg-amber-50 text-amber-700 border-amber-100 shadow-amber-50' },
  { label: 'Geliştirme', value: 'gelistirme', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-50' },
  { label: 'Kritik Uyarı', value: 'kritik', color: 'bg-rose-50 text-rose-700 border-rose-100 shadow-rose-50' },
];

const REMINDER_OPTIONS = [
  { label: 'Yok', value: 0 },
  { label: '15 Dakika Önce', value: 15 },
  { label: '1 Saat Önce', value: 60 },
  { label: '3 Saat Önce', value: 180 },
  { label: '1 Gün Önce', value: 1440 },
  { label: '3 Gün Önce', value: 4320 },
];

const formatDateParts = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const toLocalDateString = (value: Date) =>
  formatDateParts(value.getFullYear(), value.getMonth(), value.getDate());

const normalizeDate = (value: string | undefined) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) ? toLocalDateString(parsed) : value.slice(0, 10);
};

const isDateInRange = (checkDate: string, start: string, end?: string) => {
  const check = new Date(checkDate).getTime();
  const s = new Date(normalizeDate(start)).getTime();
  
  // Senaryo A: Sadece başlangıç ve bitiş tarihlerinde göster
  if (end) {
    const e = new Date(normalizeDate(end)).getTime();
    return check === s || check === e;
  }
  
  return check === s;
};

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    filter: 'blur(4px)'
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    filter: 'blur(4px)',
    transition: { duration: 0.3 }
  })
};

export default function Calendar({ events, projects, tasks, onCreateEvent, onUpdateEvent, onDeleteEvent }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState(EVENT_OPTIONS[0].value);
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()));
  const [endDate, setEndDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [pickerViewDate, setPickerViewDate] = useState(new Date());
  
  const [reminderOffset, setReminderOffset] = useState(0);
  const [isReminderDropdownOpen, setIsReminderDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const reminderDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (reminderDropdownRef.current && !reminderDropdownRef.current.contains(event.target as Node)) {
        setIsReminderDropdownOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsStartDatePickerOpen(false);
        setIsEndDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysData = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const prev = Array.from({ length: adjustedFirstDay }, (_, i) => ({
      day: daysInPrevMonth - adjustedFirstDay + i + 1,
      month: month - 1,
      year,
      isCurrentMonth: false,
    }));

    const current = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      month,
      year,
      isCurrentMonth: true,
    }));

    const remaining = 42 - (prev.length + current.length);
    const next = Array.from({ length: remaining }, (_, i) => ({
      day: i + 1,
      month: month + 1,
      year,
      isCurrentMonth: false,
    }));

    return [...prev, ...current, ...next];
  }, [year, month]);

  const getPickerDays = (viewDate: Date) => {
    const vYear = viewDate.getFullYear();
    const vMonth = viewDate.getMonth();
    const firstDay = new Date(vYear, vMonth, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(vYear, vMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(vYear, vMonth, 0).getDate();

    const prev = Array.from({ length: adjustedFirstDay }, (_, i) => ({
      day: daysInPrevMonth - adjustedFirstDay + i + 1,
      month: vMonth - 1,
      year: vYear,
      isCurrentMonth: false,
    }));

    const current = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      month: vMonth,
      year: vYear,
      isCurrentMonth: true,
    }));

    const remaining = 42 - (prev.length + current.length);
    const next = Array.from({ length: remaining }, (_, i) => ({
      day: i + 1,
      month: vMonth + 1,
      year: vYear,
      isCurrentMonth: false,
    }));

    return [...prev, ...current, ...next];
  };

  const handleMonthChange = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentDate(new Date(year, month + newDirection, 1));
  };

  const isToday = (day: number, m: number, y: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
  };

  const unifiedItems = useMemo(() => {
    const items: (CalendarEvent & { type: 'event' | 'project' | 'task', originalId: string })[] = [];

    // Kullanıcı Etkinlikleri
    events.forEach(e => items.push({ ...e, type: 'event', originalId: e.id }));

    // Projeler
    projects.forEach(p => {
      if (p.startDate || p.endDate) {
        items.push({
          id: `prj-${p.id}`,
          originalId: p.id,
          title: `PROJE: ${p.name}`,
          date: p.startDate || p.endDate || '',
          endDate: p.endDate || undefined,
          color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          type: 'project',
          eventType: 'project'
        });
      }
    });

    // Görevler
    tasks.forEach(t => {
      if (t.startDate || t.dueDate) {
        items.push({
          id: `tsk-${t.id}`,
          originalId: t.id,
          title: t.title,
          date: t.startDate || t.dueDate || '',
          endDate: t.dueDate || undefined,
          color: t.status === 'Tamamlandı' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-700 border-slate-100',
          type: 'task',
          eventType: 'task'
        });
      }
    });

    return items;
  }, [events, projects, tasks]);

  const getDateString = (day: number, m: number, y: number) => formatDateParts(y, m, day);

  const getItemsForDay = (day: number, m: number, y: number) => {
    const dateStr = getDateString(day, m, y);
    return unifiedItems.filter((item) => isDateInRange(dateStr, item.date, item.endDate));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedDate) return;
    
    setIsSubmitting(true);
    try {
      const option = EVENT_OPTIONS.find(o => o.value === eventType) || EVENT_OPTIONS[0];
      const payload: CreateCalendarEventPayload = { 
        title: title.trim(), 
        date: selectedDate, 
        endDate: endDate || undefined,
        reminderOffset: reminderOffset > 0 ? reminderOffset : undefined,
        color: option.color, 
        eventType 
      };

      if (editingEvent && onUpdateEvent) {
        await onUpdateEvent(editingEvent.id, payload);
      } else if (onCreateEvent) {
        await onCreateEvent(payload);
      }

      const [eYear, eMonth] = selectedDate.split('-').map(Number);
      if (eYear && eMonth) setCurrentDate(new Date(eYear, eMonth - 1, 1));
      
      setIsModalOpen(false);
      setTitle('');
      setEditingEvent(null);
      setReminderOffset(0);
      setIsCategoryDropdownOpen(false);
      setIsReminderDropdownOpen(false);
      setIsStartDatePickerOpen(false);
      setIsEndDatePickerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (!onDeleteEvent) return;
    setConfirmModal({
      isOpen: true,
      title: 'Etkinliği Sil',
      message: `"${eventTitle}" etkinliğini silmek istediğinize emin misiniz?`,
      onConfirm: async () => {
        setConfirmModal(p => ({ ...p, isOpen: false }));
        setDeletingEventId(eventId);
        try { await onDeleteEvent(eventId); } finally { setDeletingEventId(null); }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            Takvim
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </h1>
          <p className="mt-1 text-slate-500">Görevlerinizi ve özel etkinlikleri modernize edilmiş takvim görünümüyle yönetin.</p>
        </div>
        <button
          onClick={() => { 
            setEditingEvent(null);
            setTitle('');
            setEventType(EVENT_OPTIONS[0].value);
            setSelectedDate(toLocalDateString(new Date())); 
            setEndDate('');
            setReminderOffset(0);
            setPickerViewDate(new Date());
            setIsCategoryDropdownOpen(false);
            setIsReminderDropdownOpen(false);
            setIsStartDatePickerOpen(false);
            setIsEndDatePickerOpen(false);
            setIsModalOpen(true); 
          }}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Etkinlik Ekle
        </button>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/30 p-8 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.h2
                key={`${year}-${month}`}
                custom={direction}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-black tracking-tight text-slate-900"
              >
                {MONTHS[month]} <span className="text-indigo-600/80">{year}</span>
              </motion.h2>
            </AnimatePresence>
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <button onClick={() => handleMonthChange(-1)} className="rounded-xl p-2 text-slate-600 transition-all hover:bg-slate-50 hover:text-indigo-600">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => { setDirection(currentDate < new Date() ? 1 : -1); setCurrentDate(new Date()); }} 
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600"
              >
                Bugün
              </button>
              <button onClick={() => handleMonthChange(1)} className="rounded-xl p-2 text-slate-600 transition-all hover:bg-slate-50 hover:text-indigo-600">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="hidden items-center gap-4 sm:flex">
             {EVENT_OPTIONS.map(opt => (
               <div key={opt.value} className="flex items-center gap-2">
                 <div className={`h-2.5 w-2.5 rounded-full ${opt.color.split(' ')[0].replace('50', '500')}`} />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{opt.label}</span>
               </div>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-7 bg-slate-50/50">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {day}
            </div>
          ))}
        </div>

        <div className="relative overflow-hidden bg-white">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${year}-${month}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid grid-cols-7"
            >
              {daysData.map((dateObj, index) => {
                const dayItems = getItemsForDay(dateObj.day, dateObj.month, dateObj.year);
                const today = isToday(dateObj.day, dateObj.month, dateObj.year);
                const cellDate = getDateString(dateObj.day, dateObj.month, dateObj.year);

                return (
                  <motion.div
                    key={`${cellDate}-${index}`}
                    whileHover={{ scale: 1.01, zIndex: 10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`group relative min-h-[120px] border-b border-r border-slate-50 p-3 transition-colors ${
                      !dateObj.isCurrentMonth ? 'bg-slate-50/20 opacity-40' : 'hover:bg-indigo-50/20'
                    } ${today ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-100' : ''}`}
                    onClick={() => { 
                      if(dateObj.isCurrentMonth) { 
                        setEditingEvent(null);
                        setTitle('');
                        setEventType(EVENT_OPTIONS[0].value);
                        setSelectedDate(cellDate); 
                        setPickerViewDate(new Date(dateObj.year, dateObj.month, 1));
                        setIsModalOpen(true); 
                      } 
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`text-lg font-black leading-none ${
                          !dateObj.isCurrentMonth ? 'text-slate-300' : today ? 'text-indigo-600' : 'text-slate-800'
                        }`}
                      >
                        {dateObj.day}
                      </span>
                      {today && (
                        <div className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-tighter shadow-lg shadow-indigo-200">
                          Bugün
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {dayItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.type === 'event') {
                              setEditingEvent(item);
                              setTitle(item.title);
                              setEventType(item.eventType || EVENT_OPTIONS[0].value);
                              setSelectedDate(normalizeDate(item.date));
                              setEndDate(item.endDate ? normalizeDate(item.endDate) : '');
                              setReminderOffset(item.reminderOffset || 0);
                              setPickerViewDate(new Date(normalizeDate(item.date)));
                              setIsModalOpen(true);
                            }
                          }}
                          className={`flex cursor-pointer items-center gap-1.5 rounded-xl border border-transparent px-2.5 py-1.5 text-[10px] font-bold shadow-sm transition-all hover:border-current/20 hover:shadow-md ${item.color} ${item.type !== 'event' ? 'opacity-85' : ''}`}
                        >
                          {item.type === 'project' ? <Briefcase className="h-3 w-3 shrink-0" /> : 
                           item.type === 'task' ? <CheckSquare className="h-3 w-3 shrink-0" /> :
                           <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.color.split(' ')[0].replace('50', '500')}`} />}
                          <span className="min-w-0 flex-1 truncate">
                            {item.endDate && normalizeDate(item.date) === cellDate && <span className="mr-1 opacity-70">(Başl.)</span>}
                            {item.endDate && normalizeDate(item.endDate) === cellDate && <span className="mr-1 opacity-70">(Bit.)</span>}
                            {item.title}
                          </span>
                          {item.type === 'event' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteEvent(item.id, item.title); }}
                              className="ml-1 rounded-md p-0.5 opacity-0 transition-all hover:bg-white/50 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                      {dateObj.isCurrentMonth && dayItems.length === 0 && (
                        <div className="flex h-12 items-center justify-center opacity-0 group-hover:opacity-100">
                           <div className="rounded-full bg-white p-2 text-indigo-600 shadow-md ring-1 ring-slate-100">
                             <Plus className="h-4 w-4" />
                           </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsModalOpen(false); setEditingEvent(null); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg rounded-[40px] bg-white p-0 shadow-3xl"
            >
              <div className="bg-indigo-600 p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{editingEvent ? 'Etkinliği Düzenle' : 'Etkinlik Oluştur'}</h3>
                    <p className="mt-1 text-indigo-100 opacity-80">{editingEvent ? 'Mevcut bilgileri güncelleyerek takviminizi tazeleyin.' : 'Takviminize özel bir dokunuş ekleyin.'}</p>
                  </div>
                  <button onClick={() => { setIsModalOpen(false); setEditingEvent(null); }} className="rounded-2xl bg-white/10 p-2 transition-colors hover:bg-white/20">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">Etkinlik Başlığı</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: Master Tasarım Sunumu"
                    autoFocus
                    className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-500/10 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Başlangıç Tarihi</label>
                    <div className="relative" ref={datePickerRef}>
                      <button
                        type="button"
                        onClick={() => { setIsStartDatePickerOpen(!isStartDatePickerOpen); setIsEndDatePickerOpen(false); }}
                        className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all hover:bg-slate-50 focus:border-indigo-500/20 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                      >
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5 text-indigo-500" />
                          <span>{selectedDate.split('-').reverse().join('.')}</span>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isStartDatePickerOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isStartDatePickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="absolute left-0 right-0 z-[120] mt-2 overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-3xl backdrop-blur-xl min-w-[280px]"
                          >
                            <div className="mb-4 flex items-center justify-between px-1">
                              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                {MONTHS[pickerViewDate.getMonth()]} <span className="text-indigo-600">{pickerViewDate.getFullYear()}</span>
                              </h4>
                              <div className="flex gap-1">
                                <button type="button" onClick={() => setPickerViewDate(new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth() - 1, 1))} className="rounded-lg p-1 transition-colors hover:bg-slate-50 text-slate-400 hover:text-indigo-600"><ChevronLeft className="h-4 w-4" /></button>
                                <button type="button" onClick={() => setPickerViewDate(new Date())} className="px-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-700">Bugün</button>
                                <button type="button" onClick={() => setPickerViewDate(new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth() + 1, 1))} className="rounded-lg p-1 transition-colors hover:bg-slate-50 text-slate-400 hover:text-indigo-600"><ChevronRight className="h-4 w-4" /></button>
                              </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map(d => <div key={d} className="text-center text-[8px] font-black text-slate-300 uppercase">{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {getPickerDays(pickerViewDate).map((dateObj, idx) => {
                                const dStr = getDateString(dateObj.day, dateObj.month, dateObj.year);
                                return (
                                  <button
                                    key={`${dStr}-${idx}`}
                                    type="button"
                                    onClick={() => { setSelectedDate(dStr); setIsStartDatePickerOpen(false); }}
                                    className={`aspect-square rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${!dateObj.isCurrentMonth ? 'text-slate-200' : selectedDate === dStr ? 'bg-indigo-600 text-white shadow-lg' : isToday(dateObj.day, dateObj.month, dateObj.year) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                  >
                                    {dateObj.day}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Bitiş Tarihi (Opsiyonel)</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setIsEndDatePickerOpen(!isEndDatePickerOpen); setIsStartDatePickerOpen(false); }}
                        className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all hover:bg-slate-50 focus:border-indigo-500/20 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                      >
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5 text-indigo-500 opacity-50" />
                          <span>{endDate ? endDate.split('-').reverse().join('.') : 'Belirtilmedi'}</span>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isEndDatePickerOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isEndDatePickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="absolute left-0 right-0 z-[120] mt-2 overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-3xl backdrop-blur-xl min-w-[280px]"
                          >
                            <div className="mb-4 flex items-center justify-between px-1">
                              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                {MONTHS[pickerViewDate.getMonth()]} <span className="text-indigo-600">{pickerViewDate.getFullYear()}</span>
                              </h4>
                              <div className="flex gap-1">
                                <button type="button" onClick={() => setPickerViewDate(new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth() - 1, 1))} className="rounded-lg p-1 transition-colors hover:bg-slate-50 text-slate-400 hover:text-indigo-600"><ChevronLeft className="h-4 w-4" /></button>
                                <button type="button" onClick={() => setEndDate('')} className="px-2 text-[10px] font-bold text-rose-500 hover:text-rose-600">Temizle</button>
                                <button type="button" onClick={() => setPickerViewDate(new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth() + 1, 1))} className="rounded-lg p-1 transition-colors hover:bg-slate-50 text-slate-400 hover:text-indigo-600"><ChevronRight className="h-4 w-4" /></button>
                              </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map(d => <div key={d} className="text-center text-[8px] font-black text-slate-300 uppercase">{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {getPickerDays(pickerViewDate).map((dateObj, idx) => {
                                const dStr = getDateString(dateObj.day, dateObj.month, dateObj.year);
                                const isAfterStart = !endDate || new Date(dStr) >= new Date(selectedDate);
                                return (
                                  <button
                                    key={`${dStr}-${idx}`}
                                    type="button"
                                    disabled={new Date(dStr) < new Date(selectedDate)}
                                    onClick={() => { setEndDate(dStr); setIsEndDatePickerOpen(false); }}
                                    className={`aspect-square rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${!dateObj.isCurrentMonth ? 'text-slate-200' : endDate === dStr ? 'bg-indigo-600 text-white shadow-lg' : isToday(dateObj.day, dateObj.month, dateObj.year) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'} ${new Date(dStr) < new Date(selectedDate) ? 'opacity-20 cursor-not-allowed' : ''}`}
                                  >
                                    {dateObj.day}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Hatırlatıcı</label>
                    <div className="relative" ref={reminderDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsReminderDropdownOpen(!isReminderDropdownOpen)}
                        className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all hover:bg-slate-50 focus:border-indigo-500/20 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                      >
                        <div className="flex items-center gap-3">
                          <Plus className={`h-4 w-4 ${reminderOffset > 0 ? 'text-indigo-600' : 'text-slate-400'}`} />
                          {REMINDER_OPTIONS.find(opt => opt.value === reminderOffset)?.label}
                        </div>
                        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isReminderDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isReminderDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="absolute left-0 right-0 z-[110] mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl backdrop-blur-xl"
                          >
                            {REMINDER_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setReminderOffset(option.value);
                                  setIsReminderDropdownOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all ${
                                  reminderOffset === option.value ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Etkinlik Tipi</label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                        className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all hover:bg-slate-50 focus:border-indigo-500/20 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full ${EVENT_OPTIONS.find(opt => opt.value === eventType)?.color.split(' ')[0].replace('50', '500')}`} />
                          {EVENT_OPTIONS.find(opt => opt.value === eventType)?.label}
                        </div>
                        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isCategoryDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="absolute left-0 right-0 z-[110] mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl backdrop-blur-xl"
                          >
                            {EVENT_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setEventType(option.value);
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                                  eventType === option.value 
                                    ? 'bg-indigo-50 text-indigo-600' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                                }`}
                              >
                                <div className={`h-2 w-2 rounded-full ${option.color.split(' ')[0].replace('50', '500')}`} />
                                {option.label}
                                {eventType === option.value && (
                                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => { setIsModalOpen(false); setEditingEvent(null); }}
                    className="rounded-2xl px-6 py-4 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!title.trim() || !selectedDate || isSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <CalendarIcon className="h-5 w-5" />
                    {isSubmitting ? 'Kaydediliyor...' : editingEvent ? 'Değişiklikleri Kaydet' : 'Etkinliği Yayınla'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        {...confirmModal}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
