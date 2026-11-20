'use client';

import React, { useState } from 'react';
import {
  AcademicEvent,
  Course,
  CourseColor,
  CourseType,
  PersonalNote,
} from '@/types/pmba';
import { COURSE_COLOR_MAP } from '@/lib/uiHelpers';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Globe2,
  GraduationCap,
  Lock,
  MapPin,
  Plus,
  Trash2,
  User,
  Users,
} from 'lucide-react';

interface CourseManagerProps {
  courses: Course[];
  events: AcademicEvent[];
  notes: PersonalNote[];
  currentUserId: string;
  enrolledCourseIds: string[];
  enrollmentCounts: Record<string, number>;
  onToggleEnrollCourse: (courseId: string) => void;
  onAddCourse: (course: {
    name: string;
    code: string;
    type: CourseType;
    professor: string;
    term_info?: string;
    color: CourseColor;
    is_shared: boolean;
  }) => void;
  onUpdateCourse?: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onOpenNewEventForCourse: (courseId: string) => void;
  onOpenImportModal: () => void;
}

const COLOR_OPTIONS: { value: CourseColor; label: string; dot: string }[] = [
  { value: 'indigo', label: '靛藍', dot: 'bg-indigo-600' },
  { value: 'emerald', label: '翠綠', dot: 'bg-emerald-600' },
  { value: 'amber', label: '琥珀', dot: 'bg-amber-500' },
  { value: 'rose', label: '玫紅', dot: 'bg-rose-600' },
  { value: 'sky', label: '天藍', dot: 'bg-sky-600' },
  { value: 'violet', label: '紫羅蘭', dot: 'bg-violet-600' },
];

export default function CourseManager({
  courses,
  events,
  notes,
  currentUserId,
  enrolledCourseIds,
  enrollmentCounts,
  onToggleEnrollCourse,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onOpenNewEventForCourse,
  onOpenImportModal,
}: CourseManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('PMBA-710');
  const [courseType, setCourseType] = useState<CourseType>('elective');
  const [professor, setProfessor] = useState('');
  const [termInfo, setTermInfo] = useState('');
  const [color, setColor] = useState<CourseColor>('indigo');
  const [isShared, setIsShared] = useState(true);

  const handleStartEditCourse = (c: Course) => {
    setEditingCourse(c);
    setName(c.name);
    setCode(c.code);
    setCourseType(c.type);
    setProfessor(c.professor || '');
    setTermInfo(c.term_info || '');
    setColor(c.color || 'indigo');
    setIsShared(c.is_shared);
    setShowAddForm(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCourse && onUpdateCourse) {
      onUpdateCourse({
        ...editingCourse,
        name: name.trim(),
        code: code.trim() || 'PMBA',
        type: courseType,
        professor: professor.trim(),
        term_info: termInfo.trim(),
        color,
        is_shared: isShared,
      });
      setEditingCourse(null);
    } else {
      onAddCourse({
        name: name.trim(),
        code: code.trim() || 'PMBA',
        type: courseType,
        professor: professor.trim(),
        term_info: termInfo.trim(),
        color,
        is_shared: isShared,
      });
    }

    setName('');
    setProfessor('');
    setTermInfo('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              PMBA 修課科目與課程庫
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            PMBA 每週教室與時間皆不同，每次上課教室直接記錄於行事曆課堂中，或點擊右側一鍵匯入官方課表。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs sm:text-sm font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            一鍵匯入台大 PMBA 課表
          </button>

          <button
            onClick={() => {
              setEditingCourse(null);
              setName('');
              setCode('PMBA-710');
              setCourseType('elective');
              setProfessor('');
              setTermInfo('');
              setColor('indigo');
              setIsShared(true);
              setShowAddForm((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            自訂新課程
          </button>
        </div>
      </div>

      {/* Add Course Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border-2 border-indigo-500/80 shadow-md p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-base font-bold text-slate-900">
              {editingCourse ? '編輯 PMBA 課程科目' : '新增 PMBA 課程科目'}
            </h3>
            <span className="text-xs text-slate-400">
              💡 確切上課時間與教室直接記錄於每次課堂事項中
            </span>
          </div>

          {/* Course Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              課程性質（決定權限與可見度） *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCourseType('required')}
                className={`p-3 rounded-xl border text-left transition ${
                  courseType === 'required'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    全班必修課程 (Core)
                  </span>
                  {courseType === 'required' && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  全班同學皆須修讀，課程作業、考試與倒數會<strong>自動同步出現在全班所有同學的看板</strong>。
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCourseType('elective')}
                className={`p-3 rounded-xl border text-left transition ${
                  courseType === 'elective'
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    自由選修課程 (Elective)
                  </span>
                  {courseType === 'elective' && (
                    <Check className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  採修課名單制。<strong>有選這門課的同學點擊「加入」才會看到該課時程</strong>，沒修課的人不會被洗版。
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                課程名稱 *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：策略管理與競爭優勢、商業數據分析..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                課程代號
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PMBA-710"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                授課教授
              </label>
              <input
                type="text"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="例如：陳教授 / 吳教授"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                授課學期 / 備註說明（選填）
              </label>
              <input
                type="text"
                value={termInfo}
                onChange={(e) => setTermInfo(e.target.value)}
                placeholder="例如：115-1 週末模組排課、隔週六全天..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                代表色：
              </span>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    color === c.value
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                  {c.label}
                </button>
              ))}
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              設為「班級公版課程」（同學能在課程庫看到並選修）
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingCourse(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
            >
              {editingCourse ? '儲存課程修改' : '建立課程'}
            </button>
          </div>
        </form>
      )}

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => {
          const style = COURSE_COLOR_MAP[course.color || 'indigo'];
          const courseEvents = events.filter((e) => e.course_id === course.id);
          const classSessionsCount = courseEvents.filter(
            (e) => e.category === 'class'
          ).length;
          const assignmentCount = courseEvents.filter(
            (e) => e.category === 'assignment'
          ).length;
          const examCount = courseEvents.filter(
            (e) => e.category === 'exam'
          ).length;
          const discussionCount = courseEvents.filter(
            (e) => e.category === 'discussion'
          ).length;
          const myCourseNotesCount = notes.filter(
            (n) => n.user_id === currentUserId && n.course_id === course.id
          ).length;

          const isRequired = course.type === 'required';
          const isEnrolled = isRequired || enrolledCourseIds.includes(course.id);
          const studentCount = isRequired
            ? '全班同學'
            : `${enrollmentCounts[course.id] || 0} 位同學修讀`;

          return (
            <div
              key={course.id}
              className={`bg-white rounded-2xl border transition overflow-hidden flex flex-col justify-between ${
                isEnrolled
                  ? 'border-slate-200 shadow-sm hover:shadow-md'
                  : 'border-dashed border-slate-300 bg-slate-50/40 opacity-80'
              }`}
            >
              <div className={`h-2.5 ${style.solid}`} />
              <div className="p-5 space-y-4">
                {/* Badges & Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-bold ${style.pill}`}
                      >
                        {course.code}
                      </span>

                      {/* Course Type Badge */}
                      {isRequired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />
                          全班必修
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <Users className="w-3.5 h-3.5 text-amber-700" />
                          自由選修
                        </span>
                      )}

                      {course.is_shared ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                          <Globe2 className="w-3 h-3" />
                          班級公版
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-white">
                          <Lock className="w-3 h-3" />
                          個人私密
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                      {course.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEditCourse(course)}
                      title="編輯此課程"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `確定要刪除課程「${course.name}」嗎？相關時程仍會保留或需要手動調整。`
                          )
                        ) {
                          onDeleteCourse(course.id);
                        }
                      }}
                      title="刪除此課程"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Course Metadata (Flexible without fixed room/time) */}
                <div className="space-y-1 text-xs text-slate-600">
                  {course.professor && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>授課教授：{course.professor}</span>
                    </div>
                  )}
                  {course.term_info && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>學期 / 備註：{course.term_info}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-indigo-700 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      已排入 {classSessionsCount} 堂課（每次教室依行事曆公告）
                    </span>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-2 text-center">
                    <div className="text-sm font-extrabold text-sky-800">
                      {classSessionsCount}
                    </div>
                    <div className="text-[11px] text-sky-700 font-medium">
                      上課堂次
                    </div>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2 text-center">
                    <div className="text-sm font-extrabold text-amber-800">
                      {assignmentCount}
                    </div>
                    <div className="text-[11px] text-amber-700 font-medium">
                      作業報告
                    </div>
                  </div>
                  <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2 text-center">
                    <div className="text-sm font-extrabold text-rose-800">
                      {examCount}
                    </div>
                    <div className="text-[11px] text-rose-700 font-medium">
                      考試測驗
                    </div>
                  </div>
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2 text-center">
                    <div className="text-sm font-extrabold text-indigo-800">
                      {myCourseNotesCount}
                    </div>
                    <div className="text-[11px] text-indigo-700 font-medium">
                      我的筆記
                    </div>
                  </div>
                </div>

                {/* Enrollment Control Strip (for electives vs required) */}
                <div className="pt-2 border-t border-slate-100">
                  {isRequired ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 text-indigo-900 border border-indigo-100">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        全班必修科目（自動同步至你的倒數與行事曆）
                      </div>
                      <span className="text-[11px] text-indigo-600 font-medium">
                        全班修讀
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">
                          修課名單制：
                        </span>
                        <span className="ml-1 text-slate-500">
                          {studentCount}
                        </span>
                      </div>

                      <button
                        onClick={() => onToggleEnrollCourse(course.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                          isEnrolled
                            ? 'bg-emerald-600 hover:bg-rose-600 text-white group'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isEnrolled ? (
                          <>
                            <Check className="w-3.5 h-3.5 group-hover:hidden" />
                            <span className="group-hover:hidden">已選修此課</span>
                            <span className="hidden group-hover:inline">
                              退選此課
                            </span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            加入我的選修
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom strip */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  共 {courseEvents.length} 項時程
                </span>
                <button
                  onClick={() => onOpenNewEventForCourse(course.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增此課作業/考試/課堂
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
