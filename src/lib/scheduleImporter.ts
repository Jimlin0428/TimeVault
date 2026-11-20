import ntuScheduleRaw from './ntuPmbaScheduleData.json';
import { AcademicEvent, Course, CourseColor, CourseType } from '@/types/pmba';

export interface RawCourseEntry {
  name: string;
  teacher?: string;
  hours?: number;
  classroom?: string;
  classType?: string;
}

export interface RawScheduleDay {
  date: string; // e.g. "11月21日"
  day: string; // "Sat" or "Sun"
  grade: string; // "114" or "115"
  semester: string; // "1150", "1151", "1152"
  courses: RawCourseEntry[];
}

export const NTU_SCHEDULE_DATA: RawScheduleDay[] = ntuScheduleRaw as RawScheduleDay[];

export type ProgramClassOption =
  | 'all'
  | 'PMBA_A'
  | 'PMBA_B'
  | 'PMLBA_A'
  | 'PMLBA_B'
  | 'PMBM_A'
  | 'PMBM_B';

export const PROGRAM_OPTIONS: { value: ProgramClassOption; label: string; shortLabel: string }[] = [
  { value: 'all', label: 'All', shortLabel: 'All' },
  { value: 'PMBA_A', label: 'PMBA (A)', shortLabel: 'PMBA (A)' },
  { value: 'PMBA_B', label: 'PMBA (B)', shortLabel: 'PMBA (B)' },
  { value: 'PMLBA_A', label: 'PMLBA (A)', shortLabel: 'PMLBA (A)' },
  { value: 'PMLBA_B', label: 'PMLBA (B)', shortLabel: 'PMLBA (B)' },
  { value: 'PMBM_A', label: 'PMBM (A)', shortLabel: 'PMBM (A)' },
  { value: 'PMBM_B', label: 'PMBM (B)', shortLabel: 'PMBM (B)' },
];

export function isCourseInProgram(
  courseName: string,
  classType: string,
  programOption: ProgramClassOption
): boolean {
  if (programOption === 'all') return true;
  const [program, classGroup] = programOption.split('_');

  const name = courseName.trim();
  const ct = (classType || '').trim();

  // Holidays and general cohort sessions
  if (
    name.includes('連假') ||
    name.includes('放假') ||
    name.includes('假') ||
    name.includes('選舉') ||
    ct === 'ALL' ||
    ct === 'all'
  ) {
    return true;
  }

  // Management courses shared by PMBA & PMBM
  if (
    name.includes('行銷管理') ||
    name.includes('服務與營運管理') ||
    name.includes('人工智慧與商業數據分析')
  ) {
    return program === 'PMBA' || program === 'PMBM';
  }

  // Legal courses for PMLBA
  if (
    name.includes('民刑法') ||
    name.includes('行政法') ||
    name.includes('法務專題') ||
    name.includes('商業法制專題') ||
    name.includes('商事法律專題') ||
    (name.includes('專題') && ct === 'PMLBA')
  ) {
    return program === 'PMLBA';
  }

  // Section specific courses (A vs B)
  if (name.includes('財務管理') || name.includes('策略管理')) {
    return ct === classGroup;
  }

  return ct === program || ct === classGroup;
}

export function parseTaiwanScheduleDateToIso(
  dateStr: string,
  semester: string
): string {
  const mMatch = dateStr.match(/(\d+)月(\d+)日/);
  if (!mMatch) return new Date().toISOString();

  const month = parseInt(mMatch[1], 10);
  const day = parseInt(mMatch[2], 10);

  let year = 2026;
  if (semester === '1150') {
    year = 2026;
  } else if (semester === '1151') {
    year = month === 1 ? 2027 : 2026;
  } else if (semester === '1152') {
    year = 2027;
  }

  // PMBA class starts at 09:00
  const d = new Date(year, month - 1, day, 9, 0, 0);
  return d.toISOString();
}

const COLOR_PALETTE: CourseColor[] = [
  'indigo',
  'emerald',
  'amber',
  'rose',
  'sky',
  'violet',
];

export interface AvailableCourseOption {
  name: string;
  teacher: string;
  classCount: number;
  type: CourseType;
}

export function getAvailableCoursesForFilter(options: {
  selectedGrade: '115' | '114' | 'all';
  selectedSemester: '1151' | '1150' | '1152' | 'all';
  campusFilter: 'all' | 'taipei' | 'zhubei';
  programFilter: ProgramClassOption;
}): {
  courses: AvailableCourseOption[];
  holidayCount: number;
} {
  const { selectedGrade, selectedSemester, campusFilter, programFilter } = options;

  const filteredDays = NTU_SCHEDULE_DATA.filter((item) => {
    if (selectedGrade !== 'all' && item.grade !== selectedGrade) return false;
    if (selectedSemester !== 'all' && item.semester !== selectedSemester)
      return false;
    return true;
  });

  const courseMap: Record<string, { teacher: string; count: number; isRequired: boolean }> = {};
  let holidayCount = 0;

  filteredDays.forEach((dayItem) => {
    dayItem.courses.forEach((c) => {
      const rawName = c.name.trim();
      const classroom = (c.classroom || '').trim();
      const ct = (c.classType || '').trim();

      // Campus filter
      if (campusFilter === 'taipei' && classroom && !classroom.includes('台北'))
        return;
      if (campusFilter === 'zhubei' && classroom && !classroom.includes('竹北'))
        return;

      // Program filter
      if (!isCourseInProgram(rawName, ct, programFilter)) {
        return;
      }

      const cleanName = rawName.replace(/\(\d+\)/g, '').trim();
      const isHoliday =
        cleanName.includes('放假') ||
        cleanName.includes('連假') ||
        cleanName.includes('停課');

      if (isHoliday) {
        holidayCount++;
      } else {
        if (!courseMap[cleanName]) {
          courseMap[cleanName] = {
            teacher: c.teacher || '',
            count: 0,
            isRequired: !cleanName.includes('專題'),
          };
        }
        courseMap[cleanName].count++;
        if (!courseMap[cleanName].teacher && c.teacher) {
          courseMap[cleanName].teacher = c.teacher;
        }
      }
    });
  });

  const courses: AvailableCourseOption[] = Object.entries(courseMap).map(
    ([name, info]) => ({
      name,
      teacher: info.teacher || 'PMBA 教授',
      classCount: info.count,
      type: info.isRequired ? 'required' : 'elective',
    })
  );

  return { courses, holidayCount };
}

export function extractCoursesAndEventsFromSchedule(options: {
  selectedGrade: '115' | '114' | 'all';
  selectedSemester: '1151' | '1150' | '1152' | 'all';
  campusFilter: 'all' | 'taipei' | 'zhubei';
  programFilter: ProgramClassOption;
  selectedCourseNames?: string[];
  includeHolidays?: boolean;
  currentUserId: string;
  currentUserName: string;
}): { newCourses: Course[]; newEvents: AcademicEvent[] } {
  const {
    selectedGrade,
    selectedSemester,
    campusFilter,
    programFilter,
    selectedCourseNames,
    includeHolidays = true,
    currentUserId,
    currentUserName,
  } = options;

  const filteredDays = NTU_SCHEDULE_DATA.filter((item) => {
    if (selectedGrade !== 'all' && item.grade !== selectedGrade) return false;
    if (selectedSemester !== 'all' && item.semester !== selectedSemester)
      return false;
    return true;
  });

  const courseMap: Record<string, Course> = {};
  const events: AcademicEvent[] = [];

  let colorIdx = 0;

  filteredDays.forEach((dayItem) => {
    const dueIso = parseTaiwanScheduleDateToIso(
      dayItem.date,
      dayItem.semester
    );

    dayItem.courses.forEach((c) => {
      const rawName = c.name.trim();
      const classroom = (c.classroom || '').trim();
      const ct = (c.classType || '').trim();

      // Campus filter
      if (campusFilter === 'taipei' && classroom && !classroom.includes('台北'))
        return;
      if (campusFilter === 'zhubei' && classroom && !classroom.includes('竹北'))
        return;

      // Program filter
      if (!isCourseInProgram(rawName, ct, programFilter)) {
        return;
      }

      const cleanName = rawName.replace(/\(\d+\)/g, '').trim();

      const isHoliday =
        cleanName.includes('放假') ||
        cleanName.includes('連假') ||
        cleanName.includes('停課');

      // User checked course filter
      if (!isHoliday && selectedCourseNames && !selectedCourseNames.includes(cleanName)) {
        return;
      }

      if (isHoliday && !includeHolidays) {
        return;
      }

      let courseId = '';
      if (!isHoliday) {
        if (!courseMap[cleanName]) {
          const color = COLOR_PALETTE[colorIdx % COLOR_PALETTE.length];
          colorIdx++;
          const isRequired: CourseType = cleanName.includes('專題')
            ? 'elective'
            : 'required';

          courseMap[cleanName] = {
            id: `course-ntu-${cleanName}`,
            name: cleanName,
            code: `PMBA-${cleanName.slice(0, 3)}`,
            type: isRequired,
            professor: c.teacher || 'PMBA 教授',
            term_info: `台大 PMBA ${dayItem.grade} 級 (${dayItem.semester})`,
            color,
            is_shared: true,
            owner_id: currentUserId,
            created_at: new Date().toISOString(),
          };
        }
        courseId = courseMap[cleanName].id;
      }

      // Create event
      const eventTitle = isHoliday
        ? `【放假】${cleanName}`
        : `${cleanName}（第 ${dayItem.date} ${dayItem.day} 課堂）`;

      events.push({
        id: `evt-ntu-${dayItem.grade}-${dayItem.semester}-${dayItem.date}-${rawName.replace(/\s+/g, '')}`,
        course_id: courseId,
        title: eventTitle,
        category: 'class',
        due_at: dueIso,
        location: classroom || (isHoliday ? '停課放假' : '管院教室'),
        description: isHoliday
          ? `台大 PMBA 行事曆：${cleanName}`
          : `授課教師：${c.teacher || '未定'}｜時數：${c.hours || 7}小時｜班別：${c.classType || '全班'}`,
        is_shared: true,
        is_pinned_countdown: false,
        owner_id: currentUserId,
        owner_name: currentUserName,
        created_at: new Date().toISOString(),
      });
    });
  });

  return {
    newCourses: Object.values(courseMap),
    newEvents: events,
  };
}
