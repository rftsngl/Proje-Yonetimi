import { useMemo, useState } from 'react';
import { CalendarEvent, CreateCalendarEventPayload } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';

interface CalendarProps {
  events: CalendarEvent[];
  onCreateEvent?: (payload: CreateCalendarEventPayload) => Promise<void>;
  onDeleteEvent?: (eventId: string) => Promise<void>;
}

const DAYS_OF_WEEK = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];

const EVENT_OPTIONS = [
  { label: 'Tasarim', value: 'tasarim', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { label: 'Toplanti', value: 'toplanti', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { label: 'Gelistirme', value: 'gelistirme', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { label: 'Kritik Uyari', value: 'kritik', color: 'bg-rose-100 text-rose-700 border-rose-200' },
];

const formatDateParts = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const toLocalDateString = (value: Date) =>
  formatDateParts(value.getFullYear(), value.getMonth(), value.getDate());

const normalizeDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return toLocalDateString(parsed);
  }

  return value.slice(0, 10);
};

export default function Calendar({ events, onCreateEvent, onDeleteEvent }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 27));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState(EVENT_OPTIONS[0].value);
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = Array.from({ length: adjustedFirstDay }, (_, i) => ({
    day: daysInPrevMonth - adjustedFirstDay + i + 1,
    month: month - 1,
    year,
    isCurrentMonth: false,
  }));

  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    month,
    year,
    isCurrentMonth: true,
  }));

  const remainingCells = 42 - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => ({
    day: i + 1,
    month: month + 1,
    year,
    isCurrentMonth: false,
  }));

  const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  const selectedEventOption = useMemo(
    () => EVENT_OPTIONS.find((option) => option.value === eventType) || EVENT_OPTIONS[0],
    [eventType],
  );

  const openCreateModal = (date?: string) => {
    setSelectedDate(date || formatDateParts(year, month, 1));
    setTitle('');
    setEventType(EVENT_OPTIONS[0].value);
    setIsModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsModalOpen(false);
    setTitle('');
    setEventType(EVENT_OPTIONS[0].value);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (day: number, m: number, y: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
  };

  const getDateString = (day: number, m: number, y: number) => formatDateParts(y, m, day);

  const getEventsForDay = (day: number, m: number, y: number) => {
    const dateStr = getDateString(day, m, y);
    return events.filter((event) => normalizeDate(event.date) === dateStr);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedDate || !onCreateEvent) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateEvent({
        title: title.trim(),
        date: selectedDate,
        color: selectedEventOption.color,
        eventType: selectedEventOption.value,
      });
      const [eventYear, eventMonth] = selectedDate.split('-').map(Number);
      if (eventYear && eventMonth) {
        setCurrentDate(new Date(eventYear, eventMonth - 1, 1));
      }
      closeCreateModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!onDeleteEvent) {
      return;
    }

    const confirmed = window.confirm(`"${eventTitle}" etkinligini silmek istediginize emin misiniz?`);
    if (!confirmed) {
      return;
    }

    setDeletingEventId(eventId);
    try {
      await onDeleteEvent(eventId);
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Takvim</h1>
          <p className="mt-1 text-slate-500">Gorevlerinizi, teslim tarihlerini ve ozel uyari etkinliklerini buradan yonetin.</p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Etkinlik Ekle
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex items-center gap-4">
            <h2 className="min-w-[150px] text-xl font-bold text-slate-900">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <button onClick={handlePrevMonth} className="rounded-md p-1.5 text-slate-600 transition-all hover:bg-slate-50">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={handleNextMonth} className="rounded-md p-1.5 text-slate-600 transition-all hover:bg-slate-50">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-xl px-4 py-2 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-50"
          >
            Bugun
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {allDays.map((dateObj, index) => {
            const dayEvents = getEventsForDay(dateObj.day, dateObj.month, dateObj.year);
            const today = isToday(dateObj.day, dateObj.month, dateObj.year);
            const cellDate = getDateString(dateObj.day, dateObj.month, dateObj.year);

            return (
              <div
                key={`${cellDate}-${index}`}
                className={`group relative min-h-[120px] border-b border-r border-slate-50 p-2 transition-colors hover:bg-slate-50/30 ${
                  !dateObj.isCurrentMonth ? 'bg-slate-50/50' : ''
                } ${today ? 'bg-indigo-50/50' : ''}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`text-sm font-bold ${
                      !dateObj.isCurrentMonth ? 'text-slate-300' : today ? 'text-indigo-600' : 'text-slate-600'
                    }`}
                  >
                    {dateObj.day}
                  </span>
                  <div className="flex items-center gap-1">
                    {today && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                    <button
                      onClick={() => openCreateModal(cellDate)}
                      className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 opacity-0 shadow-sm transition-all hover:text-indigo-600 group-hover:opacity-100"
                      title="Bu gune etkinlik ekle"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold transition-all hover:brightness-95 ${event.color}`}
                    >
                      <span className="min-w-0 flex-1 truncate">{event.title}</span>
                      <button
                        onClick={(eventClick) => {
                          eventClick.stopPropagation();
                          void handleDeleteEvent(event.id, event.title);
                        }}
                        disabled={deletingEventId === event.id}
                        className="rounded-sm p-0.5 transition-colors hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Etkinligi sil"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        {EVENT_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${option.color.split(' ')[0].replace('100', '500')}`} />
            <span className="text-xs font-bold text-slate-600">{option.label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCreateModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="relative w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl shadow-slate-900/10"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Yeni Takvim Etkinligi</h3>
                  <p className="mt-1 text-sm text-slate-500">Toplanti, uyari veya ozel hatirlatma ekleyebilirsin.</p>
                </div>
                <button onClick={closeCreateModal} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Baslik</label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Orn. Musteri sunumu"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Tarih</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-type-select" className="mb-2 block text-sm font-bold text-slate-700">Tur</label>
                    <select
                      id="event-type-select"
                      title="Etkinlik Türü"
                      value={eventType}
                      onChange={(event) => setEventType(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {EVENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${selectedEventOption.color}`}>
                      {selectedEventOption.label}
                    </div>
                    <div className="text-sm text-slate-500">
                      Secilen tarih: <span className="font-bold text-slate-700">{selectedDate || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeCreateModal}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100"
                >
                  Vazgec
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim() || !selectedDate || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {isSubmitting ? 'Kaydediliyor...' : 'Etkinligi Kaydet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
