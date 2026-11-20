'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AcademicEvent,
  Course,
  CourseColor,
  CourseEnrollment,
  CourseType,
  EventCategory,
  EventVisibility,
  GroupMember,
  PersonalNote,
  ProgressStatus,
  UserEventProgress,
  UserProfile,
} from '@/types/pmba';
import {
  createInitialEvents,
  DEMO_USERS,
  INITIAL_COURSES,
  INITIAL_ENROLLMENTS,
  INITIAL_GROUP_MEMBERS,
  INITIAL_NOTES,
  INITIAL_PROGRESS,
} from '@/lib/seedData';
import { getSupabaseClient, getSupabaseConfig } from '@/lib/supabase';
import CountdownGrid from '@/components/CountdownGrid';
import CalendarBoard from '@/components/CalendarBoard';
import NotesVault from '@/components/NotesVault';
import CourseManager from '@/components/CourseManager';
import NewEventModal from '@/components/NewEventModal';
import CloudSyncModal from '@/components/CloudSyncModal';
import ImportScheduleModal from '@/components/ImportScheduleModal';
import GroupSettingsModal from '@/components/GroupSettingsModal';
import UserProfileMenu from '@/components/UserProfileMenu';
import {
  AlarmClock,
  Calendar,
  CheckCircle2,
  Cloud,
  Download,
  FileText,
  Filter,
  GraduationCap,
  Lock,
  LogIn,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';

type ActiveTab = 'countdown' | 'calendar' | 'notes' | 'courses';

const LS_COURSES = 'pmba_hub_courses_v1';
const LS_EVENTS = 'pmba_hub_events_v1';
const LS_PROGRESS = 'pmba_hub_progress_v1';
const LS_NOTES = 'pmba_hub_notes_v1';
const LS_ENROLLMENTS = 'pmba_hub_enrollments_v1';
const LS_GROUP_MEMBERS = 'pmba_hub_group_members_v1';
const LS_USER_GROUP = 'pmba_hub_user_group_v1';
const LS_USER_COURSE_GROUPS = 'pmba_hub_user_course_groups_v1';
const LS_USER_NAME = 'pmba_hub_user_name_v1';
const LS_GROUP_PASSCODES = 'pmba_hub_group_passcodes_v1';
const LS_GROUP_LOCKED = 'pmba_hub_group_locked_v1';
const LS_ADMIN_EMAILS = 'pmba_hub_admin_emails_v1';
const LS_ADMIN_PIN = 'pmba_hub_admin_pin_v1';

export default function PMBAHubPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('countdown');
  const [demoUserIndex, setDemoUserIndex] = useState<number>(0);
  const [supabaseUser, setSupabaseUser] = useState<{
    id: string;
    email: string;
    fullName?: string;
  } | null>(null);

  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [enrollments, setEnrollments] =
    useState<CourseEnrollment[]>(INITIAL_ENROLLMENTS);
  const [events, setEvents] = useState<AcademicEvent[]>(() =>
    createInitialEvents()
  );
  const [progressList, setProgressList] = useState<UserEventProgress[]>([]);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [groupMembers, setGroupMembers] =
    useState<GroupMember[]>(INITIAL_GROUP_MEMBERS);
  const [customUserGroupName, setCustomUserGroupName] = useState<string | null>(
    null
  );
  const [customUserName, setCustomUserName] = useState<string | null>(null);
  const [userCourseGroups, setUserCourseGroups] = useState<
    Record<string, string>
  >({});
  const [courseGroupPasscodes, setCourseGroupPasscodes] = useState<
    Record<string, string>
  >({});
  const [isGroupLocked, setIsGroupLocked] = useState<boolean>(true);
  const [adminEmails, setAdminEmails] = useState<string[]>([
    'alex.chen@university.edu.tw',
    'jim.pmba@university.edu.tw',
    'jim.lin.pmp@gmail.com',
  ]);
  const [adminPinCode, setAdminPinCode] = useState<string>('pmba2026');
  const [filterOnlyMyCourses, setFilterOnlyMyCourses] = useState<boolean>(true);
  const [hydrated, setHydrated] = useState(false);

  // Modals state
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [newEventCourseId, setNewEventCourseId] = useState<string | undefined>(
    undefined
  );
  const [newEventDatePrefix, setNewEventDatePrefix] = useState<
    string | undefined
  >(undefined);
  const [quickNoteTargetEvent, setQuickNoteTargetEvent] =
    useState<AcademicEvent | null>(null);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Determine current active user profile
  const currentUser: UserProfile = useMemo(() => {
    if (supabaseUser) {
      const emailLower = (supabaseUser.email || '').trim().toLowerCase();
      // 1. Intelligent Roster Matching by Email
      const matchedMembers = groupMembers.filter(
        (m) => m.email && m.email.trim().toLowerCase() === emailLower
      );
      const matchedName = matchedMembers[0]?.name;

      // Automatically collect all course groups registered for this student
      const rosterCourseGroups: Record<string, string> = {};
      let rosterDefaultGroup = '第 3 組';
      matchedMembers.forEach((m) => {
        if (m.course_id && m.groupName) {
          rosterCourseGroups[m.course_id] = m.groupName;
          rosterDefaultGroup = m.groupName;
        }
      });

      const effectiveName =
        customUserName ||
        supabaseUser.fullName ||
        matchedName ||
        supabaseUser.email.split('@')[0] ||
        'PMBA 學員';

      // Check if user email is explicitly registered in adminEmails list
      const isAdminEmail = adminEmails.some(
        (e) => e.trim().toLowerCase() === emailLower
      );

      // When strict lock is enabled, roster assignment has absolute priority
      const mergedCourseGroups = isGroupLocked
        ? { ...userCourseGroups, ...rosterCourseGroups }
        : { ...rosterCourseGroups, ...userCourseGroups };

      return {
        id: supabaseUser.id,
        name: effectiveName,
        email: supabaseUser.email,
        roleLabel: isAdminEmail
          ? 'PMBA 班代 / 管理者'
          : matchedMembers[0]?.role ||
            (matchedName ? 'PMBA 班級學員' : 'PMBA 雲端學員'),
        avatarColor: isAdminEmail ? 'bg-amber-600' : 'bg-indigo-600',
        groupName: isGroupLocked
          ? (rosterDefaultGroup || customUserGroupName || '第 3 組')
          : (customUserGroupName || rosterDefaultGroup || '第 3 組'),
        courseGroups: mergedCourseGroups,
      };
    }

    // Demo local mode
    const base = DEMO_USERS[demoUserIndex] || DEMO_USERS[0];
    const demoEmailLower = (base.email || '').trim().toLowerCase();
    const isDemoAdmin =
      base.roleLabel.includes('班代') ||
      adminEmails.some((e) => e.trim().toLowerCase() === demoEmailLower);

    const matchedMembers = groupMembers.filter(
      (m) =>
        (m.email && m.email.trim().toLowerCase() === demoEmailLower) ||
        (m.name && m.name === base.name)
    );
    const rosterCourseGroups: Record<string, string> = {};
    let rosterDefaultGroup = base.groupName;
    matchedMembers.forEach((m) => {
      if (m.course_id && m.groupName) {
        rosterCourseGroups[m.course_id] = m.groupName;
        rosterDefaultGroup = m.groupName;
      }
    });

    const mergedCourseGroups =
      isGroupLocked && Object.keys(rosterCourseGroups).length > 0
        ? { ...(base.courseGroups || {}), ...userCourseGroups, ...rosterCourseGroups }
        : { ...(base.courseGroups || {}), ...rosterCourseGroups, ...userCourseGroups };

    const isGuest = !supabaseUser;
    return {
      ...base,
      name: customUserName || (isGuest ? '訪客學員 (未登入)' : base.name),
      roleLabel: isGuest ? '訪客瀏覽' : (isDemoAdmin ? 'PMBA 班代' : base.roleLabel),
      avatarColor: isGuest ? 'bg-slate-600' : (isDemoAdmin ? 'bg-amber-600' : base.avatarColor),
      groupName:
        isGroupLocked && matchedMembers.length > 0
          ? rosterDefaultGroup
          : customUserGroupName || base.groupName,
      courseGroups: mergedCourseGroups,
    };
  }, [
    supabaseUser,
    demoUserIndex,
    customUserName,
    customUserGroupName,
    userCourseGroups,
    groupMembers,
    isGroupLocked,
    adminEmails,
  ]);

  // Strict admin check: ONLY authenticated users whose email is in adminEmails
  const isAdmin = useMemo(() => {
    if (!supabaseUser?.email) return false;
    const emailLower = supabaseUser.email.trim().toLowerCase();
    return adminEmails.some((e) => e.trim().toLowerCase() === emailLower);
  }, [supabaseUser, adminEmails]);

  // Load from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCourses = window.localStorage.getItem(LS_COURSES);
        const savedEnrollments = window.localStorage.getItem(LS_ENROLLMENTS);
        const savedEvents = window.localStorage.getItem(LS_EVENTS);
        const savedProgress = window.localStorage.getItem(LS_PROGRESS);
        const savedNotes = window.localStorage.getItem(LS_NOTES);
        const savedMembers = window.localStorage.getItem(LS_GROUP_MEMBERS);
        const savedGroup = window.localStorage.getItem(LS_USER_GROUP);
        const savedName = window.localStorage.getItem(LS_USER_NAME);
        const savedCourseGroups = window.localStorage.getItem(
          LS_USER_COURSE_GROUPS
        );
        const savedPasscodes = window.localStorage.getItem(LS_GROUP_PASSCODES);
        const savedLocked = window.localStorage.getItem(LS_GROUP_LOCKED);
        const savedAdminEmails = window.localStorage.getItem(LS_ADMIN_EMAILS);
        const savedAdminPin = window.localStorage.getItem(LS_ADMIN_PIN);

        if (savedCourses) {
          const parsedCourses = JSON.parse(savedCourses);
          if (Array.isArray(parsedCourses)) {
            setCourses(
              parsedCourses.map((c: Record<string, unknown>) => ({
                ...(c as unknown as Course),
                type: (c.type || c.course_type || 'required') as CourseType,
              }))
            );
          }
        }
        if (savedEnrollments) setEnrollments(JSON.parse(savedEnrollments));
        if (savedEvents) setEvents(JSON.parse(savedEvents));
        if (savedProgress) setProgressList(JSON.parse(savedProgress));
        if (savedNotes) setNotes(JSON.parse(savedNotes));
        if (savedMembers) setGroupMembers(JSON.parse(savedMembers));
        if (savedGroup) setCustomUserGroupName(savedGroup);
        if (savedName) setCustomUserName(savedName);
        if (savedCourseGroups) setUserCourseGroups(JSON.parse(savedCourseGroups));
        if (savedPasscodes) setCourseGroupPasscodes(JSON.parse(savedPasscodes));
        if (savedLocked !== null) setIsGroupLocked(savedLocked === 'true');
        if (savedAdminEmails) setAdminEmails(JSON.parse(savedAdminEmails));
        if (savedAdminPin) setAdminPinCode(savedAdminPin);
      } catch {
        // keep defaults
      }
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage when modified
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(LS_GROUP_LOCKED, String(isGroupLocked));
  }, [isGroupLocked, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(LS_ADMIN_EMAILS, JSON.stringify(adminEmails));
  }, [adminEmails, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(LS_ADMIN_PIN, adminPinCode);
  }, [adminPinCode, hydrated]);

  // Persist to localStorage when modified
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(LS_COURSES, JSON.stringify(courses));
  }, [courses, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(LS_ENROLLMENTS, JSON.stringify(enrollments));
  }, [enrollments, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(LS_EVENTS, JSON.stringify(events));
  }, [events, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(LS_PROGRESS, JSON.stringify(progressList));
  }, [progressList, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(LS_NOTES, JSON.stringify(notes));
  }, [notes, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(LS_GROUP_MEMBERS, JSON.stringify(groupMembers));
  }, [groupMembers, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    if (customUserGroupName) {
      window.localStorage.setItem(LS_USER_GROUP, customUserGroupName);
    }
  }, [customUserGroupName, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    if (customUserName) {
      window.localStorage.setItem(LS_USER_NAME, customUserName);
    } else {
      window.localStorage.removeItem(LS_USER_NAME);
    }
  }, [customUserName, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    if (Object.keys(userCourseGroups).length > 0) {
      window.localStorage.setItem(
        LS_USER_COURSE_GROUPS,
        JSON.stringify(userCourseGroups)
      );
    }
  }, [userCourseGroups, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    if (Object.keys(courseGroupPasscodes).length > 0) {
      window.localStorage.setItem(
        LS_GROUP_PASSCODES,
        JSON.stringify(courseGroupPasscodes)
      );
    }
  }, [courseGroupPasscodes, hydrated]);

  // Sync with Supabase (public courses/events for everyone; private data for logged-in user)
  const syncWithSupabase = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setSupabaseUser(null);
      return;
    }

    // 1. Always fetch public courses and shared events (allows Incognito & guests to see latest data)
    try {
      const [coursesRes, enrollRes, eventsRes] = await Promise.all([
        client
          .from('courses')
          .select('*')
          .order('created_at', { ascending: true }),
        client.from('course_enrollments').select('*'),
        client
          .from('academic_events')
          .select('*')
          .order('due_at', { ascending: true }),
      ]);

      if (coursesRes.data && coursesRes.data.length > 0) {
        const mappedCourses: Course[] = coursesRes.data.map(
          (row: Record<string, unknown>) => ({
            id: String(row.id),
            name: String(row.name || ''),
            code: String(row.code || ''),
            type: (row.course_type || row.type || 'required') as CourseType,
            professor: String(row.professor || ''),
            term_info: String(row.term_info || ''),
            color: (row.color || 'indigo') as CourseColor,
            is_shared: Boolean(row.is_shared ?? true),
            owner_id: String(row.owner_id || ''),
            created_at: row.created_at ? String(row.created_at) : undefined,
          })
        );
        setCourses(mappedCourses);
      }
      if (enrollRes.data && enrollRes.data.length > 0) {
        setEnrollments(enrollRes.data as CourseEnrollment[]);
      }
      if (eventsRes.data && eventsRes.data.length > 0) {
        setEvents(eventsRes.data as AcademicEvent[]);
      } else if (coursesRes.data && coursesRes.data.length > 0) {
        // Real cloud courses exist, clear the outdated local mock events
        setEvents([]);
      }
    } catch (err) {
      console.error('Failed to fetch public Supabase data:', err);
    }

    // 2. Check if a user is currently logged in
    const { data: authData } = await client.auth.getUser();
    const user = authData?.user;
    if (!user) {
      setSupabaseUser(null);
      setNotes([]);
      setProgressList([]);
      return;
    }

    setSupabaseUser({
      id: user.id,
      email: user.email || 'user@pmba',
      fullName: (user.user_metadata?.full_name as string) || '',
    });

    // 3. Fetch user's private progress and notes
    try {
      const [progRes, notesRes] = await Promise.all([
        client
          .from('user_event_progress')
          .select('*')
          .eq('user_id', user.id),
        client
          .from('personal_notes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
      ]);

      if (progRes.data) {
        setProgressList(progRes.data as UserEventProgress[]);
      }
      if (notesRes.data) {
        setNotes(notesRes.data as PersonalNote[]);
      }
    } catch (err) {
      console.error('Failed to fetch private user data:', err);
    }
  }, []);

  useEffect(() => {
    syncWithSupabase();

    const client = getSupabaseClient();
    if (!client) return;

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser({
          id: session.user.id,
          email: session.user.email || 'user@pmba',
          fullName: (session.user.user_metadata?.full_name as string) || '',
        });
        syncWithSupabase();

        // Clean up hash fragment from URL if redirected from email confirmation
        if (
          typeof window !== 'undefined' &&
          window.location.hash.includes('access_token')
        ) {
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          );
        }
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncWithSupabase]);

  // Fast map lookup for courses
  const courseById = useMemo(() => {
    const map: Record<string, Course> = {};
    courses.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [courses]);

  // Current user's enrolled elective course IDs
  const myEnrolledCourseIds = useMemo(() => {
    return enrollments
      .filter((e) => e.user_id === currentUser.id)
      .map((e) => e.course_id);
  }, [enrollments, currentUser.id]);

  // Number of students enrolled per elective course
  const enrollmentCounts = useMemo(() => {
    const map: Record<string, number> = {};
    enrollments.forEach((e) => {
      map[e.course_id] = (map[e.course_id] || 0) + 1;
    });
    return map;
  }, [enrollments]);

  // Toggle elective enrollment for current user
  const handleToggleEnrollCourse = async (courseId: string) => {
    const isEnrolled = myEnrolledCourseIds.includes(courseId);
    if (isEnrolled) {
      setEnrollments((prev) =>
        prev.filter(
          (e) => !(e.user_id === currentUser.id && e.course_id === courseId)
        )
      );
      const client = getSupabaseClient();
      if (client && supabaseUser) {
        await client
          .from('course_enrollments')
          .delete()
          .eq('user_id', supabaseUser.id)
          .eq('course_id', courseId);
      }
    } else {
      const newEnrollment: CourseEnrollment = {
        user_id: currentUser.id,
        course_id: courseId,
        created_at: new Date().toISOString(),
      };
      setEnrollments((prev) => [...prev, newEnrollment]);
      const client = getSupabaseClient();
      if (client && supabaseUser) {
        await client.from('course_enrollments').insert({
          user_id: supabaseUser.id,
          course_id: courseId,
        });
      }
    }
  };

  // Filter courses visible in course library (shared OR owned by user)
  const visibleCourses = useMemo(() => {
    return courses.filter((c) => c.is_shared || c.owner_id === currentUser.id);
  }, [courses, currentUser.id]);

  // Filter events visible on countdown & calendar:
  // 1. Private events: ONLY shown to the owner
  // 2. Group events (e.g. 小組討論): ONLY shown to members of that group or creator
  // 3. Public events (班級公版):
  //    - If course is 'required' -> shown to all classmates
  //    - If course is 'elective' -> ONLY shown if current user enrolled in it (or creator)
  const visibleEvents = useMemo(() => {
    return events
      .filter((e) => {
        const vis =
          e.visibility ||
          (e.is_shared ? (e.group_name ? 'group' : 'public') : 'private');

        // 1. Private events: only creator sees
        if (vis === 'private') {
          return e.owner_id === currentUser.id;
        }

        // 2. Group events (e.g. 小組討論): only same group members of this course or creator see
        if (vis === 'group') {
          if (e.owner_id === currentUser.id) return true;
          const myCourseGroup =
            currentUser.courseGroups?.[e.course_id] || currentUser.groupName;
          if (!e.group_name || !myCourseGroup) return false;
          const isSameGroup =
            e.group_name.trim().toLowerCase() ===
            myCourseGroup.trim().toLowerCase();
          if (!isSameGroup) return false;

          // Anti-snooping check: If this event has a passcode, only members with matching passcode can view
          if (e.group_passcode) {
            const myPass = courseGroupPasscodes[e.course_id];
            if (myPass !== e.group_passcode) {
              return false;
            }
          }

          return true;
        }

        // 3. Public events: shared to all students
        return true;
      })
      .filter((e) => {
        if (!filterOnlyMyCourses) return true;
        if (!e.is_shared && e.owner_id === currentUser.id) return true;
        const c = courseById[e.course_id];
        if (!c) return true;
        if (c.type === 'required') return true;
        // Elective course: must be enrolled or creator
        return (
          myEnrolledCourseIds.includes(c.id) || e.owner_id === currentUser.id
        );
      });
  }, [
    events,
    currentUser.id,
    currentUser.groupName,
    currentUser.courseGroups,
    courseGroupPasscodes,
    filterOnlyMyCourses,
    courseById,
    myEnrolledCourseIds,
  ]);

  // Map of currentUser's personal progress per event_id
  const myProgressMap = useMemo(() => {
    const map: Record<string, UserEventProgress> = {};
    progressList
      .filter((p) => p.user_id === currentUser.id)
      .forEach((p) => {
        map[p.event_id] = p;
      });
    return map;
  }, [progressList, currentUser.id]);

  // Personal notes count for currentUser
  const myNotesCount = useMemo(() => {
    return notes.filter((n) => n.user_id === currentUser.id).length;
  }, [notes, currentUser.id]);

  // Summary metrics (calculated from visibleEvents reflecting enrolled courses)
  const metrics = useMemo(() => {
    const now = Date.now();
    let urgentCount = 0;
    let pendingCount = 0;
    let doneCount = 0;

    visibleEvents.forEach((ev) => {
      const st = myProgressMap[ev.id]?.status || 'todo';
      if (st === 'done') {
        doneCount++;
      } else {
        pendingCount++;
        const diffDays =
          (new Date(ev.due_at).getTime() - now) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 7) {
          urgentCount++;
        }
      }
    });

    return { urgentCount, pendingCount, doneCount };
  }, [visibleEvents, myProgressMap]);

  // Handlers
  const handleUpdateStatus = async (eventId: string, status: ProgressStatus) => {
    const nowIso = new Date().toISOString();
    setProgressList((prev) => {
      const existing = prev.find(
        (p) => p.user_id === currentUser.id && p.event_id === eventId
      );
      if (existing) {
        return prev.map((p) =>
          p.id === existing.id ? { ...p, status, updated_at: nowIso } : p
        );
      }
      return [
        ...prev,
        {
          id: `prog-${Date.now()}`,
          user_id: currentUser.id,
          event_id: eventId,
          status,
          personal_memo: '',
          updated_at: nowIso,
        },
      ];
    });

    const client = getSupabaseClient();
    if (client && supabaseUser) {
      await client.from('user_event_progress').upsert(
        {
          user_id: supabaseUser.id,
          event_id: eventId,
          status,
          personal_memo: myProgressMap[eventId]?.personal_memo || '',
          updated_at: nowIso,
        },
        { onConflict: 'user_id,event_id' }
      );
    }
  };

  const handleUpdateMemo = async (eventId: string, memo: string) => {
    const nowIso = new Date().toISOString();
    setProgressList((prev) => {
      const existing = prev.find(
        (p) => p.user_id === currentUser.id && p.event_id === eventId
      );
      if (existing) {
        return prev.map((p) =>
          p.id === existing.id
            ? { ...p, personal_memo: memo, updated_at: nowIso }
            : p
        );
      }
      return [
        ...prev,
        {
          id: `prog-${Date.now()}`,
          user_id: currentUser.id,
          event_id: eventId,
          status: 'todo',
          personal_memo: memo,
          updated_at: nowIso,
        },
      ];
    });

    const client = getSupabaseClient();
    if (client && supabaseUser) {
      await client.from('user_event_progress').upsert(
        {
          user_id: supabaseUser.id,
          event_id: eventId,
          status: myProgressMap[eventId]?.status || 'todo',
          personal_memo: memo,
          updated_at: nowIso,
        },
        { onConflict: 'user_id,event_id' }
      );
    }
  };

  const handleTogglePinCountdown = async (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;
    const nextPinned = !target.is_pinned_countdown;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, is_pinned_countdown: nextPinned } : e
      )
    );
    const client = getSupabaseClient();
    if (client && supabaseUser) {
      await client
        .from('academic_events')
        .update({ is_pinned_countdown: nextPinned })
        .eq('id', eventId);
    }
  };

  const handleAddEvent = async (data: {
    course_id: string;
    title: string;
    category: EventCategory;
    due_at: string;
    location: string;
    description: string;
    is_shared: boolean;
    visibility: EventVisibility;
    group_name?: string | null;
    group_passcode?: string | null;
    is_pinned_countdown: boolean;
  }) => {
    const newEvt: AcademicEvent = {
      id: `evt-${Date.now()}`,
      ...data,
      owner_id: currentUser.id,
      owner_name: currentUser.name,
      created_at: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, newEvt]);

    const client = getSupabaseClient();
    if (client && supabaseUser) {
      const { data: inserted } = await client
        .from('academic_events')
        .insert({
          ...data,
          owner_id: supabaseUser.id,
          owner_name: currentUser.name,
        })
        .select()
        .single();
      if (inserted) {
        setEvents((prev) =>
          prev.map((e) => (e.id === newEvt.id ? (inserted as AcademicEvent) : e))
        );
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (
      target &&
      target.is_shared &&
      !target.group_name &&
      !isAdmin &&
      (!supabaseUser || target.owner_id !== supabaseUser.id)
    ) {
      alert('⚠️ 公版課堂與班級行程僅限班代 / 管理者可以刪除。');
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    const client = getSupabaseClient();
    if (client && supabaseUser) {
      await client.from('academic_events').delete().eq('id', eventId);
    }
  };

  const handleUpdateEvent = async (updatedEvt: AcademicEvent) => {
    if (
      updatedEvt.is_shared &&
      !updatedEvt.group_name &&
      !isAdmin &&
      (!supabaseUser || updatedEvt.owner_id !== supabaseUser.id)
    ) {
      alert('⚠️ 公版課堂與班級行程僅限班代 / 管理者可以編輯。');
      return;
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvt.id ? updatedEvt : e))
    );
    const client = getSupabaseClient();
    if (client && supabaseUser) {
      await client
        .from('academic_events')
        .update({
          course_id: updatedEvt.course_id,
          title: updatedEvt.title,
          category: updatedEvt.category,
          due_at: updatedEvt.due_at,
          location: updatedEvt.location,
          description: updatedEvt.description,
          is_shared: updatedEvt.is_shared,
          visibility: updatedEvt.visibility,
          group_name: updatedEvt.group_name,
          group_passcode: updatedEvt.group_passcode,
          is_pinned_countdown: updatedEvt.is_pinned_countdown,
        })
        .eq('id', updatedEvt.id);
    }
  };

  const handleSaveNote = async (noteData: {
    id?: string;
    title: string;
    content: string;
    course_id: string | null;
    event_id: string | null;
    tags: string[];
    is_pinned: boolean;
  }) => {
    const nowIso = new Date().toISOString();
    if (noteData.id) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteData.id
            ? {
                ...n,
                title: noteData.title,
                content: noteData.content,
                course_id: noteData.course_id,
                event_id: noteData.event_id,
                tags: noteData.tags,
                is_pinned: noteData.is_pinned,
                updated_at: nowIso,
              }
            : n
        )
      );
      const client = getSupabaseClient();
      if (client && supabaseUser) {
        await client
          .from('personal_notes')
          .update({
            title: noteData.title,
            content: noteData.content,
            course_id: noteData.course_id,
            event_id: noteData.event_id,
            tags: noteData.tags,
            is_pinned: noteData.is_pinned,
            updated_at: nowIso,
          })
          .eq('id', noteData.id)
          .eq('user_id', supabaseUser.id);
      }
    } else {
      const newNote: PersonalNote = {
        id: `note-${Date.now()}`,
        user_id: currentUser.id,
        course_id: noteData.course_id,
        event_id: noteData.event_id,
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags,
        is_pinned: noteData.is_pinned,
        updated_at: nowIso,
        created_at: nowIso,
      };
      setNotes((prev) => [newNote, ...prev]);

      const client = getSupabaseClient();
      if (client && supabaseUser) {
        const { data: inserted } = await client
          .from('personal_notes')
          .insert({
            user_id: supabaseUser.id,
            course_id: noteData.course_id,
            event_id: noteData.event_id,
            title: noteData.title,
            content: noteData.content,
            tags: noteData.tags,
            is_pinned: noteData.is_pinned,
          })
          .select()
          .single();
        if (inserted) {
          setNotes((prev) =>
            prev.map((n) =>
              n.id === newNote.id ? (inserted as PersonalNote) : n
            )
          );
        }
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    const client = getSupabaseClient();
    if (client && supabaseUser) {
      await client
        .from('personal_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', supabaseUser.id);
    }
  };

  const handleTogglePinNote = async (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;
    const nextPinned = !target.is_pinned;
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, is_pinned: nextPinned } : n))
    );
    const client = getSupabaseClient();
    if (client && supabaseUser) {
      await client
        .from('personal_notes')
        .update({ is_pinned: nextPinned })
        .eq('id', noteId)
        .eq('user_id', supabaseUser.id);
    }
  };

  const handleAddCourse = async (courseData: {
    name: string;
    code: string;
    type: CourseType;
    professor: string;
    term_info?: string;
    color: CourseColor;
    is_shared: boolean;
  }) => {
    if (!isAdmin) {
      alert('⚠️ 僅限班代 / 管理者可以新增或管理公版課程。');
      return;
    }
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      ...courseData,
      owner_id: currentUser.id,
      created_at: new Date().toISOString(),
    };
    setCourses((prev) => [...prev, newCourse]);

    // Automatically enroll creator if it's an elective
    if (courseData.type === 'elective') {
      setEnrollments((prev) => [
        ...prev,
        { user_id: currentUser.id, course_id: newCourse.id },
      ]);
    }

    const client = getSupabaseClient();
    if (client) {
      await client
        .from('courses')
        .upsert({
          id: newCourse.id,
          name: courseData.name,
          code: courseData.code,
          course_type: courseData.type,
          professor: courseData.professor,
          term_info: courseData.term_info || '',
          color: courseData.color,
          is_shared: courseData.is_shared,
          owner_id: supabaseUser?.id || currentUser.id,
        });

      if (courseData.type === 'elective' && supabaseUser) {
        await client.from('course_enrollments').upsert({
          user_id: supabaseUser.id,
          course_id: newCourse.id,
        });
      }
    }
  };

  const handleConfirmImportSchedule = async (
    importedCourses: Course[],
    importedEvents: AcademicEvent[]
  ) => {
    if (!isAdmin) {
      alert('⚠️ 僅限班代 / 管理者可以匯入台大官方課表。');
      return;
    }
    // Merge courses (avoid duplicate course names)
    setCourses((prev) => {
      const existingNames = new Set(prev.map((c) => c.name));
      const toAdd = importedCourses.filter((c) => !existingNames.has(c.name));
      return [...prev, ...toAdd];
    });

    // Merge events (avoid duplicate event IDs)
    setEvents((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const toAdd = importedEvents.filter((e) => !existingIds.has(e.id));
      return [...prev, ...toAdd];
    });

    // Auto-enroll user in newly imported courses
    setEnrollments((prev) => {
      const enrolledSet = new Set(
        prev
          .filter((e) => e.user_id === currentUser.id)
          .map((e) => e.course_id)
      );
      const newEnrolls: CourseEnrollment[] = [];
      importedCourses.forEach((c) => {
        if (!enrolledSet.has(c.id)) {
          newEnrolls.push({ user_id: currentUser.id, course_id: c.id });
        }
      });
      return [...prev, ...newEnrolls];
    });

    // Upsert to Supabase
    const client = getSupabaseClient();
    if (client) {
      try {
        const coursePayload = importedCourses.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          course_type: c.type,
          professor: c.professor,
          term_info: c.term_info || '',
          color: c.color,
          is_shared: true,
          owner_id: supabaseUser?.id || currentUser.id,
        }));
        await client.from('courses').upsert(coursePayload);

        const validCourseIds = new Set([
          ...courses.map((c) => c.id),
          ...importedCourses.map((c) => c.id),
        ]);

        const eventPayload = importedEvents.map((e) => ({
          id: e.id,
          course_id:
            e.course_id && validCourseIds.has(e.course_id) ? e.course_id : null,
          title: e.title,
          category: e.category,
          due_at: e.due_at,
          location: e.location || '',
          description: e.description || '',
          is_shared: true,
          is_pinned_countdown: e.is_pinned_countdown ?? false,
          owner_id: supabaseUser?.id || currentUser.id,
          owner_name: currentUser.name,
        }));
        await client.from('academic_events').upsert(eventPayload);
      } catch (err) {
        console.error('Failed to upsert imported schedule to Supabase:', err);
      }
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!isAdmin) {
      alert('⚠️ 僅限班代 / 管理者可以刪除公版課程。');
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setEnrollments((prev) => prev.filter((e) => e.course_id !== courseId));
    const client = getSupabaseClient();
    if (client) {
      await client.from('courses').delete().eq('id', courseId);
    }
  };

  const handleUpdateCourse = async (updatedCourse: Course) => {
    if (!isAdmin) {
      alert('⚠️ 僅限班代 / 管理者可以編輯公版課程。');
      return;
    }
    setCourses((prev) =>
      prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
    );
    const client = getSupabaseClient();
    if (client) {
      await client
        .from('courses')
        .upsert({
          id: updatedCourse.id,
          name: updatedCourse.name,
          code: updatedCourse.code,
          course_type: updatedCourse.type,
          professor: updatedCourse.professor,
          term_info: updatedCourse.term_info || '',
          color: updatedCourse.color,
          is_shared: updatedCourse.is_shared,
          owner_id: updatedCourse.owner_id || supabaseUser?.id || currentUser.id,
        });
    }
  };

  // Full manual sync of all local courses & events to Supabase cloud
  const handleSyncAllToCloud = async () => {
    if (!isAdmin) {
      alert('⚠️ 僅限班代 / 管理者可以發布課表至全班雲端。');
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      alert('請先在右上角確認 Supabase 連線設定！');
      return;
    }
    try {
      const coursePayload = courses.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        course_type: c.type,
        professor: c.professor,
        term_info: c.term_info || '',
        color: c.color,
        is_shared: c.is_shared ?? true,
        owner_id: c.owner_id || supabaseUser?.id || currentUser.id,
      }));
      await client.from('courses').upsert(coursePayload);

      const validCourseIds = new Set(courses.map((c) => c.id));
      const eventPayload = events
        .filter((e) => !e.course_id || validCourseIds.has(e.course_id))
        .map((e) => ({
          id: e.id,
          course_id:
            e.course_id && validCourseIds.has(e.course_id) ? e.course_id : null,
          title: e.title,
          category: e.category,
          due_at: e.due_at,
          location: e.location || '',
          description: e.description || '',
          is_shared: e.is_shared ?? true,
          is_pinned_countdown: e.is_pinned_countdown ?? false,
          owner_id: e.owner_id || supabaseUser?.id || currentUser.id,
          owner_name: e.owner_name || currentUser.name,
        }));
      await client.from('academic_events').upsert(eventPayload);

      alert('✅ 已將目前畫面上的所有課程與行程完整發布至 Supabase 雲端！\n現在用無痕視窗、手機或給同學看，都能即時看到最新課表了！');
      syncWithSupabase();
    } catch (err) {
      alert('同步至雲端失敗：' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const openQuickNoteForEvent = (evt: AcademicEvent) => {
    setQuickNoteTargetEvent(evt);
    setActiveTab('notes');
  };

  const handleClearAllSampleData = () => {
    if (
      window.confirm(
        '確定要清空所有範例事項與範例筆記嗎？\n這將為你清空預設的範例資料，方便你開始建立自己的 PMBA 課表與作業。'
      )
    ) {
      setEvents([]);
      setNotes([]);
      setProgressList([]);
      setEnrollments([]);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LS_EVENTS);
        window.localStorage.removeItem(LS_NOTES);
        window.localStorage.removeItem(LS_PROGRESS);
        window.localStorage.removeItem(LS_ENROLLMENTS);
      }
    }
  };

  const handleResetToDemoData = () => {
    if (window.confirm('確定要恢復預設的範例示範資料嗎？')) {
      setCourses(INITIAL_COURSES);
      setEnrollments(INITIAL_ENROLLMENTS);
      setEvents(createInitialEvents());
      setProgressList(INITIAL_PROGRESS);
      setNotes(INITIAL_NOTES);
      setGroupMembers(INITIAL_GROUP_MEMBERS);
      setCustomUserGroupName(null);
      setCustomUserName(null);
      setUserCourseGroups(DEMO_USERS[0].courseGroups || {});
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LS_COURSES);
        window.localStorage.removeItem(LS_ENROLLMENTS);
        window.localStorage.removeItem(LS_EVENTS);
        window.localStorage.removeItem(LS_PROGRESS);
        window.localStorage.removeItem(LS_NOTES);
        window.localStorage.removeItem(LS_GROUP_MEMBERS);
        window.localStorage.removeItem(LS_USER_GROUP);
        window.localStorage.removeItem(LS_USER_COURSE_GROUPS);
        window.localStorage.removeItem(LS_USER_NAME);
      }
    }
  };

  const handleUpdateMyGroupName = (newGroup: string) => {
    setCustomUserGroupName(newGroup);
  };

  const handleUpdateCourseGroup = (courseId: string, groupName: string) => {
    setUserCourseGroups((prev) => ({
      ...prev,
      [courseId]: groupName,
    }));
  };

  const handleUpdateAllCourseGroups = (
    mapping: Record<string, string>,
    fallbackGroup?: string
  ) => {
    setUserCourseGroups((prev) => ({
      ...prev,
      ...mapping,
    }));
    if (fallbackGroup) {
      setCustomUserGroupName(fallbackGroup);
    }
  };

  const handleUpdateUserName = (newName: string) => {
    setCustomUserName(newName);
  };

  const handleSupabaseSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setSupabaseUser(null);
  };

  const handleAddGroupMember = (newMemData: Omit<GroupMember, 'id'>) => {
    const newMem: GroupMember = {
      id: `mem-${Date.now()}`,
      ...newMemData,
    };
    setGroupMembers((prev) => [...prev, newMem]);
  };

  const handleBatchAddGroupMembers = (newMembers: Omit<GroupMember, 'id'>[]) => {
    const formatted = newMembers.map((m, idx) => ({
      id: `mem-${Date.now()}-${idx}`,
      ...m,
    }));
    setGroupMembers((prev) => [...prev, ...formatted]);
  };

  const handleClearAllGroupMembers = () => {
    setGroupMembers([]);
  };

  const handleDeleteGroupMember = (memberId: string) => {
    setGroupMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const openNewEventModal = (opts?: {
    courseId?: string;
    datePrefix?: string;
  }) => {
    setEditingEvent(null);
    setNewEventCourseId(opts?.courseId);
    setNewEventDatePrefix(opts?.datePrefix);
    setIsNewEventOpen(true);
  };

  const openEditEventModal = (evt: AcademicEvent) => {
    setEditingEvent(evt);
    setNewEventCourseId(evt.course_id);
    setNewEventDatePrefix(undefined);
    setIsNewEventOpen(true);
  };

  const supabaseConfig = getSupabaseConfig();

  return (
    <div className="min-h-screen flex flex-col pb-20 sm:pb-10">
      {/* Top Privacy & Account Switcher Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              必修大課共享 + 選修名單制 + 小組討論隔離 + 私密筆記加密
            </span>
            <span className="hidden lg:inline text-slate-400">
              必修課堂全班看，小組討論僅同組組員可見，個人進度與筆記 100% 獨立。
            </span>
          </div>

          {/* Top Authentication Status Banner */}
          {!supabaseUser ? (
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-xs">
                  ⚠️ 訪客預覽模式 (尚未登入)
                </span>
                <span className="text-slate-300 text-xs hidden md:inline">
                  您目前正在檢視全班公版課表與死線。登入個人 Email 即可啟用跨裝置打勾與專屬筆記！
                </span>
              </div>
              <button
                onClick={() => setIsCloudModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                點此登入 / 註冊個人帳號
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Supabase 雲端已連線 ({supabaseUser.email})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  PMBA Hub
                </h1>
                {supabaseUser ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {currentUser.name}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    訪客預覽
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                PMBA 課程・行事曆・作業考試倒數・個人私密雲端記事
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            {(
              [
                {
                  key: 'countdown',
                  label: '倒數與時程',
                  icon: AlarmClock,
                  badge: metrics.pendingCount,
                },
                {
                  key: 'calendar',
                  label: '行事曆視圖',
                  icon: Calendar,
                },
                {
                  key: 'notes',
                  label: '我的私密記事',
                  icon: Lock,
                  badge: myNotesCount,
                },
                {
                  key: 'courses',
                  label: 'PMBA 課程與選修',
                  icon: GraduationCap,
                  badge: visibleCourses.length,
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    active
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {'badge' in item && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                        active
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-200 bg-violet-50/90 hover:bg-violet-100 text-violet-800 text-xs font-bold shadow-sm transition"
              title="設定每門課獨立組別與組員名單"
            >
              <Users className="w-4 h-4 text-violet-600" />
              <span>小組設定</span>
              <span className="text-[10px] bg-violet-200/80 text-violet-950 px-1.5 py-0.2 rounded-full font-bold">
                {currentUser.groupName}
              </span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shadow-sm transition"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>台大官方課表</span>
              </button>
            )}

            {supabaseUser ? (
              <button
                onClick={() => setIsCloudModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-sm transition"
              >
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">雲端同步設定</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCloudModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>學員登入 / 註冊</span>
              </button>
            )}

            <button
              onClick={() => openNewEventModal()}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新增事項</span>
            </button>

            {/* Current Logged-in User Profile Indicator & Menu */}
            <UserProfileMenu
              currentUser={currentUser}
              courses={visibleCourses}
              demoUsers={DEMO_USERS}
              activeDemoIndex={demoUserIndex}
              onSwitchDemoUser={(idx) => {
                setCustomUserGroupName(null);
                setCustomUserName(null);
                setUserCourseGroups(DEMO_USERS[idx].courseGroups || {});
                setDemoUserIndex(idx);
              }}
              onUpdateName={handleUpdateUserName}
              onOpenGroupModal={() => setIsGroupModalOpen(true)}
              onOpenCloudModal={() => setIsCloudModalOpen(true)}
              supabaseUserEmail={supabaseUser?.email || null}
              onSupabaseSignOut={handleSupabaseSignOut}
            />
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Top 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => setActiveTab('countdown')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-300 text-left transition flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500">
                7 天內緊急死線
              </span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">
                {metrics.urgentCount}{' '}
                <span className="text-xs font-medium text-slate-400">項</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlarmClock className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('countdown')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 text-left transition flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500">
                我的待辦 / 已完成
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {metrics.pendingCount}{' '}
                <span className="text-xs font-medium text-emerald-600">
                  / {metrics.doneCount} 完成
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 text-left transition flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-600" />
                我的私密筆記
              </span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                {myNotesCount}{' '}
                <span className="text-xs font-medium text-slate-400">
                  篇 (僅自己可見)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 text-left transition flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500">
                我修讀的課程科目
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {
                  courses.filter(
                    (c) =>
                      c.type === 'required' ||
                      myEnrolledCourseIds.includes(c.id)
                  ).length
                }{' '}
                <span className="text-xs font-medium text-slate-400">
                  門 (共 {visibleCourses.length} 門開設)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Elective Course Filter Banner (for Countdown & Calendar views) */}
        {(activeTab === 'countdown' || activeTab === 'calendar') && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Filter className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {filterOnlyMyCourses
                    ? `🛡️ 已開啟修課過濾：只顯示「必修課」與「你已選修的課」`
                    : '🌐 檢視模式：顯示全班所有開設的選修事項'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {filterOnlyMyCourses
                    ? `你目前選修了 ${myEnrolledCourseIds.length} 門選修課。其他同學選修的作業與考試不會干擾你的看板。`
                    : '你正在檢視包含其他同學選修的所有時程事項。'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setFilterOnlyMyCourses(!filterOnlyMyCourses)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border shrink-0 ${
                filterOnlyMyCourses
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm'
              }`}
            >
              {filterOnlyMyCourses
                ? '查看全班所有選修時程'
                : '切回：只看我修讀的課'}
            </button>
          </div>
        )}

        {/* Active View Area */}
        {activeTab === 'countdown' && (
          <CountdownGrid
            events={visibleEvents}
            courses={visibleCourses}
            progressMap={myProgressMap}
            currentUserId={currentUser.id}
            onUpdateStatus={handleUpdateStatus}
            onUpdateMemo={handleUpdateMemo}
            onTogglePinCountdown={handleTogglePinCountdown}
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={openEditEventModal}
            onOpenQuickNote={openQuickNoteForEvent}
            onOpenNewEventModal={() => openNewEventModal()}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarBoard
            events={visibleEvents}
            courses={visibleCourses}
            progressMap={myProgressMap}
            onUpdateStatus={handleUpdateStatus}
            onOpenQuickNote={openQuickNoteForEvent}
            onOpenNewEventOnDate={(dateKey) =>
              openNewEventModal({ datePrefix: dateKey })
            }
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={openEditEventModal}
          />
        )}

        {activeTab === 'notes' && (
          <NotesVault
            notes={notes}
            courses={visibleCourses}
            events={visibleEvents}
            currentUser={currentUser}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            onTogglePinNote={handleTogglePinNote}
            initialEventForNewNote={quickNoteTargetEvent}
            onClearInitialEvent={() => setQuickNoteTargetEvent(null)}
          />
        )}

        {activeTab === 'courses' && (
          <CourseManager
            courses={visibleCourses}
            events={events}
            notes={notes}
            currentUserId={currentUser.id}
            enrolledCourseIds={myEnrolledCourseIds}
            enrollmentCounts={enrollmentCounts}
            onToggleEnrollCourse={handleToggleEnrollCourse}
            onAddCourse={handleAddCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            onOpenNewEventForCourse={(cId) =>
              openNewEventModal({ courseId: cId })
            }
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onSyncAllToCloud={isAdmin ? handleSyncAllToCloud : undefined}
            isAdmin={isAdmin}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (for iPhone / Android PWA feel) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 grid grid-cols-4 gap-1 shadow-lg">
        {(
          [
            { key: 'countdown', label: '倒數待辦', icon: AlarmClock },
            { key: 'calendar', label: '行事曆', icon: Calendar },
            { key: 'notes', label: '私密記事', icon: Lock },
            { key: 'courses', label: '課程選修', icon: GraduationCap },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold transition ${
                active ? 'text-indigo-600 bg-indigo-50/80' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <NewEventModal
        isOpen={isNewEventOpen}
        courses={visibleCourses}
        defaultCourseId={newEventCourseId}
        defaultDatePrefix={newEventDatePrefix}
        defaultGroupName={currentUser.groupName || '第 3 組'}
        courseGroups={currentUser.courseGroups || {}}
        editingEvent={editingEvent}
        onClose={() => {
          setIsNewEventOpen(false);
          setEditingEvent(null);
        }}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
      />

      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        supabaseUserEmail={supabaseUser?.email || null}
        onSupabaseConfigChanged={syncWithSupabase}
      />

      <ImportScheduleModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentUserId={currentUser.id}
        currentUserName={currentUser.name}
        onConfirmImport={handleConfirmImportSchedule}
      />

      <GroupSettingsModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        courses={visibleCourses}
        currentUserGroupName={currentUser.groupName}
        currentUserRole={currentUser.roleLabel}
        currentUserEmail={currentUser.email}
        adminEmails={adminEmails}
        adminPinCode={adminPinCode}
        onUpdateAdminEmails={setAdminEmails}
        onUpdateAdminPinCode={setAdminPinCode}
        userCourseGroups={currentUser.courseGroups || {}}
        courseGroupPasscodes={courseGroupPasscodes}
        isGroupLocked={isGroupLocked}
        onToggleGroupLock={(locked) => setIsGroupLocked(locked)}
        onUpdateCourseGroupPasscode={(courseId, passcode) => {
          setCourseGroupPasscodes((prev) => ({
            ...prev,
            [courseId]: passcode.trim(),
          }));
        }}
        onUpdateMyGroupName={handleUpdateMyGroupName}
        onUpdateCourseGroup={handleUpdateCourseGroup}
        onUpdateAllCourseGroups={handleUpdateAllCourseGroups}
        groupMembers={groupMembers}
        onAddGroupMember={handleAddGroupMember}
        onBatchAddGroupMembers={handleBatchAddGroupMembers}
        onDeleteGroupMember={handleDeleteGroupMember}
        onClearAllGroupMembers={handleClearAllGroupMembers}
      />
    </div>
  );
}
