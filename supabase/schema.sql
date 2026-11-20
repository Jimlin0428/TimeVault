-- ============================================================================
-- PMBA 學習與課程管理平台 (PMBA Hub) - Supabase PostgreSQL Schema & RLS 權限控管
-- 支援「必修課（全班自動可見）」與「選修課（修課名單制）」權限控管
-- ============================================================================

-- 1. 課程資料表 (Courses)
-- course_type: 'required' (全班必修) | 'elective' (自由選修)
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  course_type text not null default 'required' check (course_type in ('required', 'elective')),
  professor text not null default '',
  term_info text not null default '',
  color text not null default 'indigo',
  is_shared boolean not null default true,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2. 選修課修課名單關係表 (Course Enrollments)
create table if not exists public.course_enrollments (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- 3. 學習事項／行事曆／倒數事件表 (Academic Events)
create table if not exists public.academic_events (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  category text not null check (category in ('class', 'assignment', 'exam', 'discussion')),
  due_at timestamptz not null,
  location text not null default '',
  description text not null default '',
  is_shared boolean not null default true,
  is_pinned_countdown boolean not null default true,
  owner_id uuid references auth.users(id) on delete cascade,
  owner_name text not null default 'PMBA 同學',
  created_at timestamptz not null default now()
);

-- 4. 個人事件進度與私密備註表 (User Event Progress - 100% 個人私密)
create table if not exists public.user_event_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.academic_events(id) on delete cascade,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  personal_memo text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, event_id)
);

-- 5. 個人私密記事本 (Personal Notes - 100% 個人私密)
create table if not exists public.personal_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  event_id uuid references public.academic_events(id) on delete set null,
  title text not null,
  content text not null default '',
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 啟用 Row Level Security (RLS) 資料列層級安全控管
-- ============================================================================
alter table public.courses enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.academic_events enable row level security;
alter table public.user_event_progress enable row level security;
alter table public.personal_notes enable row level security;

-- Courses Policies
create policy "Courses visible if shared or owned" on public.courses for select using (is_shared = true or auth.uid() = owner_id);
create policy "Users insert courses" on public.courses for insert with check (auth.uid() = owner_id);
create policy "Users update shared or owned courses" on public.courses for update using (is_shared = true or auth.uid() = owner_id);
create policy "Users delete owned courses" on public.courses for delete using (auth.uid() = owner_id);

-- Course Enrollments Policies
create policy "Enrollments visible to all" on public.course_enrollments for select using (true);
create policy "Users manage own enrollments" on public.course_enrollments for all using (auth.uid() = user_id);

-- Events Policies
create policy "Events visible if shared or owned" on public.academic_events for select using (is_shared = true or auth.uid() = owner_id);
create policy "Users insert events" on public.academic_events for insert with check (auth.uid() = owner_id);
create policy "Users update shared or owned events" on public.academic_events for update using (is_shared = true or auth.uid() = owner_id);
create policy "Users delete owned events" on public.academic_events for delete using (auth.uid() = owner_id);

-- User Progress Policies (個人私密隔離)
create policy "Users only see own progress" on public.user_event_progress for select using (auth.uid() = user_id);
create policy "Users only insert own progress" on public.user_event_progress for insert with check (auth.uid() = user_id);
create policy "Users only update own progress" on public.user_event_progress for update using (auth.uid() = user_id);
create policy "Users only delete own progress" on public.user_event_progress for delete using (auth.uid() = user_id);

-- Personal Notes Policies (個人私密隔離)
create policy "Users only see own notes" on public.personal_notes for select using (auth.uid() = user_id);
create policy "Users only insert own notes" on public.personal_notes for insert with check (auth.uid() = user_id);
create policy "Users only update own notes" on public.personal_notes for update using (auth.uid() = user_id);
create policy "Users only delete own notes" on public.personal_notes for delete using (auth.uid() = user_id);
