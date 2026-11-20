'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AcademicEvent, Course } from '@/types/pmba';
import {
  extractCoursesAndEventsFromSchedule,
  getAvailableCoursesForFilter,
  PROGRAM_OPTIONS,
  ProgramClassOption,
} from '@/lib/scheduleImporter';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  GraduationCap,
  Layers,
  MapPin,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

interface ImportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  onConfirmImport: (
    importedCourses: Course[],
    importedEvents: AcademicEvent[]
  ) => void;
}

export default function ImportScheduleModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  onConfirmImport,
}: ImportScheduleModalProps) {
  const [selectedProgram, setSelectedProgram] =
    useState<ProgramClassOption>('PMBA_A');
  const [selectedGrade, setSelectedGrade] = useState<'115' | '114'>('115');
  const [selectedSemester, setSelectedSemester] = useState<
    '1151' | '1150' | '1152'
  >('1151');
  const [campusFilter, setCampusFilter] = useState<'all' | 'taipei' | 'zhubei'>(
    'all'
  );

  // Available courses in the chosen program/grade/semester/campus
  const availableOptions = useMemo(() => {
    return getAvailableCoursesForFilter({
      selectedGrade,
      selectedSemester,
      campusFilter,
      programFilter: selectedProgram,
    });
  }, [selectedGrade, selectedSemester, campusFilter, selectedProgram]);

  // Selected course names for import
  const [selectedCourseNames, setSelectedCourseNames] = useState<string[]>([]);
  const [includeHolidays, setIncludeHolidays] = useState<boolean>(true);

  // Whenever the program or semester changes, auto-select all courses matching that program
  useEffect(() => {
    setSelectedCourseNames(availableOptions.courses.map((c) => c.name));
  }, [availableOptions]);

  const toggleCourse = (courseName: string) => {
    setSelectedCourseNames((prev) =>
      prev.includes(courseName)
        ? prev.filter((name) => name !== courseName)
        : [...prev, courseName]
    );
  };

  const selectAllCourses = () => {
    setSelectedCourseNames(availableOptions.courses.map((c) => c.name));
  };

  const deselectAllCourses = () => {
    setSelectedCourseNames([]);
  };

  // Extract events and courses based on selections
  const previewData = useMemo(() => {
    return extractCoursesAndEventsFromSchedule({
      selectedGrade,
      selectedSemester,
      campusFilter,
      programFilter: selectedProgram,
      selectedCourseNames,
      includeHolidays,
      currentUserId,
      currentUserName,
    });
  }, [
    selectedGrade,
    selectedSemester,
    campusFilter,
    selectedProgram,
    selectedCourseNames,
    includeHolidays,
    currentUserId,
    currentUserName,
  ]);

  if (!isOpen) return null;

  const handleImport = () => {
    onConfirmImport(previewData.newCourses, previewData.newEvents);
    onClose();
  };

  const currentProgramLabel =
    PROGRAM_OPTIONS.find((p) => p.value === selectedProgram)?.shortLabel ||
    '全部學程';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                匯入台大 PMBA 官方課表
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  支援 Program 與課堂自選
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                可依 PMBA / PMLBA / PMBM 及 A/B 班自選修讀課表
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 space-y-3.5">
          {/* Main 4-column filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Program & Section Selector (Prominent!) */}
            <div className="sm:col-span-2 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/80">
              <label className="block text-xs font-bold text-indigo-950 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Program & Section（學程與班別） *
              </label>
              <select
                value={selectedProgram}
                onChange={(e) =>
                  setSelectedProgram(e.target.value as ProgramClassOption)
                }
                className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                {PROGRAM_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Grade */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                年級班別
              </label>
              <select
                value={selectedGrade}
                onChange={(e) =>
                  setSelectedGrade(e.target.value as '115' | '114')
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="115">台大 PMBA 115 級</option>
                <option value="114">台大 PMBA 114 級</option>
              </select>
            </div>

            {/* 3. Semester */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                學期別
              </label>
              <select
                value={selectedSemester}
                onChange={(e) =>
                  setSelectedSemester(
                    e.target.value as '1151' | '1150' | '1152'
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1151">115-1 當前學期 (秋季班)</option>
                <option value="1150">115-0 暑期先修模組</option>
                <option value="1152">115-2 下學期 (春季班)</option>
              </select>
            </div>
          </div>

          {/* Interactive Course Selection Section */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  【{currentProgramLabel}】適用之課程科目：
                </span>
                <span className="text-[11px] text-slate-500">
                  (已依學程過濾，可再手動加退選)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllCourses}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  全選
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAllCourses}
                  className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
                >
                  全不選
                </button>
              </div>
            </div>

            {/* Course Checkbox Badges Grid */}
            {availableOptions.courses.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                此學程或此學期條件下無排定課程
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableOptions.courses.map((course) => {
                  const isChecked = selectedCourseNames.includes(course.name);
                  return (
                    <button
                      key={course.name}
                      type="button"
                      onClick={() => toggleCourse(course.name)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-xs block truncate">
                            {course.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {course.teacher}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-white border border-slate-200 text-slate-600 shrink-0">
                        {course.classCount} 堂
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Holiday Toggle Option */}
            {availableOptions.holidayCount > 0 && (
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={includeHolidays}
                  onChange={(e) => setIncludeHolidays(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                同步匯入放假與連假停課標記（光復節、選舉、元旦等共{' '}
                {availableOptions.holidayCount} 天）
              </label>
            )}
          </div>

          {/* Counts & External Link Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 font-medium">
              目前將匯入：
              <strong className="text-indigo-600 font-bold ml-1">
                {previewData.newCourses.length} 門課程
              </strong>
              ，共
              <strong className="text-indigo-600 font-bold ml-1">
                {previewData.newEvents.length} 堂時程
              </strong>
            </span>

            <a
              href="https://ntu-pmba-schedule.vercel.app/?openExternalBrowser=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              前往台大 PMBA 課表原始網址
            </a>
          </div>
        </div>

        {/* Live Preview List */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-2">
          <span className="text-xs font-bold text-slate-700 block mb-1">
            排程預覽（只包含【{currentProgramLabel}】及已勾選的課程時程）：
          </span>

          {previewData.newEvents.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              目前尚未勾選任何課程，請在上方勾選欲匯入的課程科目
            </div>
          ) : (
            <div className="space-y-2">
              {previewData.newEvents.slice(0, 15).map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      {evt.title}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {evt.location}
                      </span>
                      <span>•</span>
                      <span>{evt.description}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">
                    {new Date(evt.due_at).toLocaleDateString('zh-TW', {
                      month: 'numeric',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </span>
                </div>
              ))}
              {previewData.newEvents.length > 15 && (
                <div className="text-center text-xs text-slate-400 pt-1">
                  ...以及其他 {previewData.newEvents.length - 15} 堂課堂時程
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 hidden sm:block">
            匯入後會保留在你的帳號中，隨時可手動刪除或新增作業/考試死線
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={previewData.newEvents.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              確認匯入【{currentProgramLabel}】({previewData.newEvents.length} 堂)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
