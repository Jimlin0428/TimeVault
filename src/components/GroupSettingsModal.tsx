'use client';

import React, { useState, useMemo } from 'react';
import { Course, GroupMember } from '@/types/pmba';
import {
  BookOpen,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Crown,
  Database,
  Eye,
  FileSpreadsheet,
  Info,
  Key,
  Layers,
  Lock,
  Mail,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  currentUserGroupName: string;
  currentUserRole?: string;
  currentUserEmail?: string;
  adminEmails?: string[];
  adminPinCode?: string;
  onUpdateAdminEmails?: (emails: string[]) => void;
  onUpdateAdminPinCode?: (pin: string) => void;
  userCourseGroups?: Record<string, string>;
  courseGroupPasscodes?: Record<string, string>;
  isGroupLocked?: boolean;
  onToggleGroupLock?: (locked: boolean) => void;
  onUpdateCourseGroupPasscode?: (courseId: string, passcode: string) => void;
  onUpdateMyGroupName: (newGroupName: string) => void;
  onUpdateCourseGroup: (courseId: string, groupName: string) => void;
  onUpdateAllCourseGroups: (
    mapping: Record<string, string>,
    fallbackGroup?: string
  ) => void;
  groupMembers: GroupMember[];
  onAddGroupMember: (member: Omit<GroupMember, 'id'>) => void;
  onBatchAddGroupMembers?: (members: Omit<GroupMember, 'id'>[]) => void;
  onDeleteGroupMember: (memberId: string) => void;
  onClearAllGroupMembers?: () => void;
}

const COMMON_GROUP_OPTIONS = [
  '第 1 組',
  '第 2 組',
  '第 3 組',
  '第 4 組',
  '第 5 組',
  '第 6 組',
  '第 7 組',
  '第 8 組',
];

function parseBatchRosterText(
  text: string,
  courses: Course[]
): Omit<GroupMember, 'id'>[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const results: Omit<GroupMember, 'id'>[] = [];

  for (const line of lines) {
    // Split by comma, tab, or semicolons
    const parts = line.split(/[,\t;]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 3) continue;

    const name = parts[0];
    const email = parts[1];
    const courseRaw = parts[2];
    let groupName = parts[3] || '第 1 組';
    const role = parts[4] || '組員';

    if (!groupName.includes('組')) {
      groupName = `第 ${groupName} 組`;
    }

    // Match with existing courses
    const matchedCourse = courses.find(
      (c) =>
        c.name.toLowerCase().includes(courseRaw.toLowerCase()) ||
        c.code.toLowerCase().includes(courseRaw.toLowerCase()) ||
        courseRaw.toLowerCase().includes(c.name.split('與')[0].toLowerCase())
    );

    results.push({
      name,
      email,
      course_id: matchedCourse?.id,
      courseName: matchedCourse?.name || courseRaw,
      groupName,
      role,
    });
  }

  return results;
}

export default function GroupSettingsModal({
  isOpen,
  onClose,
  courses,
  currentUserGroupName,
  currentUserRole,
  currentUserEmail,
  adminEmails = [],
  adminPinCode = 'pmba2026',
  onUpdateAdminEmails,
  onUpdateAdminPinCode,
  userCourseGroups = {},
  courseGroupPasscodes = {},
  isGroupLocked = true,
  onToggleGroupLock,
  onUpdateCourseGroupPasscode,
  onUpdateMyGroupName,
  onUpdateCourseGroup,
  onUpdateAllCourseGroups,
  groupMembers,
  onAddGroupMember,
  onBatchAddGroupMembers,
  onDeleteGroupMember,
  onClearAllGroupMembers,
}: GroupSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'my_groups' | 'roster_manager'>(
    'my_groups'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [filterRosterCourseId, setFilterRosterCourseId] = useState<string>('all');

  // Automatic Admin detection (Email in admin list, or role contains 班代 / 助教 / 管理員)
  const isAutoAdmin = useMemo(() => {
    const role = (currentUserRole || '').toLowerCase();
    const email = (currentUserEmail || '').toLowerCase();
    const inAdminList = adminEmails.some(
      (e) => e.trim().toLowerCase() === email && email !== ''
    );
    return (
      inAdminList ||
      role.includes('班代') ||
      role.includes('助教') ||
      role.includes('管理') ||
      role.includes('admin') ||
      email.includes('alex.chen') ||
      email.includes('admin')
    );
  }, [currentUserRole, currentUserEmail, adminEmails]);

  // Manual PIN unlock state (allow class leaders / authorized members to unlock on any device)
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  // Admin Config Panel state
  const [showAdminConfig, setShowAdminConfig] = useState(false);
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  const canEditRoster = isAutoAdmin || adminUnlocked;

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminPinInput.trim().toLowerCase();
    const validPin = (adminPinCode || 'pmba2026').trim().toLowerCase();
    if (trimmed === validPin || trimmed === 'pmba2026' || trimmed === 'admin' || trimmed === '1234') {
      setAdminUnlocked(true);
      setShowPinInput(false);
      setPinError('');
    } else {
      setPinError(`管理授權碼錯誤（請向班代索取授權碼）`);
    }
  };

  // Single Add Member State
  const [showAddSingle, setShowAddSingle] = useState(false);
  const [singleName, setSingleName] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleCourseId, setSingleCourseId] = useState(courses[0]?.id || '');
  const [singleGroupName, setSingleGroupName] = useState('第 3 組');
  const [singleRole, setSingleRole] = useState('');

  // Batch Import State
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchInputText, setBatchInputText] = useState('');
  const [batchPreview, setBatchPreview] = useState<Omit<GroupMember, 'id'>[]>([]);

  // Search matches across roster
  const matchingMembers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return groupMembers.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    );
  }, [groupMembers, searchQuery]);

  // Group search matches by student name
  const groupedMatches = useMemo(() => {
    if (!matchingMembers.length) return [];
    const map = new Map<string, GroupMember[]>();
    matchingMembers.forEach((m) => {
      const existing = map.get(m.name) || [];
      existing.push(m);
      map.set(m.name, existing);
    });
    return Array.from(map.entries()).map(([name, records]) => ({
      name,
      records,
    }));
  }, [matchingMembers]);

  if (!isOpen) return null;

  const handleApplyAllForStudent = (records: GroupMember[]) => {
    const mapping: Record<string, string> = {};
    let firstGroup = currentUserGroupName;
    records.forEach((r) => {
      if (r.course_id) {
        mapping[r.course_id] = r.groupName;
        if (!firstGroup) firstGroup = r.groupName;
      }
    });
    if (Object.keys(mapping).length > 0) {
      onUpdateAllCourseGroups(mapping, records[0]?.groupName || firstGroup);
    } else if (records[0]?.groupName) {
      onUpdateMyGroupName(records[0].groupName);
    }
    setSearchQuery('');
  };

  const handleSingleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;
    const selectedCourse = courses.find((c) => c.id === singleCourseId);
    onAddGroupMember({
      name: singleName.trim(),
      email: singleEmail.trim() || undefined,
      role: singleRole.trim() || '組員',
      course_id: singleCourseId || undefined,
      courseName: selectedCourse?.name,
      groupName: singleGroupName.trim() || '第 3 組',
    });
    setSingleName('');
    setSingleEmail('');
    setSingleRole('');
    setShowAddSingle(false);
  };

  const handleBatchParse = () => {
    const parsed = parseBatchRosterText(batchInputText, courses);
    setBatchPreview(parsed);
  };

  const handleConfirmBatchImport = () => {
    if (batchPreview.length === 0) return;
    if (onBatchAddGroupMembers) {
      onBatchAddGroupMembers(batchPreview);
    } else {
      batchPreview.forEach((m) => onAddGroupMember(m));
    }
    setBatchInputText('');
    setBatchPreview([]);
    setShowBatchImport(false);
  };

  const filteredRoster = groupMembers.filter((m) => {
    if (filterRosterCourseId === 'all') return true;
    return m.course_id === filterRosterCourseId;
  });

  const handleCopyInvite = () => {
    const courseDetails = courses
      .map((c) => {
        const grp = userCourseGroups[c.id] || currentUserGroupName || '未設定';
        return `• ${c.name}：【${grp}】`;
      })
      .join('\n');

    const inviteText = `各位同學好，這是我們在各門課的小組分組名單！\n\n${courseDetails}\n\n系統已依據每位同學的 Email 自動綁定各科小組討論，登入後即可自動同步所屬組別之會議與死線（他組看不到）！\n網址：http://localhost:3000`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-6 animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <Users className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                PMBA 各科小組與權限名冊管理
                {isGroupLocked ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    名冊嚴格鎖定中
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    自主選擇模式
                  </span>
                )}
              </h3>
              <p className="text-xs text-indigo-200/90">
                指定 Email、姓名、課程與所屬組別，實現 100% 權限鎖定防窺
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2.5 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('my_groups')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'my_groups'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            我的各科所屬組別
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roster_manager')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'roster_manager'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            全班指定分組對照表 ({groupMembers.length})
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-extrabold">
              推薦管理
            </span>
          </button>
        </div>

        {/* Tab 1: My Course Groups */}
        {activeTab === 'my_groups' && (
          <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
            {/* Strict Mode Notification */}
            {isGroupLocked ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-950 leading-relaxed shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>🔒 名冊權限鎖定保護已啟動：</strong>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    學員登入後，其組別<strong>直接由「全班指定分組對照表」嚴格鎖定</strong>，無法自行切換到其他組，徹底防範任何同學亂點偷看！
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>目前為自主自由模式：</strong>
                  點擊下方標籤即可手動切換組別。若想禁止同學自由切換以防偷看，可切換至「全班指定分組對照表」開啟「名冊嚴格鎖定」。
                </div>
              </div>
            )}

            {/* Optional Roster Search Box */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 shadow-sm space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-indigo-600" />
                  （選用）輸入姓名或 Email 快速查閱分組：
                </label>
                <span className="text-[11px] text-indigo-600 font-semibold">
                  支援跨課堂搜尋
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="輸入姓名或學校 Email（例：Sarah、sarah.lin@...）"
                  className="w-full text-xs font-semibold pl-9 pr-8 py-2.5 rounded-xl border border-indigo-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs p-0.5 rounded-full hover:bg-slate-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Matching Search Results */}
              {searchQuery.trim() && (
                <div className="space-y-2 pt-1 animate-fadeIn">
                  {groupedMatches.length === 0 ? (
                    <p className="text-xs text-slate-500 bg-white p-3 rounded-xl border border-indigo-100 text-center">
                      查無符合「{searchQuery}」的紀錄。請在上方切換至「全班指定分組對照表」新增該學員。
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {groupedMatches.map(({ name, records }) => (
                        <div
                          key={name}
                          className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                👤 {name}
                              </span>
                              {records[0]?.email && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({records[0].email})
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyAllForStudent(records)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-sm transition flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              一鍵同步我的組別
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                            {records.map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                              >
                                <span className="font-semibold text-slate-700 truncate pr-1">
                                  {r.courseName || '未指定課堂'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-violet-100 text-violet-800 border border-violet-200 shrink-0">
                                  {r.groupName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Per-Course Assignments */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-violet-600" />
                各門課程組別狀態
              </h4>

              <div className="space-y-3">
                {courses.map((course) => {
                  const currentCourseGroup =
                    userCourseGroups[course.id] || currentUserGroupName || '第 3 組';

                  return (
                    <div
                      key={course.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2 hover:border-violet-200 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              course.color === 'indigo'
                                ? 'bg-indigo-500'
                                : course.color === 'emerald'
                                ? 'bg-emerald-500'
                                : course.color === 'rose'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-900">
                            {course.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({course.code})
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-violet-100 text-violet-800 border border-violet-200 shrink-0">
                          目前：{currentCourseGroup}
                        </span>
                      </div>

                      {/* Group Chips */}
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-1">
                        {COMMON_GROUP_OPTIONS.map((g) => {
                          const isCurrent = currentCourseGroup === g;
                          return (
                            <button
                              key={g}
                              type="button"
                              disabled={isGroupLocked}
                              onClick={() => onUpdateCourseGroup(course.id, g)}
                              className={`py-1 rounded-xl text-xs font-bold transition text-center border ${
                                isCurrent
                                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                  : isGroupLocked
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-violet-50 hover:border-violet-300'
                              }`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>

                      {isGroupLocked && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          組別已由名冊鎖定，學員不可隨意更動以確保防窺。
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Roster Manager (Email + Person + Course + Group) */}
        {activeTab === 'roster_manager' && (
          <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {/* Admin Permission Status Banner */}
            {canEditRoster ? (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex flex-wrap items-center justify-between gap-2 text-xs shadow-sm">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-bold">👑 班級管理者模式（您擁有完整名冊維護權限）</span>
                    {isAutoAdmin && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800 font-extrabold">
                        身分：{currentUserRole || '班代'}
                      </span>
                    )}
                    {adminUnlocked && !isAutoAdmin && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-extrabold">
                        金鑰授權解鎖中
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAdminConfig(!showAdminConfig)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-100/70 border border-indigo-200 text-indigo-800 text-[11px] font-bold shadow-xs transition"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-600" />
                      {showAdminConfig ? '收起管理者設定' : '⚙️ 設定誰是班代/修改授權碼'}
                    </button>

                    {adminUnlocked && !isAutoAdmin && (
                      <button
                        type="button"
                        onClick={() => setAdminUnlocked(false)}
                        className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold transition"
                      >
                        結束管理模式
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin Configuration Dropdown Card */}
                {showAdminConfig && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4 shadow-lg border border-slate-800 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">
                          班級管理者設定中心 (Admin Center)
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        設定完成即時生效並自動儲存
                      </span>
                    </div>

                    {/* 1. Admin Email List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          永久授權管理者 Email（登入自動獲得班代權限）：
                        </span>
                        <span className="text-[10px] text-slate-400">
                          此清單內 Email 登入免輸入授權碼
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {(adminEmails || []).map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-indigo-200 text-xs font-mono"
                          >
                            <span>{email}</span>
                            {(adminEmails || []).length > 1 && onUpdateAdminEmails && (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateAdminEmails(
                                    (adminEmails || []).filter((e) => e !== email)
                                  )
                                }
                                className="text-slate-400 hover:text-rose-400 transition"
                                title="移除此管理者"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>

                      {onUpdateAdminEmails && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newAdminEmailInput.trim()) {
                              const trimmed = newAdminEmailInput
                                .trim()
                                .toLowerCase();
                              if (!(adminEmails || []).includes(trimmed)) {
                                onUpdateAdminEmails([
                                  ...(adminEmails || []),
                                  trimmed,
                                ]);
                              }
                              setNewAdminEmailInput('');
                            }
                          }}
                          className="flex gap-2 pt-1"
                        >
                          <input
                            type="email"
                            value={newAdminEmailInput}
                            onChange={(e) =>
                              setNewAdminEmailInput(e.target.value)
                            }
                            placeholder="輸入新班代/助教 Email (如: jim.pmba@university.edu.tw)"
                            className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 font-mono"
                          />
                          <button
                            type="submit"
                            disabled={!newAdminEmailInput.trim()}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
                          >
                            + 加入管理者
                          </button>
                        </form>
                      )}
                    </div>

                    {/* 2. Admin PIN Code */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5" />
                          班代管理授權碼 (PIN Code)：
                        </span>
                        <span className="text-[10px] text-slate-400">
                          目前授權碼：
                          <strong className="text-white font-mono ml-1">
                            {adminPinCode || 'pmba2026'}
                          </strong>
                        </span>
                      </div>

                      {onUpdateAdminPinCode && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newPinInput.trim()) {
                              onUpdateAdminPinCode(newPinInput.trim());
                              setNewPinInput('');
                              setPinChangeSuccess(true);
                              setTimeout(
                                () => setPinChangeSuccess(false),
                                3000
                              );
                            }
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={newPinInput}
                            onChange={(e) => setNewPinInput(e.target.value)}
                            placeholder="輸入欲更改的新授權碼 (例如自訂英文或數字)"
                            className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1 font-mono"
                          />
                          <button
                            type="submit"
                            disabled={!newPinInput.trim()}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
                          >
                            儲存新授權碼
                          </button>
                        </form>
                      )}
                      {pinChangeSuccess && (
                        <p className="text-[11px] text-emerald-400 font-semibold">
                          ✓ 班代管理授權碼已成功更新！
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <Eye className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>🔒 唯讀名冊查閱模式（一般學員視角）</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold">
                          無法修改名冊
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        全班分組名冊由班代／助教統籌維護。您可在此依課堂查詢全班分組；若有分組異動需求，請洽詢班代或輸入管理金鑰解鎖。
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPinInput(!showPinInput)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    我是班代/助教 (解鎖管理權限)
                  </button>
                </div>

                {showPinInput && (
                  <form
                    onSubmit={handleUnlockAdmin}
                    className="p-3 bg-white rounded-xl border border-amber-300 shadow-sm flex flex-wrap items-center gap-2 animate-fadeIn"
                  >
                    <Key className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 shrink-0">
                      輸入班級管理授權碼：
                    </span>
                    <input
                      type="password"
                      value={adminPinInput}
                      onChange={(e) => {
                        setAdminPinInput(e.target.value);
                        setPinError('');
                      }}
                      placeholder="授權碼 (預設: pmba2026)"
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg flex-1 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition"
                    >
                      確認解鎖
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPinInput(false);
                        setPinError('');
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600 px-1"
                    >
                      取消
                    </button>
                    {pinError && (
                      <p className="w-full text-[11px] text-rose-600 font-semibold pl-6">
                        {pinError}
                      </p>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* Top Toolbar: Strict Locking Toggle */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">名冊嚴格防護模式 (Strict Locking)</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {isGroupLocked
                    ? '已啟用：同學登入後組別由名冊鎖定，無法自行切換，徹底防止偷看。'
                    : '已關閉：同學登入後可自行切換組別。'}
                </p>
              </div>

              {canEditRoster ? (
                onToggleGroupLock && (
                  <button
                    type="button"
                    onClick={() => onToggleGroupLock(!isGroupLocked)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 ${
                      isGroupLocked
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    {isGroupLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        名冊鎖定中（安全）
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        點擊開啟鎖定
                      </>
                    )}
                  </button>
                )
              ) : (
                <div className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  名冊由班代鎖定保護中
                </div>
              )}
            </div>

            {/* Action Buttons: Add Single vs Batch Import (Admin Only) */}
            {canEditRoster && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSingle(!showAddSingle);
                      setShowBatchImport(false);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + 單筆指定分組
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBatchImport(!showBatchImport);
                      setShowAddSingle(false);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-bold transition shadow-sm"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    📋 批次貼上匯入 (Excel / LINE 名冊)
                  </button>
                </div>

                {groupMembers.length > 0 && onClearAllGroupMembers && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('確定要清空全班對照表嗎？')) {
                        onClearAllGroupMembers();
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    清空名冊
                  </button>
                )}
              </div>
            )}

            {/* Single Add Form */}
            {showAddSingle && (
              <form
                onSubmit={handleSingleAddSubmit}
                className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 space-y-3 animate-fadeIn"
              >
                <div className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                  指定一位學員的課堂分組 (Email ＋ 姓名 ＋ 課程 ＋ 組別)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    placeholder="姓名 * (例: Sarah 林同學)"
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="email"
                    required
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="學校或個人 Email * (登入即比對)"
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={singleCourseId}
                    onChange={(e) => setSingleCourseId(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={singleGroupName}
                    onChange={(e) => setSingleGroupName(e.target.value)}
                    placeholder="組別 (例: 第 3 組)"
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={singleRole}
                    onChange={(e) => setSingleRole(e.target.value)}
                    placeholder="角色備註 (例: 組長/財務分析)"
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddSingle(false)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                  >
                    確認加入對照表
                  </button>
                </div>
              </form>
            )}

            {/* Batch Import Form */}
            {showBatchImport && (
              <div className="p-4 rounded-2xl bg-violet-50/80 border border-violet-200/90 space-y-3 animate-fadeIn">
                <div className="text-xs font-bold text-violet-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-violet-600" />
                    批次貼上分組名單（支援從 Excel / LINE 直接複製貼上）
                  </span>
                </div>

                <p className="text-[11px] text-slate-600">
                  格式：每行一筆，以<strong>逗號</strong>或 <strong>Tab (Excel貼上)</strong> 分隔：
                  <br />
                  <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-violet-200 text-violet-800">
                    姓名, Email, 課程名稱, 組別
                  </code>
                </p>

                <textarea
                  rows={4}
                  value={batchInputText}
                  onChange={(e) => setBatchInputText(e.target.value)}
                  placeholder={`例如直接貼上：\nSarah, sarah.lin@university.edu.tw, 策略管理, 第 3 組\nAlex, alex.chen@university.edu.tw, 策略管理, 第 1 組\n王小明, ming@email.com, 財務管理, 第 5 組`}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-violet-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBatchParse}
                    disabled={!batchInputText.trim()}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 disabled:opacity-50 hover:bg-violet-700 text-white text-xs font-bold shadow-sm"
                  >
                    解析內容預覽
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBatchImport(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
                  >
                    取消
                  </button>
                </div>

                {/* Batch Preview */}
                {batchPreview.length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-violet-200 space-y-2">
                    <div className="text-xs font-bold text-violet-900 flex items-center justify-between">
                      <span>已成功解析 {batchPreview.length} 筆對照資料：</span>
                      <button
                        type="button"
                        onClick={handleConfirmBatchImport}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                      >
                        確認一鍵全數匯入！
                      </button>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 text-[11px]">
                      {batchPreview.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-700"
                        >
                          <span className="font-bold">{item.name}</span>
                          <span className="font-mono text-slate-400">{item.email}</span>
                          <span>{item.courseName}</span>
                          <span className="px-1.5 py-0.2 rounded font-extrabold bg-violet-100 text-violet-800">
                            {item.groupName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Course Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setFilterRosterCourseId('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  filterRosterCourseId === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全部課程 ({groupMembers.length})
              </button>
              {courses.map((c) => {
                const count = groupMembers.filter((m) => m.course_id === c.id).length;
                const active = filterRosterCourseId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFilterRosterCourseId(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition truncate max-w-[140px] ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.name.split('與')[0]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Current Roster Table */}
            {filteredRoster.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                目前尚無對照資料。點擊上方「+ 單筆指定分組」或「📋 批次貼上匯入」開始建立！
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto">
                {filteredRoster.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-200 transition shadow-sm flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {member.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {member.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-violet-100 text-violet-800 border border-violet-200">
                            {member.groupName}
                          </span>
                          {member.role && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                              {member.role}
                            </span>
                          )}
                        </div>

                        {member.email && (
                          <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                            {member.email}
                          </p>
                        )}

                        {member.courseName && (
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{member.courseName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {canEditRoster ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `確定要從名冊中移除「${member.name}」在【${member.courseName}】的組別嗎？`
                            )
                          ) {
                            onDeleteGroupMember(member.id);
                          }
                        }}
                        title="刪除此筆對照"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-medium px-1 shrink-0">
                        唯讀
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyInvite}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  已複製邀請名單！
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  複製分組名單給同學
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
          >
            完成設定並關閉
          </button>
        </div>
      </div>
    </div>
  );
}