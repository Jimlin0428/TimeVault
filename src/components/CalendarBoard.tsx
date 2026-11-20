'use client';

import React, { useMemo, useState } from 'react';
import {
  AcademicEvent,
  Course,
  ProgressStatus,
  UserEventProgress,
} from '@/types/pmba';
import {
  CATEGORY_META,
  COURSE_COLOR_MAP,
  formatDateTimeTW,
  STATUS_META,
} from '@/lib/uiHelpers';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  Globe2,
  Lock,
  MapPin,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';

interface CalendarBoardProps {
  events: AcademicEvent[];
  courses: Course[];
  progressMap: Record<string, UserEventProgress>;
  onUpdateStatus: (eventId: string, status: ProgressStatus) => void;
  onOpenQuickNote: (event: AcademicEvent) => void;
  onOpenNewEventOnDate: (dateIsoPrefix: string) => void;
  onEditEvent: (event: AcademicEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CalendarBoard({
  events,
  courses,
  progressMap,
  onUpdateStatus,
  onOpenQuickNote,
  onOpenNewEventOnDate,
  onEditEvent,
  onDeleteEvent,
}: CalendarBoardProps) {
  const today = useMemo(() => new Date(), []);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [viewMonth, setViewMonth] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    toDateKey(today)
  );

  const courseById = useMemo(() => {
    const map: Record<string, Course> = {};
    courses.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [courses]);

  const eventsByDateKey = useMemo(() => {
    const map: Record<string, AcademicEvent[]> = {};
    events
      .filter((e) => selectedCourseId === 'all' || e.course_id === selectedCourseId)
      .forEach((evt) => {
        const dt = new Date(evt.due_at);
        if (Number.isNaN(dt.getTime())) return;
        const key = toDateKey(dt);
        if (!map[key]) map[key] = [];
        map[key].push(evt);
      });
    Object.values(map).forEach((list) =>
      list.sort(
        (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
      )
    );
    return map;
  }, [events, selectedCourseId]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { date: Date; dateKey: string; inCurrentMonth: boolean }[] = [];

    // Leading days from previous month
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({ date: d, dateKey: toDateKey(d), inCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      cells.push({ date: d, dateKey: toDateKey(d), inCurrentMonth: true });
    }

    // Trailing days to complete 35 or 42 cells
    const totalCells = cells.length <= 35 ? 35 : 42;
    let nextMonthDay = 1;
    while (cells.length < totalCells) {
      const d = new Date(year, month + 1, nextMonthDay++);
      cells.push({ date: d, dateKey: toDateKey(d), inCurrentMonth: false });
    }

    return cells;
  }, [viewMonth]);

  const selectedDayEvents = eventsByDateKey[selectedDateKey] || [];
  const todayKey = toDateKey(today);

  const prevMonth = () => {
    setViewMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setViewMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const goToday = () => {
    const now = new Date();
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateKey(toDateKey(now));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left 8 cols: Monthly Calendar Grid */}
      <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Calendar Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {viewMonth.getFullYear()} 年 {viewMonth.getMonth() + 1} 月
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">📚 全部課程行事曆</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.type === 'required' ? '【必修】' : '【選修】'} {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={goToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              回到今天
            </button>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition"
                title="上個月"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition"
                title="下個月"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            作業 / 報告
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            考試 / 測驗
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            小組討論
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            課程 / 講座
          </span>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 text-center text-xs font-semibold text-slate-500">
          {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
            <div key={d} className="py-2.5">
              週{d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
          {calendarDays.map((cell) => {
            const dayEvents = eventsByDateKey[cell.dateKey] || [];
            const isToday = cell.dateKey === todayKey;
            const isSelected = cell.dateKey === selectedDateKey;

            return (
              <button
                key={cell.dateKey}
                type="button"
                onClick={() => setSelectedDateKey(cell.dateKey)}
                className={`min-h-[92px] sm:min-h-[112px] p-1.5 sm:p-2 text-left flex flex-col justify-between transition focus:outline-none ${
                  !cell.inCurrentMonth
                    ? 'bg-slate-50/60 text-slate-400'
                    : 'bg-white text-slate-800 hover:bg-indigo-50/40'
                } ${isSelected ? 'ring-2 ring-inset ring-indigo-600 bg-indigo-50/30' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : isSelected
                        ? 'text-indigo-700'
                        : ''
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event pills preview */}
                <div className="space-y-1 mt-1 w-full overflow-hidden">
                  {dayEvents.slice(0, 3).map((e) => {
                    const cat = CATEGORY_META[e.category];
                    const isDone = progressMap[e.id]?.status === 'done';
                    return (
                      <div
                        key={e.id}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium truncate ${
                          isDone
                            ? 'bg-slate-100 text-slate-400 line-through'
                            : cat.badgeClass
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${cat.dotClass}`}
                        />
                        <span className="truncate">{e.title}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-slate-400 font-medium pl-1">
                      +{dayEvents.length - 3} 項更多...
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right 4 cols: Selected Date Agenda & Quick Action */}
      <div className="xl:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                當日行程與死線明細
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {selectedDateKey}
              </h3>
            </div>

            <button
              onClick={() => onOpenNewEventOnDate(selectedDateKey)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              在此日新增
            </button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <CalendarIcon className="w-9 h-9 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-600">
                這一天目前沒有安排課程、作業或討論
              </p>
              <p className="text-xs text-slate-400">
                點擊右上角「在此日新增」可快速排入行程
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map((evt) => {
                const course = courseById[evt.course_id];
                const colorStyle = COURSE_COLOR_MAP[course?.color || 'indigo'];
                const catMeta = CATEGORY_META[evt.category];
                const myStatus = progressMap[evt.id]?.status || 'todo';

                return (
                  <div
                    key={evt.id}
                    className={`rounded-xl border border-slate-200 border-l-4 ${catMeta.borderClass} p-3.5 space-y-2.5 bg-slate-50/40`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {course && (
                          <>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${colorStyle.pill}`}
                            >
                              {course.name}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                course.type === 'required'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {course.type === 'required' ? '必修' : '選修'}
                            </span>
                          </>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${catMeta.badgeClass}`}
                        >
                          {catMeta.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const vis =
                            evt.visibility ||
                            (evt.is_shared
                              ? evt.group_name
                                ? 'group'
                                : 'public'
                              : 'private');
                          if (vis === 'group') {
                            return (
                              <span
                                title={`僅【${evt.group_name || '小組'}】組員可見`}
                                className="inline-flex items-center gap-1 text-[11px] text-violet-800 font-bold bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200"
                              >
                                <Users className="w-3 h-3 text-violet-600" />
                                {evt.group_name || '小組限定'}
                              </span>
                            );
                          }
                          if (vis === 'public') {
                            return (
                              <span className="inline-flex items-center gap-1 text-[11px] text-sky-700 font-medium">
                                <Globe2 className="w-3 h-3" />
                                公版
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-semibold">
                              <Lock className="w-3 h-3" />
                              私密
                            </span>
                          );
                        })()}
                        <button
                          onClick={() => onEditEvent(evt)}
                          title="編輯此事項"
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`確定要刪除「${evt.title}」嗎？`)) {
                              onDeleteEvent(evt.id);
                            }
                          }}
                          title="刪除此事項"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4
                      className={`text-sm font-bold ${
                        myStatus === 'done'
                          ? 'line-through text-slate-400'
                          : 'text-slate-900'
                      }`}
                    >
                      {evt.title}
                    </h4>

                    {evt.description && (
                      <p className="text-xs text-slate-600">{evt.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {formatDateTimeTW(evt.due_at)}
                      </span>
                      {evt.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {evt.location}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {(['todo', 'in_progress', 'done'] as ProgressStatus[]).map(
                          (st) => (
                            <button
                              key={st}
                              onClick={() => onUpdateStatus(evt.id, st)}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                                myStatus === st
                                  ? STATUS_META[st].activeClass
                                  : 'bg-white border border-slate-200 text-slate-600'
                              }`}
                            >
                              {STATUS_META[st].label}
                            </button>
                          )
                        )}
                      </div>

                      <button
                        onClick={() => onOpenQuickNote(evt)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        私密筆記
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
