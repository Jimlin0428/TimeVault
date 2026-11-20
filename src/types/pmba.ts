export type EventCategory = 'class' | 'assignment' | 'exam' | 'discussion';

export type EventVisibility = 'public' | 'group' | 'private';

export type ProgressStatus = 'todo' | 'in_progress' | 'done';

export type CourseType = 'required' | 'elective';

export type CourseColor =
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'violet';

export interface Course {
  id: string;
  name: string;
  code: string;
  type: CourseType; // 'required' (全班必修) | 'elective' (自由選修)
  professor: string;
  term_info?: string; // 選填備註（例如：115-1 學期 / 週末模組排課）
  color: CourseColor;
  is_shared: boolean;
  owner_id: string;
  created_at?: string;
}

export interface CourseEnrollment {
  user_id: string;
  course_id: string;
  created_at?: string;
}

export interface AcademicEvent {
  id: string;
  course_id: string;
  title: string;
  category: EventCategory;
  due_at: string; // ISO string
  location: string;
  description: string;
  is_shared: boolean; // true = 班級或小組共享, false = 個人私密行程
  visibility?: EventVisibility; // 'public' (全班公版) | 'group' (小組限定) | 'private' (個人私密)
  group_name?: string | null; // e.g. '第 3 組'（僅小組限定時使用）
  group_passcode?: string | null; // 小組防窺通關碼（只有輸入正確暗號的組員才能查看，防止他組亂選偷看）
  is_pinned_countdown: boolean; // 是否顯示於首頁重點倒數區
  owner_id: string;
  owner_name: string;
  created_at?: string;
}

export interface UserEventProgress {
  id: string;
  user_id: string;
  event_id: string;
  status: ProgressStatus;
  personal_memo: string; // 個人針對此公版作業/考試的私密小備註（同學看不到）
  updated_at: string;
}

export interface PersonalNote {
  id: string;
  user_id: string;
  course_id: string | null;
  event_id: string | null;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  updated_at: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  avatarColor: string;
  groupName: string; // 預設組別
  courseGroups?: Record<string, string>; // course_id -> group_name (每門課各自獨立的組別)
  courseGroupPasscodes?: Record<string, string>; // course_id -> passcode (小組防窺通關暗號)
}

export interface GroupMember {
  id: string;
  name: string;
  email?: string;
  role?: string; // 例如：組長、財務分析、投影片製作、報告統整、個案引言
  course_id?: string; // 哪門課的分組 (若不限則留空)
  courseName?: string; // 課程名稱 (例: 策略管理、財務管理)
  groupName: string; // 例如：第 3 組
  phoneOrContact?: string; // LINE ID 或電話
}
