'use client';

import React, { useMemo, useState } from 'react';
import {
  AcademicEvent,
  Course,
  PersonalNote,
  UserProfile,
} from '@/types/pmba';
import { COURSE_COLOR_MAP, formatDateTimeTW } from '@/lib/uiHelpers';
import {
  BookOpen,
  Calendar,
  Edit3,
  FileText,
  Lock,
  Pin,
  Plus,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
} from 'lucide-react';

interface NotesVaultProps {
  notes: PersonalNote[];
  courses: Course[];
  events: AcademicEvent[];
  currentUser: UserProfile;
  onSaveNote: (noteData: {
    id?: string;
    title: string;
    content: string;
    course_id: string | null;
    event_id: string | null;
    tags: string[];
    is_pinned: boolean;
  }) => void;
  onDeleteNote: (noteId: string) => void;
  onTogglePinNote: (noteId: string) => void;
  initialEventForNewNote?: AcademicEvent | null;
  onClearInitialEvent?: () => void;
}

export default function NotesVault({
  notes,
  courses,
  events,
  currentUser,
  onSaveNote,
  onDeleteNote,
  onTogglePinNote,
  initialEventForNewNote,
  onClearInitialEvent,
}: NotesVaultProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(
    Boolean(initialEventForNewNote)
  );
  const [editingNoteId, setEditingNoteId] = useState<string | undefined>(
    undefined
  );
  const [title, setTitle] = useState<string>(
    initialEventForNewNote
      ? `【筆記】${initialEventForNewNote.title}`
      : ''
  );
  const [content, setContent] = useState<string>('');
  const [courseId, setCourseId] = useState<string>(
    initialEventForNewNote?.course_id || courses[0]?.id || ''
  );
  const [eventId, setEventId] = useState<string>(
    initialEventForNewNote?.id || ''
  );
  const [tagsInput, setTagsInput] = useState<string>('課堂筆記, 個案重點');
  const [isPinned, setIsPinned] = useState<boolean>(true);

  React.useEffect(() => {
    if (initialEventForNewNote) {
      setEditingNoteId(undefined);
      setTitle(`【筆記】${initialEventForNewNote.title}`);
      setContent('');
      setCourseId(initialEventForNewNote.course_id || '');
      setEventId(initialEventForNewNote.id || '');
      setTagsInput('個案分析, 重點整理');
      setIsPinned(true);
      setIsEditorOpen(true);
      onClearInitialEvent?.();
    }
  }, [initialEventForNewNote, onClearInitialEvent]);

  const courseById = useMemo(() => {
    const map: Record<string, Course> = {};
    courses.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [courses]);

  const eventById = useMemo(() => {
    const map: Record<string, AcademicEvent> = {};
    events.forEach((e) => {
      map[e.id] = e;
    });
    return map;
  }, [events]);

  const myFilteredNotes = useMemo(() => {
    return notes
      .filter((n) => n.user_id === currentUser.id)
      .filter((n) => {
        if (selectedCourseId !== 'all' && n.course_id !== selectedCourseId) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          const matchTags = n.tags.some((t) => t.toLowerCase().includes(q));
          return matchTitle || matchContent || matchTags;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });
  }, [notes, currentUser.id, selectedCourseId, searchQuery]);

  const openNewNote = () => {
    setEditingNoteId(undefined);
    setTitle('');
    setContent('');
    setCourseId(courses[0]?.id || '');
    setEventId('');
    setTagsInput('課堂筆記');
    setIsPinned(false);
    setIsEditorOpen(true);
  };

  const openEditNote = (note: PersonalNote) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setCourseId(note.course_id || '');
    setEventId(note.event_id || '');
    setTagsInput(note.tags.join(', '));
    setIsPinned(note.is_pinned);
    setIsEditorOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    onSaveNote({
      id: editingNoteId,
      title: title.trim(),
      content: content.trim(),
      course_id: courseId || null,
      event_id: eventId || null,
      tags,
      is_pinned: isPinned,
    });
    setIsEditorOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            個人私密保險箱 (Row-Level Security 隔離保護)
          </div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            {currentUser.name} 的專屬課堂與個案記事本
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            這裡的所有筆記僅綁定你的個人帳號，即使把網站分享給全班同學，任何人都無法看到你的私人筆記。
          </p>
        </div>

        <button
          onClick={openNewNote}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          新增私密筆記
        </button>
      </div>

      {/* Search & Course Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋我的筆記標題、內容或標籤（例如：WACC、台積電、期中考）..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">所有課程筆記</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {/* Inline Editor Modal / Drawer */}
      {isEditorOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border-2 border-indigo-500/80 shadow-lg p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                {editingNoteId ? '編輯我的私密筆記' : '建立新的私密筆記'}
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <Lock className="w-3 h-3" />
              僅 {currentUser.name} 可見
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                所屬課程
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- 不指定課程 --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                關聯作業 / 考試 / 討論（選填）
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- 不綁定特定事項 --</option>
                {events
                  .filter((ev) => !courseId || ev.course_id === courseId)
                  .map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              筆記標題 *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：策略管理個案五力分析、財管期中考公式整理..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              筆記內容
            </label>
            <textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="輸入課堂重點、個案心得、小組討論待辦或考試公式..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                標籤（以逗號分隔）
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="個案分析, 期中考重點, 職場應用"
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer mt-2 sm:mt-5">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              釘選在筆記最上方
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
            >
              儲存私密筆記
            </button>
          </div>
        </form>
      )}

      {/* Notes Cards Grid */}
      {myFilteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-700 font-semibold">
            目前在「{currentUser.name}」帳號下沒有符合的私密筆記
          </p>
          <p className="text-xs text-slate-400">
            點擊右上角「新增私密筆記」記錄你的課堂重點或個案分析想法
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myFilteredNotes.map((note) => {
            const course = note.course_id ? courseById[note.course_id] : null;
            const linkedEvent = note.event_id ? eventById[note.event_id] : null;
            const colorStyle = COURSE_COLOR_MAP[course?.color || 'indigo'];

            return (
              <div
                key={note.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Meta Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {course && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${colorStyle.pill}`}
                        >
                          <BookOpen className="w-3 h-3" />
                          {course.name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
                        <Lock className="w-3 h-3 text-indigo-600" />
                        私密筆記
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onTogglePinNote(note.id)}
                        title={note.is_pinned ? '取消釘選' : '釘選筆記'}
                        className={`p-1.5 rounded-lg border transition ${
                          note.is_pinned
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                            : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditNote(note)}
                        title="編輯筆記"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        title="刪除筆記"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {note.title}
                  </h3>

                  {/* Linked Event Banner */}
                  {linkedEvent && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-800 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">
                        關聯事項：{linkedEvent.title}
                      </span>
                    </div>
                  )}

                  {/* Content body */}
                  <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
                    {note.content}
                  </div>
                </div>

                {/* Footer Tags & Updated Time */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    更新於 {formatDateTimeTW(note.updated_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
