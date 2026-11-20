'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Course, UserProfile } from '@/types/pmba';
import {
  Check,
  ChevronDown,
  Cloud,
  Edit2,
  GraduationCap,
  KeyRound,
  LogOut,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';

interface UserProfileMenuProps {
  currentUser: UserProfile;
  courses: Course[];
  demoUsers: UserProfile[];
  activeDemoIndex: number;
  onSwitchDemoUser: (index: number) => void;
  onUpdateName: (newName: string) => void;
  onOpenGroupModal: () => void;
  onOpenCloudModal: () => void;
  supabaseUserEmail: string | null;
  onSupabaseSignOut?: () => void;
}

export default function UserProfileMenu({
  currentUser,
  courses,
  demoUsers,
  activeDemoIndex,
  onSwitchDemoUser,
  onUpdateName,
  onOpenGroupModal,
  onOpenCloudModal,
  supabaseUserEmail,
  onSupabaseSignOut,
}: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.name);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditingName(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    setNameInput(currentUser.name);
  }, [currentUser.name]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const initialLetter = currentUser.name ? currentUser.name.slice(0, 1) : 'U';

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-indigo-300 text-slate-800 transition shadow-sm group"
        title="點擊查看目前登入者身分與帳號資訊"
      >
        <div
          className={`w-7 h-7 rounded-xl ${
            currentUser.avatarColor || 'bg-indigo-600'
          } text-white font-extrabold flex items-center justify-center text-xs shadow-sm ring-2 ring-white`}
        >
          {initialLetter}
        </div>

        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 leading-tight">
            <span className="truncate max-w-[110px]">{currentUser.name}</span>
            <span
              className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
              title="已登入"
            />
          </div>
          <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
            {currentUser.groupName || '第 3 組'}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Profile Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-fadeIn text-slate-800">
          {/* Header Banner */}
          <div className="p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3.5 top-3.5 p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-2xl ${
                  currentUser.avatarColor || 'bg-indigo-600'
                } text-white font-black flex items-center justify-center text-lg shadow-lg ring-2 ring-white/20 shrink-0`}
              >
                {initialLetter}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    目前登入者
                  </span>
                  {supabaseUserEmail ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-medium">
                      雲端連線
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
                      本機學員模式
                    </span>
                  )}
                </div>

                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex gap-1.5 mt-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg bg-slate-800 text-white border border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full font-bold"
                      placeholder="輸入姓名..."
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0"
                    >
                      儲存
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="px-2 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs"
                    >
                      取消
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5 mt-1">
                    <h3 className="text-base font-extrabold text-white truncate">
                      {currentUser.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition"
                      title="修改我的姓名 / 暱稱"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <p className="text-xs text-indigo-200/90 truncate mt-0.5 font-mono">
                  {supabaseUserEmail || currentUser.email}
                </p>
                <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{currentUser.roleLabel || 'PMBA 學員'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-[68vh] overflow-y-auto">
            {/* Quick Overview: My Assigned Groups per Course */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  我的各科分組總覽
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenGroupModal();
                  }}
                  className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold hover:underline"
                >
                  前往修改各科組別 →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {courses.map((course) => {
                  const grp =
                    currentUser.courseGroups?.[course.id] ||
                    currentUser.groupName ||
                    '第 3 組';
                  return (
                    <div
                      key={course.id}
                      className="p-1.5 rounded-lg bg-white border border-indigo-100/80 flex items-center justify-between"
                    >
                      <span className="text-[11px] font-semibold text-slate-700 truncate pr-1">
                        {course.name.split('與')[0]}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-violet-100 text-violet-800 shrink-0">
                        {grp}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Switch Classmate Perspective (Demo Simulation) */}
            {!supabaseUserEmail && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    切換同學視角（體驗跨組與筆記隔離）：
                  </span>
                </label>

                <div className="grid grid-cols-1 gap-1.5">
                  {demoUsers.map((u, idx) => {
                    const isActive = activeDemoIndex === idx;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          onSwitchDemoUser(idx);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition text-left ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-lg ${u.avatarColor} text-white font-extrabold flex items-center justify-center text-[10px]`}
                          >
                            {u.name.slice(0, 1)}
                          </div>
                          <div>
                            <div>{u.name}</div>
                            <div
                              className={`text-[10px] font-normal ${
                                isActive ? 'text-indigo-100' : 'text-slate-400'
                              }`}
                            >
                              {u.roleLabel}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {u.groupName}
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cloud Sync & Real Account Login */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                帳號與雲端連線狀態
              </label>

              {supabaseUserEmail ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-900">
                      ● 已連線 Supabase 雲端
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono truncate max-w-[140px]">
                      {supabaseUserEmail}
                    </span>
                  </div>
                  {onSupabaseSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        onSupabaseSignOut();
                        setIsOpen(false);
                      }}
                      className="w-full py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      登出雲端帳號
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenCloudModal();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>登入 / 註冊真正個人雲端帳號</span>
                  </div>
                  <span className="text-[10px] text-indigo-500 font-medium">
                    跨裝置同步 →
                  </span>
                </button>
              )}
            </div>

            {/* Privacy Guarantee Explanation */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                身分安全與資料隔離保障
              </div>
              <p className="leading-relaxed">
                只有在登入此身分時，才會自動載入你所屬各科的<strong>小組討論時程</strong>，且你的<strong>個人進度勾選</strong>與<strong>私密筆記</strong>100% 獨立隔離，班上其他同學完全看不到。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}