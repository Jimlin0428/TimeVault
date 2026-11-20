'use client';

import React, { useEffect, useState } from 'react';
import {
  AcademicEvent,
  Course,
  EventCategory,
  ProgressStatus,
  UserEventProgress,
} from '@/types/pmba';
import {
  CATEGORY_META,
  COURSE_COLOR_MAP,
  formatDateTimeTW,
  getCountdownBreakdown,
  STATUS_META,
} from '@/lib/uiHelpers';
import {
  AlarmClock,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Globe2,
  Lock,
  MapPin,
  Pin,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';

interface CountdownGridProps {
  events: AcademicEvent[];
  courses: Course[];
  progressMap: Record<string, UserEventProgress>;
  currentUserId: string;
  onUpdateStatus: (eventId: string, status: ProgressStatus) => void;
  onUpdateMemo: (eventId: string, memo: string) => void;
  onTogglePinCountdown: (eventId: string) => void;
  onEditEvent: (event: AcademicEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenQuickNote: (event: AcademicEvent) => void;
  onOpenNewEventModal: () => void;
}

export default function CountdownGrid({
  events,
  courses,
  progressMap,
  currentUserId,
  onUpdateStatus,
  onUpdateMemo,
  onTogglePinCountdown,
  onEditEvent,
  onDeleteEvent,
  onOpenQuickNote,
  onOpenNewEventModal,
}: CountdownGridProps) {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all');
  const [hideDone, setHideDone] = useState<boolean>(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const courseById = React.useMemo(() => {
    const map: Record<string, Course> = {};
    courses.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [courses]);

  const courseOptions = React.useMemo(() => {
    return courses.map((c) => {
      const courseEvents = events.filter((e) => e.course_id === c.id);
      const pendingCount = courseEvents.filter(
        (e) => (progressMap[e.id]?.status || 'todo') !== 'done'
      ).length;
      return {
        ...c,
        totalCount: courseEvents.length,
        pendingCount,
      };
    });
  }, [courses, events, progressMap]);

  const sortedEvents = React.useMemo(() => {
    return [...events]
      .filter((e) => {
        if (selectedCourseId !== 'all' && e.course_id !== selectedCourseId) {
          return false;
        }
        if (categoryFilter !== 'all' && e.category !== categoryFilter) {
          return false;
        }
        const st = progressMap[e.id]?.status || 'todo';
        if (hideDone && st === 'done') return false;
        return true;
      })
      .sort((a, b) => {
        if (a.is_pinned_countdown !== b.is_pinned_countdown) {
          return a.is_pinned_countdown ? -1 : 1;
        }
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      });
  }, [events, selectedCourseId, categoryFilter, hideDone, progressMap]);

  const startEditMemo = (eventId: string) => {
    setEditingMemoId(eventId);
    setMemoDraft(progressMap[eventId]?.personal_memo || '');
  };

  const saveMemo = (eventId: string) => {
    onUpdateMemo(eventId, memoDraft.trim());
    setEditingMemoId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <AlarmClock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              重要時程與即時倒數計時
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            班級公版事項所有人同步看到，但你勾選的「完成進度」與「私密備忘」只有你自己看得到
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewEventModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            新增時程 / 倒數
          </button>
        </div>
      </div>

      {/* Course & Category Filter Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
        {/* Row 1: Course Filter */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                依課程篩選待辦事項
              </span>
              {selectedCourseId !== 'all' && (
                <button
                  onClick={() => setSelectedCourseId('all')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline underline-offset-2 ml-1"
                >
                  清除課程篩選（看全部）
                </button>
              )}
            </div>

            {/* Mobile Dropdown for compact screens */}
            <div className="sm:hidden w-full mt-1">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">📚 全部課程 ({events.length} 項事項)</option>
                {courseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'required' ? '【必修】' : '【選修】'} {c.name} ({c.totalCount} 項{c.pendingCount > 0 ? `，${c.pendingCount} 待辦` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop / Tablet Scrollable Pills */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCourseId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedCourseId === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>全部課程</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCourseId === 'all'
                    ? 'bg-indigo-700 text-white'
                    : 'bg-white text-slate-600'
                }`}
              >
                {events.length}
              </span>
            </button>

            {courseOptions.map((c) => {
              const isSelected = selectedCourseId === c.id;
              const style = COURSE_COLOR_MAP[c.color || 'indigo'];
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-white' : style.solid
                    }`}
                  />
                  <span>{c.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-indigo-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.totalCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Category Filter & Hide Done */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">
              事項類型：
            </span>
            {(
              [
                { key: 'all', label: '全部類型' },
                { key: 'assignment', label: '作業 / 報告' },
                { key: 'exam', label: '考試 / 測驗' },
                { key: 'discussion', label: '小組討論' },
                { key: 'class', label: '課程 / 專題' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCategoryFilter(tab.key)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  categoryFilter === tab.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-600 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 transition">
            <input
              type="checkbox"
              checked={hideDone}
              onChange={(e) => setHideDone(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            隱藏已完成事項
          </label>
        </div>
      </div>

      {/* Cards Grid */}
      {sortedEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-10 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <div>
            <p className="text-slate-800 font-bold text-sm sm:text-base">
              {selectedCourseId !== 'all'
                ? `課程「${courseById[selectedCourseId]?.name || ''}」目前沒有符合條件的倒數事項`
                : '目前沒有符合篩選條件的倒數事項'}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {hideDone
                ? '可能所有事項皆已標記為完成，或此課程尚未建立該類型的事項'
                : '您可以切換上方篩選條件，或點擊下方按鈕'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {selectedCourseId !== 'all' && (
              <button
                onClick={() => setSelectedCourseId('all')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold border border-indigo-200 transition"
              >
                查看全部課程事項
              </button>
            )}
            {categoryFilter !== 'all' && (
              <button
                onClick={() => setCategoryFilter('all')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition"
              >
                查看所有事項類型
              </button>
            )}
            {hideDone && (
              <button
                onClick={() => setHideDone(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition"
              >
                顯示已完成事項
              </button>
            )}
            <button
              onClick={onOpenNewEventModal}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-sm transition"
            >
              + 新增這門課的時程
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedEvents.map((evt) => {
            const course = courseById[evt.course_id];
            const colorStyle = COURSE_COLOR_MAP[course?.color || 'indigo'];
            const catMeta = CATEGORY_META[evt.category];
            const countdown = getCountdownBreakdown(evt.due_at, nowMs);
            const myProg = progressMap[evt.id];
            const myStatus: ProgressStatus = myProg?.status || 'todo';
            const myMemo = myProg?.personal_memo || '';

            const urgencyBanner =
              myStatus === 'done'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : countdown.urgency === 'critical'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : countdown.urgency === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : countdown.urgency === 'expired'
                ? 'bg-slate-100 border-slate-200 text-slate-500'
                : 'bg-indigo-50/70 border-indigo-100 text-indigo-950';

            return (
              <div
                key={evt.id}
                className={`bg-white rounded-2xl border transition shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  myStatus === 'done'
                    ? 'border-emerald-200/80 opacity-90'
                    : countdown.urgency === 'critical'
                    ? 'border-rose-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="p-5 space-y-4">
                  {/* Top Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {course && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedCourseId(course.id)}
                            title={`點擊篩選只看「${course.name}」事項`}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${colorStyle.pill} hover:opacity-80 transition cursor-pointer`}
                          >
                            <BookOpen className="w-3 h-3" />
                            {course.name}
                          </button>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
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
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border ${catMeta.badgeClass}`}
                      >
                        {catMeta.label}
                      </span>
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
                              title={`僅【${evt.group_name || '小組'}】組員看得到，其他組別同學看不到`}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200 shadow-sm"
                            >
                              <Users className="w-3 h-3 text-violet-600" />
                              小組限定 ({evt.group_name || '同組可見'})
                            </span>
                          );
                        }
                        if (vis === 'public') {
                          return (
                            <span
                              title="全班同學皆可看到此公版時程"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200"
                            >
                              <Globe2 className="w-3 h-3" />
                              班級公版
                            </span>
                          );
                        }
                        return (
                          <span
                            title="此為你的私人排程，其他同學看不到"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-800 text-white"
                          >
                            <Lock className="w-3 h-3" />
                            個人私密
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditEvent(evt)}
                        title="編輯此事項"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onTogglePinCountdown(evt.id)}
                        title={evt.is_pinned_countdown ? '取消置頂倒數' : '置頂於倒數首頁'}
                        className={`p-1.5 rounded-lg border transition ${
                          evt.is_pinned_countdown
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                            : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const confirmMsg = evt.is_shared
                            ? `確定要刪除「${evt.title}」嗎？\n（此事項為班級公版事項）`
                            : `確定要刪除「${evt.title}」嗎？`;
                          if (window.confirm(confirmMsg)) {
                            onDeleteEvent(evt.id);
                          }
                        }}
                        title="刪除此事項"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      className={`text-base sm:text-lg font-bold leading-snug ${
                        myStatus === 'done'
                          ? 'line-through text-slate-400'
                          : 'text-slate-900'
                      }`}
                    >
                      {evt.title}
                    </h3>
                    {evt.description && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  {/* Meta Info: Date & Location */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      截止 / 時間：{formatDateTimeTW(evt.due_at)}
                    </span>
                    {evt.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {evt.location}
                      </span>
                    )}
                  </div>

                  {/* Digital Countdown Box */}
                  <div
                    className={`rounded-xl border p-3.5 flex items-center justify-between ${urgencyBanner}`}
                  >
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">
                        {myStatus === 'done'
                          ? '個人進度已達成'
                          : countdown.isExpired
                          ? '時間已過'
                          : countdown.urgency === 'critical'
                          ? '🔥 緊急死線倒數 (< 3天)'
                          : countdown.urgency === 'warning'
                          ? '⚡ 近期死線倒數 (< 7天)'
                          : '距離截止還有'}
                      </span>
                      {countdown.isExpired ? (
                        <span className="text-sm font-bold">
                          已過期 {countdown.days} 天 {countdown.hours} 小時
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-2 mt-1">
                          <div className="text-center">
                            <span className="text-xl sm:text-2xl font-extrabold tabular-nums">
                              {countdown.days}
                            </span>
                            <span className="text-xs ml-0.5 font-medium">天</span>
                          </div>
                          <span className="text-slate-400 font-bold">:</span>
                          <div className="text-center">
                            <span className="text-xl sm:text-2xl font-extrabold tabular-nums">
                              {String(countdown.hours).padStart(2, '0')}
                            </span>
                            <span className="text-xs ml-0.5 font-medium">時</span>
                          </div>
                          <span className="text-slate-400 font-bold">:</span>
                          <div className="text-center">
                            <span className="text-xl sm:text-2xl font-extrabold tabular-nums">
                              {String(countdown.minutes).padStart(2, '0')}
                            </span>
                            <span className="text-xs ml-0.5 font-medium">分</span>
                          </div>
                          <span className="text-slate-400 font-bold">:</span>
                          <div className="text-center">
                            <span className="text-lg sm:text-xl font-bold tabular-nums opacity-80">
                              {String(countdown.seconds).padStart(2, '0')}
                            </span>
                            <span className="text-xs ml-0.5 font-medium">秒</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onOpenQuickNote(evt)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 border border-slate-200/80 text-xs font-semibold shadow-sm transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      寫私密筆記
                    </button>
                  </div>

                  {/* Private Personal Memo Box */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <Lock className="w-3 h-3 text-indigo-600" />
                        我的私密進度備忘（僅自己可見，同學看不到）
                      </span>
                      {editingMemoId !== evt.id && (
                        <button
                          onClick={() => startEditMemo(evt.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          {myMemo ? '編輯備忘' : '+ 新增備忘'}
                        </button>
                      )}
                    </div>

                    {editingMemoId === evt.id ? (
                      <div className="space-y-2 mt-1.5">
                        <textarea
                          rows={2}
                          value={memoDraft}
                          onChange={(e) => setMemoDraft(e.target.value)}
                          placeholder="記錄自己的分工頁數、複習進度或待辦細節（只有你看得到）..."
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingMemoId(null)}
                            className="px-2.5 py-1 rounded-lg text-xs text-slate-600 hover:bg-slate-200"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => saveMemo(evt.id)}
                            className="px-2.5 py-1 rounded-lg text-xs bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                          >
                            儲存私密備忘
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700">
                        {myMemo || (
                          <span className="text-slate-400 italic">
                            尚無個人備忘，點擊右上角可新增自己的進度筆記
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer: Personal Status Switcher */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    我的個人狀態：
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(['todo', 'in_progress', 'done'] as ProgressStatus[]).map((st) => {
                      const active = myStatus === st;
                      return (
                        <button
                          key={st}
                          onClick={() => onUpdateStatus(evt.id, st)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            active
                              ? STATUS_META[st].activeClass
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {STATUS_META[st].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
