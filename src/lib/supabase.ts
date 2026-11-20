import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'pmba_hub_supabase_url';
const STORAGE_ANON_KEY = 'pmba_hub_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean; source: 'env' | 'local' | 'none' } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  if (
    envUrl &&
    envKey &&
    !envUrl.includes('your-project-id') &&
    !envKey.includes('your-anon-key')
  ) {
    return { url: envUrl, anonKey: envKey, isConfigured: true, source: 'env' };
  }

  if (typeof window !== 'undefined') {
    const localUrl = window.localStorage.getItem(STORAGE_URL_KEY) || '';
    const localKey = window.localStorage.getItem(STORAGE_ANON_KEY) || '';
    if (localUrl && localKey) {
      return { url: localUrl, anonKey: localKey, isConfigured: true, source: 'local' };
    }
  }

  return { url: '', anonKey: '', isConfigured: false, source: 'none' };
}

export function saveLocalSupabaseConfig(url: string, anonKey: string) {
  if (typeof window === 'undefined') return;
  if (url.trim() && anonKey.trim()) {
    window.localStorage.setItem(STORAGE_URL_KEY, url.trim());
    window.localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  } else {
    window.localStorage.removeItem(STORAGE_URL_KEY);
    window.localStorage.removeItem(STORAGE_ANON_KEY);
  }
  cachedClient = null;
  cachedConfigKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  const configKey = `${url}::${anonKey}`;
  if (cachedClient && cachedConfigKey === configKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey);
    cachedConfigKey = configKey;
    return cachedClient;
  } catch {
    return null;
  }
}

export const SUPABASE_SQL_SCHEMA = `-- PMBA Hub - Supabase 資料表與 Row-Level Security (RLS) 隱私隔離設定
-- 請在 Supabase Dashboard -> SQL Editor 貼上並執行 (Run)

-- 1. 重設舊有欄位型態（確保 ID 支援自訂代碼如 course-strat）
drop table if exists public.personal_notes cascade;
drop table if exists public.user_event_progress cascade;
drop table if exists public.academic_events cascade;
drop table if exists public.course_enrollments cascade;
drop table if exists public.courses cascade;

create table public.courses (
  id text primary key,
  name text not null,
  code text not null,
  course_type text not null default 'required' check (course_type in ('required', 'elective')),
  professor text not null default '',
  term_info text not null default '',
  color text not null default 'indigo',
  is_shared boolean not null default true,
  owner_id text,
  created_at timestamptz not null default now()
);

-- 選修課名單關係表 (Course Enrollments)
create table public.course_enrollments (
  user_id text not null,
  course_id text not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table public.academic_events (
  id text primary key default gen_random_uuid()::text,
  course_id text references public.courses(id) on delete set null,
  title text not null,
  category text not null check (category in ('class', 'assignment', 'exam', 'discussion')),
  due_at timestamptz not null,
  location text not null default '',
  description text not null default '',
  is_shared boolean not null default true,
  is_pinned_countdown boolean not null default true,
  owner_id text,
  owner_name text not null default 'PMBA 同學',
  created_at timestamptz not null default now()
);

create table public.user_event_progress (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  event_id text not null references public.academic_events(id) on delete cascade,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  personal_memo text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table public.personal_notes (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  course_id text references public.courses(id) on delete set null,
  event_id text references public.academic_events(id) on delete set null,
  title text not null,
  content text not null default '',
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.academic_events enable row level security;
alter table public.user_event_progress enable row level security;
alter table public.personal_notes enable row level security;

-- Course enrollments
create policy "Enrollments visible to all" on public.course_enrollments for select using (true);
create policy "Users manage own enrollments" on public.course_enrollments for all using (true);

-- Courses (全班共享可讀寫)
create policy "Courses visible to all" on public.courses for select using (true);
create policy "Users insert courses" on public.courses for insert with check (true);
create policy "Users update shared courses" on public.courses for update using (true);
create policy "Users delete courses" on public.courses for delete using (true);

-- Academic events (全班共享行事曆可讀寫)
create policy "Events visible to all" on public.academic_events for select using (true);
create policy "Users insert events" on public.academic_events for insert with check (true);
create policy "Users update shared events" on public.academic_events for update using (true);
create policy "Users delete events" on public.academic_events for delete using (true);

-- User event progress (個人打勾進度：私密隔離)
create policy "Users only see own progress" on public.user_event_progress for select using (auth.uid()::text = user_id or auth.role() = 'anon');
create policy "Users only insert own progress" on public.user_event_progress for insert with check (auth.uid()::text = user_id or auth.role() = 'anon');
create policy "Users only update own progress" on public.user_event_progress for update using (auth.uid()::text = user_id or auth.role() = 'anon');
create policy "Users only delete own progress" on public.user_event_progress for delete using (auth.uid()::text = user_id or auth.role() = 'anon');

-- Personal notes (個人筆記：私密隔離)
create policy "Users only see own notes" on public.personal_notes for select using (auth.uid()::text = user_id or auth.role() = 'anon');
create policy "Users only insert own notes" on public.personal_notes for insert with check (auth.uid()::text = user_id or auth.role() = 'anon');
create policy "Users only update own notes" on public.personal_notes for update using (auth.uid()::text = user_id or auth.role() = 'anon');
create policy "Users only delete own notes" on public.personal_notes for delete using (auth.uid()::text = user_id or auth.role() = 'anon');`;
