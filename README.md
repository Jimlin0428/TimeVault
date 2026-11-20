# 🎓 PMBA Hub — 課程・行事曆・倒數・私密雲端記事平台

專為 **PMBA (高階/在職企管碩士班)** 學員量身打造的跨裝置學習管理 Web App，採用 **Next.js + Tailwind CSS + Supabase (PostgreSQL & Row-Level Security)** 架構，並支援一鍵部署至 **Vercel**。

## ✨ 核心功能與架構特色

1. **⏱️ 作業 / 考試 / 個案討論即時倒數計時**
   - 支援四大事項分類：**課程 / 專題 (`class`)**、**作業 / 報告 (`assignment`)**、**考試 / 測驗 (`exam`)**、**小組討論 (`discussion`)**。
   - 即時顯示距離死線剩餘的 **天、時、分、秒**，並針對 `< 3 天` 與 `< 7 天` 的緊急事項自動醒目警示。
2. **🌐 班級公版共享 + 🔒 個人私密隔離 (Row-Level Security)**
   - **公版共享時程 (`is_shared = true`)**：全班或同組同學登入後，皆可同步看到教授公布的作業死線、期中期末考日期、小組討論時間。
   - **個人獨立完成進度與私密備忘 (`user_event_progress`)**：即使是同一個公版作業，每個人勾選的「待處理 / 進行中 / 已完成」與個人備忘皆獨立綁定個人 `user_id`，**自己只看得到自己的進度**。
   - **個人私密排程 (`is_shared = false`)**：自己排定的讀書計畫或複習時程，其他同學完全看不到。
3. **📅 互動式月曆與每日議程視圖**
   - 一目了然檢視整月課程、作業、考試與討論分佈，點擊任一日期即可檢視當日明細或直接在該日新增事項。
4. **🔒 個人私密記事本 (`personal_notes`)**
   - 每篇課堂筆記、個案分析重點或公式大抄皆綁定個人 `user_id`，透過 Supabase RLS 政策保護，任何其他同學皆無法存取你的私人筆記。
5. **📱 跨裝置同步 & PWA 手機桌面安裝**
   - 支援在 iPhone / iPad / Android / 筆電瀏覽器「加入主畫面」，並附有行動版底部導覽列。

---

## 🚀 快速啟動與雲端部署指南

### 1. 本機啟動開發伺服器

```bash
cd pmba-hub
npm install
npm run dev
```

開啟瀏覽器前往 `http://localhost:3000` 即可立即體驗（未設定 Supabase 前會自動啟用本機儲存與頂部「切換同學視角體驗隱私隔離」功能）。

### 2. 建立 Supabase 雲端資料庫與 RLS 權限

1. 前往 [Supabase](https://supabase.com/) 建立一個免費專案。
2. 進入左側選單 **SQL Editor** → 點擊 **New query**。
3. 複製本專案 [`supabase/schema.sql`](./supabase/schema.sql) 的內容（或直接點擊網站右上角「分享給同學 / 雲端同步」→「3. 一鍵複製 RLS 資料庫腳本」），貼上並點擊 **Run**。
4. 到 **Project Settings → API** 取得：
   - `Project URL` (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public key` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 3. 部署至 Vercel 並分享給同學

1. 將此專案推送到你的 GitHub Repository。
2. 前往 [Vercel](https://vercel.com/) 點擊 **Add New Project** 並匯入此 Repository。
3. 在 Vercel 的 **Environment Variables** 設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 點擊 **Deploy**！完成後即可將 Vercel 網址分享到 PMBA 班級或小組 LINE 群組。
