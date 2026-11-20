'use client';

import React, { useState, useEffect } from 'react';
import {
  getSupabaseClient,
  getSupabaseConfig,
  saveLocalSupabaseConfig,
  SUPABASE_SQL_SCHEMA,
} from '@/lib/supabase';
import {
  Check,
  Cloud,
  Copy,
  Database,
  KeyRound,
  LogIn,
  LogOut,
  Settings2,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseUserEmail: string | null;
  onSupabaseConfigChanged: () => void;
  initialTab?: 'share' | 'cloud' | 'sql';
}

export default function CloudSyncModal({
  isOpen,
  onClose,
  supabaseUserEmail,
  onSupabaseConfigChanged,
  initialTab,
}: CloudSyncModalProps) {
  const currentConfig = getSupabaseConfig();
  const [activeTab, setActiveTab] = useState<'share' | 'cloud' | 'sql'>(
    initialTab || (supabaseUserEmail ? 'share' : 'cloud')
  );

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      } else if (!supabaseUserEmail) {
        setActiveTab('cloud');
      }
    }
  }, [isOpen, initialTab, supabaseUserEmail]);

  const [showAdvancedConfig, setShowAdvancedConfig] = useState(!currentConfig.isConfigured);
  const [urlInput, setUrlInput] = useState(currentConfig.url);
  const [anonKeyInput, setAnonKeyInput] = useState(currentConfig.anonKey);
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [authStatusMsg, setAuthStatusMsg] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleCopyInvite = () => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://pmba-hub.vercel.app';
    const text = `🎓【PMBA 班級學習與時程管理平台】\n我建立了一個我們 PMBA 專屬的課程行事曆 + 作業考試倒數 + 私人雲端記事本：\n👉 ${origin}\n\n✅ 班級公版的作業、考試、討論死線大家同步共享\n🔒 你勾選的個人完成進度與課堂筆記 100% 私密隔離（只有你自己看得到）\n📱 手機打開網址還可以「加入主畫面」跨裝置同步使用！`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveSupabaseKeys = (e: React.FormEvent) => {
    e.preventDefault();
    saveLocalSupabaseConfig(urlInput, anonKeyInput);
    onSupabaseConfigChanged();
    setAuthStatusMsg('✅ 已儲存 Supabase 連線設定！現在可在下方登入或註冊帳號。');
  };

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = getSupabaseClient();
    if (!client) {
      setAuthStatusMsg('⚠️ 請先在上方填入有效的 Supabase Project URL 與 Anon Key。');
      return;
    }

    setAuthStatusMsg('連線處理中...');
    try {
      if (authMode === 'magic') {
        const { error } = await client.auth.signInWithOtp({
          email: authEmail.trim(),
        });
        if (error) throw error;
        setAuthStatusMsg('📩 已寄出登入連結至你的信箱，請開啟信件點擊連結登入！');
      } else if (authMode === 'signup') {
        const { error } = await client.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: authName.trim()
            ? { data: { full_name: authName.trim() } }
            : undefined,
        });
        if (error) throw error;
        setAuthStatusMsg('🎉 註冊成功！若專案有開啟信箱驗證請收信，或直接登入。');
        onSupabaseConfigChanged();
      } else {
        const { error } = await client.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        setAuthStatusMsg('✅ 登入成功！已啟動跨裝置雲端同步與 RLS 隱私保護。');
        onSupabaseConfigChanged();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '認證失敗，請檢查設定';
      setAuthStatusMsg(`❌ ${message}`);
    }
  };

  const handleResetPassword = async () => {
    if (!authEmail.trim()) {
      setAuthStatusMsg('⚠️ 請先在上方輸入您的 Email，再點擊「忘記密碼」！');
      return;
    }
    const client = getSupabaseClient();
    if (!client) return;
    setAuthStatusMsg('正在向雲端發送重設密碼信件...');
    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://time-vault-wine-phi.vercel.app';
      const { error } = await client.auth.resetPasswordForEmail(authEmail.trim(), {
        redirectTo: origin,
      });
      if (error) throw error;
      setAuthStatusMsg('📩 密碼重設連結已寄出！請至信箱收信並依指示重設密碼。');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '重設失敗，請檢查信箱';
      setAuthStatusMsg(`❌ ${message}`);
    }
  };

  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
      onSupabaseConfigChanged();
      setAuthStatusMsg('已登出雲端帳號。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold">
              分享給同學・跨裝置安裝・Supabase 雲端同步設定
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('share')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'share'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4" />
            1. 分享給同學 & 跨裝置 App
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'cloud'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            2. 學員雲端帳號登入 / 同步
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            3. 一鍵複製 RLS 資料庫腳本
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
          {activeTab === 'share' && (
            <div className="space-y-5">
              {/* Invite Box */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    一鍵邀請 PMBA 班上同學或小組成員
                  </span>
                  <button
                    onClick={handleCopyInvite}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
                  >
                    {copiedInvite ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        已複製 LINE 邀請文案！
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        複製 LINE / 群組邀請訊息
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  當你部署到 Vercel 後，只要把網址傳到 PMBA 班級 LINE 群組，同學各自登入自己的帳號：
                  <br />• <strong>班級公版共享</strong>：任何人新增的「公版課程、作業死線、考試日期、討論時間」，全班行事曆與倒數計時器會自動同步。
                  <br />• <strong>個人絕對私密</strong>：每個人勾選的「完成進度」、「個人備忘」與「私密記事本」，透過 Supabase PostgreSQL Row-Level Security (RLS) 綁定個人 `auth.uid()`，<strong>自己只看得到自己的資料</strong>！
                </p>
              </div>

              {/* Cross-device PWA guide */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  如何跨裝置使用（手機、iPad、筆電同步）？
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-900 block mb-1">
                      📱 iPhone / iPad (Safari)
                    </strong>
                    用 Safari 打開你的 Vercel 網址 → 點擊底部「分享」圖示 → 選擇「加入主畫面 (Add to Home Screen)」，即可像原生 App 一樣全螢幕開啟！
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-900 block mb-1">
                      💻 筆電 / Android (Chrome / Edge)
                    </strong>
                    打開網址後點擊網址列右側的「安裝應用程式 (Install PMBA Hub)」，即可在桌面與手機隨時跨裝置同步登入。
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-5">
              {/* Database Connection Reassurance Card */}
              {currentConfig.isConfigured && !showAdvancedConfig ? (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                        雲端資料庫已就緒連線
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-200/70 text-emerald-800">
                          {currentConfig.source === 'env' ? '環境變數自動載入' : '已儲存'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        全班公版行事曆自動同步；個人打卡進度與備忘筆記由 PostgreSQL RLS 加密隔離保護。
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedConfig(true)}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-emerald-100/50 transition shrink-0 ml-2"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    進階設定
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Supabase 雲端資料庫連線設定 (工程模式)
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          currentConfig.isConfigured
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {currentConfig.isConfigured
                          ? `已設定 (${currentConfig.source === 'env' ? '環境變數' : '瀏覽器儲存'})`
                          : '目前為本機展示模式'}
                      </span>
                      {currentConfig.isConfigured && (
                        <button
                          type="button"
                          onClick={() => setShowAdvancedConfig(false)}
                          className="text-[11px] text-slate-500 hover:text-slate-700 underline"
                        >
                          收合 ▲
                        </button>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleSaveSupabaseKeys} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        NEXT_PUBLIC_SUPABASE_URL (公開 Project URL)
                      </label>
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://xxxxxxxxxxxx.supabase.co"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        NEXT_PUBLIC_SUPABASE_ANON_KEY (公開 Publishable / Anon Key)
                      </label>
                      <input
                        type="password"
                        value={anonKeyInput}
                        onChange={(e) => setAnonKeyInput(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">
                        此處填寫公開金鑰，真正的安全防護由 Supabase RLS 把關。最高權限 Secret Key 勿填於此。
                      </span>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                      >
                        儲存連線金鑰
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Supabase Auth Login Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <LogIn className="w-4 h-4 text-indigo-600" />
                    個人雲端帳號登入 / 註冊
                  </h4>
                  {supabaseUserEmail && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        已登入：{supabaseUserEmail}
                      </span>
                      <button
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        登出
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {(
                    [
                      { key: 'signin', label: 'Email 密碼登入' },
                      { key: 'signup', label: '註冊新同學帳號' },
                      { key: 'magic', label: '免密碼 Magic Link 登入' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setAuthMode(m.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        authMode === m.key
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSupabaseAuth} className="space-y-3">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        中文姓名 / 暱稱 (選填，例：林大為、Sarah)
                      </label>
                      <input
                        type="text"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="輸入全班名冊顯示的中文姓名"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      學校或個人 Email
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="yourname@university.edu.tw"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                    />
                    <p className="text-[11px] text-indigo-600 mt-1">
                      💡 智慧名冊比對：使用學校 Email 登入，系統將自動比對通訊錄並帶入姓名與各科組別！
                    </p>
                  </div>
                  {authMode !== 'magic' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-600">
                          密碼 (至少 6 碼)
                        </label>
                        {authMode === 'signin' && (
                          <button
                            type="button"
                            onClick={handleResetPassword}
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                          >
                            忘記密碼？
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
                  >
                    {authMode === 'signin'
                      ? '登入雲端帳號'
                      : authMode === 'signup'
                      ? '註冊 PMBA 帳號'
                      : '寄送登入連結至信箱'}
                  </button>
                </form>

                {authStatusMsg && (
                  <div className="p-3 rounded-xl bg-slate-100 text-xs font-medium text-slate-800">
                    {authStatusMsg}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Supabase SQL 資料表與 RLS 隱私隔離腳本
                  </h4>
                  <p className="text-xs text-slate-500">
                    到 Supabase 後台左側點選「SQL Editor」→「New query」，貼上以下腳本並按「Run」即完成建置！
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition shrink-0"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      已複製 SQL！
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      複製完整 SQL 腳本
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-[11px] overflow-x-auto leading-relaxed max-h-80">
                <code>{SUPABASE_SQL_SCHEMA}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
