'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AcademicEvent, Course, EventCategory, EventVisibility } from '@/types/pmba';
import { Calendar, Edit3, Globe2, KeyRound, Lock, Users, X } from 'lucide-react';

interface NewEventModalProps {
  isOpen: boolean;
  courses: Course[];
  defaultCourseId?: string;
  defaultDatePrefix?: string; // YYYY-MM-DD
  defaultGroupName?: string; // e.g. '第 3 組'
  courseGroups?: Record<string, string>; // per-course group assignments
  editingEvent?: AcademicEvent | null;
  onClose: () => void;
  onAddEvent: (data: {
    course_id: string;
    title: string;
    category: EventCategory;
    due_at: string;
    location: string;
    description: string;
    is_shared: boolean;
    visibility: EventVisibility;
    group_name?: string | null;
    group_passcode?: string | null;
    is_pinned_countdown: boolean;
  }) => void;
  onUpdateEvent?: (updated: AcademicEvent) => void;
}

function toDatetimeLocalString(isoOrDateStr?: string): string {
  if (!isoOrDateStr) return '';
  const d = new Date(isoOrDateStr);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function NewEventModal({
  isOpen,
  courses,
  defaultCourseId,
  defaultDatePrefix,
  defaultGroupName = '第 3 組',
  courseGroups = {},
  editingEvent,
  onClose,
  onAddEvent,
  onUpdateEvent,
}: NewEventModalProps) {
  const isEditing = Boolean(editingEvent);

  const defaultDateStr = useMemo(() => {
    if (defaultDatePrefix) return `${defaultDatePrefix}T23:59`;
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T23:59`;
  }, [defaultDatePrefix]);

  const [courseId, setCourseId] = useState<string>(
    defaultCourseId || courses[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('assignment');
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [groupName, setGroupName] = useState<string>(defaultGroupName);
  const [groupPasscode, setGroupPasscode] = useState<string>('');
  const [dueAtLocal, setDueAtLocal] = useState<string>(defaultDateStr);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isPinnedCountdown, setIsPinnedCountdown] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    if (editingEvent) {
      const selectedCId = editingEvent.course_id || courses[0]?.id || '';
      setCourseId(selectedCId);
      setTitle(editingEvent.title || '');
      setCategory(editingEvent.category || 'assignment');
      const vis: EventVisibility =
        editingEvent.visibility ||
        (editingEvent.is_shared
          ? editingEvent.group_name
            ? 'group'
            : 'public'
          : 'private');
      setVisibility(vis);
      setGroupName(
        editingEvent.group_name ||
          courseGroups[selectedCId] ||
          defaultGroupName
      );
      setGroupPasscode(editingEvent.group_passcode || '');
      setDueAtLocal(toDatetimeLocalString(editingEvent.due_at) || defaultDateStr);
      setLocation(editingEvent.location || '');
      setDescription(editingEvent.description || '');
      setIsPinnedCountdown(editingEvent.is_pinned_countdown);
    } else {
      const selectedCId = defaultCourseId || courses[0]?.id || '';
      setCourseId(selectedCId);
      setTitle('');
      setCategory('assignment');
      setVisibility('public');
      setGroupName(courseGroups[selectedCId] || defaultGroupName);
      setGroupPasscode('');
      setDueAtLocal(defaultDateStr);
      setLocation('');
      setDescription('');
      setIsPinnedCountdown(true);
    }
  }, [
    editingEvent,
    isOpen,
    defaultCourseId,
    defaultDateStr,
    defaultGroupName,
    courseGroups,
    courses,
  ]);

  const handleCourseChange = (newCourseId: string) => {
    setCourseId(newCourseId);
    if (!isEditing || !editingEvent?.group_name) {
      const autoGroup = courseGroups[newCourseId] || defaultGroupName;
      setGroupName(autoGroup);
    }
  };

  if (!isOpen) return null;

  const handleSelectCategory = (cat: EventCategory) => {
    setCategory(cat);
    // If user picks "discussion" (小組討論), auto-select "group" visibility as smart default
    if (cat === 'discussion' && visibility === 'public') {
      setVisibility('group');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const parsedDate = new Date(dueAtLocal);
    const iso = Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();

    const isShared = visibility !== 'private';
    const finalGroupName = visibility === 'group' ? groupName.trim() || '我的小組' : null;
    const finalGroupPasscode =
      visibility === 'group' && groupPasscode.trim() ? groupPasscode.trim() : null;

    if (isEditing && editingEvent && onUpdateEvent) {
      onUpdateEvent({
        ...editingEvent,
        course_id: courseId || courses[0]?.id || '',
        title: title.trim(),
        category,
        due_at: iso,
        location: location.trim(),
        description: description.trim(),
        is_shared: isShared,
        visibility,
        group_name: finalGroupName,
        group_passcode: finalGroupPasscode,
        is_pinned_countdown: isPinnedCountdown,
      });
    } else {
      onAddEvent({
        course_id: courseId || courses[0]?.id || '',
        title: title.trim(),
        category,
        due_at: iso,
        location: location.trim(),
        description: description.trim(),
        is_shared: isShared,
        visibility,
        group_name: finalGroupName,
        group_passcode: finalGroupPasscode,
        is_pinned_countdown: isPinnedCountdown,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Edit3 className="w-5 h-5 text-indigo-600" />
            ) : (
              <Calendar className="w-5 h-5 text-indigo-600" />
            )}
            <h3 className="text-base font-bold text-slate-900">
              {isEditing
                ? '編輯 PMBA 課程時程 / 事項'
                : '新增 PMBA 課程時程 / 作業 / 考試 / 討論'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              事項類型 *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { key: 'assignment', label: '作業 / 報告' },
                  { key: 'exam', label: '考試 / 測驗' },
                  { key: 'discussion', label: '小組討論' },
                  { key: 'class', label: '課程 / 專題' },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelectCategory(item.key)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                    category === item.key
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Scope: Public vs Group-Only vs Private */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              誰看得到這筆時程？（可見權限範圍） *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Class Public */}
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  visibility === 'public'
                    ? 'border-sky-600 bg-sky-50/70 ring-1 ring-sky-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Globe2 className="w-4 h-4 text-sky-600" />
                  班級公版
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  全班同學皆可見（如全班共同上課、大考或個人作業繳交死線）
                </p>
              </button>

              {/* Option 2: Group Only */}
              <button
                type="button"
                onClick={() => setVisibility('group')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  visibility === 'group'
                    ? 'border-violet-600 bg-violet-50/80 ring-2 ring-violet-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-950">
                  <Users className="w-4 h-4 text-violet-600" />
                  小組限定
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  <strong>僅同組同學可見</strong>，其他組看不到（適合必修分組討論）
                </p>
              </button>

              {/* Option 3: Private */}
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  visibility === 'private'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Lock className="w-4 h-4 text-amber-400" />
                  個人私密
                </div>
                <p
                  className={`text-[11px] mt-1 leading-snug ${
                    visibility === 'private' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  只有自己帳號看得到，適合個人私人讀書計畫
                </p>
              </button>
            </div>

            {/* If Group Only: configure group name and optional passcode */}
            {visibility === 'group' && (
              <div className="mt-2.5 p-3 rounded-xl bg-violet-50/80 border border-violet-200 space-y-2 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900">
                    <Users className="w-4 h-4 text-violet-600" />
                    <span>指定限定共享的小組名稱：</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="例如：第 3 組"
                      className="text-xs px-3 py-1.5 rounded-lg border border-violet-300 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <span className="text-[11px] text-violet-700 font-medium">
                      {courseGroups[courseId]
                        ? `(已對應此課：${courseGroups[courseId]})`
                        : '(僅同組可見)'}
                    </span>
                  </div>
                </div>

                {/* Optional Group Passcode to prevent snooping */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-violet-200/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>小組防窺通關碼（選填）：</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={groupPasscode}
                      onChange={(e) => setGroupPasscode(e.target.value)}
                      placeholder="自訂通關暗號 (例: 3388)"
                      className="text-xs px-3 py-1.5 rounded-lg border border-violet-300 bg-white text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 w-36"
                    />
                    <span className="text-[10px] text-violet-600">
                      (防止其他同學隨意切換組別偷看)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                所屬課程 *
              </label>
              <select
                value={courseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'required' ? '【必修】' : '【選修】'} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                截止 / 發生日期與時間 *
              </label>
              <input
                type="datetime-local"
                required
                value={dueAtLocal}
                onChange={(e) => setDueAtLocal(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              事項名稱 *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：策略管理第3組第1次線上個案分工討論、哈佛個案分析報告繳交..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              地點 / 繳交方式 / 會議連結
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例如：Google Meet 會議室、Moodle 繳交區、管理學院 302 教室..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              補充說明 / 討論議程與規定
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="輸入討論議題大綱、各組員負責章節，或報告繳交規定..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isPinnedCountdown}
              onChange={(e) => setIsPinnedCountdown(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            置頂於首頁倒數計時看板
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
            >
              {isEditing ? '儲存修改' : '確認新增時程'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
