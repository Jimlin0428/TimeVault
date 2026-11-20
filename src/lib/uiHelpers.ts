import { CourseColor, EventCategory, ProgressStatus } from '@/types/pmba';

export const CATEGORY_META: Record<
  EventCategory,
  { label: string; badgeClass: string; dotClass: string; borderClass: string }
> = {
  assignment: {
    label: '作業 / 報告',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    borderClass: 'border-l-amber-500',
  },
  exam: {
    label: '考試 / 測驗',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
    borderClass: 'border-l-rose-500',
  },
  discussion: {
    label: '小組討論',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
    dotClass: 'bg-violet-500',
    borderClass: 'border-l-violet-500',
  },
  class: {
    label: '課程 / 專題',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500',
    borderClass: 'border-l-sky-500',
  },
};

export const STATUS_META: Record<
  ProgressStatus,
  { label: string; className: string; activeClass: string }
> = {
  todo: {
    label: '待處理',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    activeClass: 'bg-slate-800 text-white',
  },
  in_progress: {
    label: '進行中',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeClass: 'bg-indigo-600 text-white',
  },
  done: {
    label: '已完成',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeClass: 'bg-emerald-600 text-white',
  },
};

export const COURSE_COLOR_MAP: Record<
  CourseColor,
  { bg: string; text: string; border: string; pill: string; solid: string }
> = {
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    pill: 'bg-indigo-100 text-indigo-800',
    solid: 'bg-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    pill: 'bg-emerald-100 text-emerald-800',
    solid: 'bg-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    pill: 'bg-amber-100 text-amber-800',
    solid: 'bg-amber-500',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    pill: 'bg-rose-100 text-rose-800',
    solid: 'bg-rose-600',
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    pill: 'bg-sky-100 text-sky-800',
    solid: 'bg-sky-600',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    pill: 'bg-violet-100 text-violet-800',
    solid: 'bg-violet-600',
  },
};

export interface CountdownBreakdown {
  totalMs: number;
  isExpired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  urgency: 'critical' | 'warning' | 'normal' | 'expired';
}

export function getCountdownBreakdown(dueAtIso: string, nowMs: number): CountdownBreakdown {
  const dueMs = new Date(dueAtIso).getTime();
  const diff = dueMs - nowMs;

  if (diff <= 0) {
    const abs = Math.abs(diff);
    const days = Math.floor(abs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);
    return {
      totalMs: diff,
      isExpired: true,
      days,
      hours,
      minutes: 0,
      seconds: 0,
      urgency: 'expired',
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  let urgency: CountdownBreakdown['urgency'] = 'normal';
  if (days < 3) {
    urgency = 'critical';
  } else if (days < 7) {
    urgency = 'warning';
  }

  return {
    totalMs: diff,
    isExpired: false,
    days,
    hours,
    minutes,
    seconds,
    urgency,
  };
}

export function formatDateTimeTW(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const w = weekdays[d.getDay()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${day} (${w}) ${hh}:${mm}`;
}
