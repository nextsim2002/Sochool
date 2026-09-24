import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  AlertCircle, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  RotateCcw, 
  Plus, 
  Users, 
  Printer, 
  CheckCircle2, 
  Info, 
  Coffee, 
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ScheduleEvent, UserProfile, DayOfWeek } from '../types';
import { PersonalEventModal } from './schedule/PersonalEventModal';
import { UserProfileModal } from './profile/UserProfileModal';
import { DAY_LABELS_TH, DAY_COLORS, parseTimeToMinutes } from '../utils/scheduleConflict';

interface ScheduleViewProps {
  onNavigateToCourse?: (courseId: string) => void;
}

interface PeriodSlot {
  periodNumber: number;
  label: string;
  isLunch?: boolean;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "09:00"
  startMinutes: number;
  endMinutes: number;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigateToCourse }) => {
  const { user } = useAuth();
  const { scheduleEvents, courses, setActiveCourseId, addScheduleEvent, allUsers } = useData();
  const isInstructor = user?.role === 'instructor';
  const userIdentifier = user?.uid || user?.name || (isInstructor ? 'faculty_user' : 'student_user');

  const [showCancelledSessions, setShowCancelledSessions] = useState(true);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [showWeekend, setShowWeekend] = useState<boolean>(false);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserProfile | null>(null);

  // Base Monday: October 23, 2023
  const baseMonday = useMemo(() => new Date(2023, 9, 23), []);

  // Compute Monday for the selected week
  const currentMonday = useMemo(() => {
    const d = new Date(baseMonday);
    d.setDate(baseMonday.getDate() + (weekOffset * 7));
    return d;
  }, [baseMonday, weekOffset]);

  // Formatted week header string (e.g. "สัปดาห์ที่ 23 - 29 ต.ค. 2023")
  const formattedWeekString = useMemo(() => {
    const startD = currentMonday.getDate();
    const endD = new Date(currentMonday);
    endD.setDate(startD + 6);
    const monthNamesTh = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return `สัปดาห์ ${startD} ${monthNamesTh[currentMonday.getMonth()]} - ${endD.getDate()} ${monthNamesTh[endD.getMonth()]} ${endD.getFullYear()}`;
  }, [currentMonday]);

  // Helper to find associated course for an event
  const getEventCourse = (event: ScheduleEvent) => {
    return courses.find(c => 
      (event.courseId && c.id === event.courseId) || 
      c.code.toUpperCase() === event.code.toUpperCase()
    );
  };

  // Check if course belongs to instructor
  const isInstructorCourse = (course: any) => {
    if (!course) return false;
    return Boolean(
      (course.instructorId && user?.uid && course.instructorId === user.uid) ||
      (course.instructor && user?.name && course.instructor.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
      (course.coInstructors && user?.uid && course.coInstructors.includes(user.uid)) ||
      (course.coInstructors && user?.name && course.coInstructors.includes(user.name)) ||
      (!user && course.instructor) // guest fallback
    );
  };

  // Check if student joined the course
  const isStudentEnrolledInCourse = (course: any) => {
    if (!course) return false;
    return Boolean(
      (course.enrolledStudents && course.enrolledStudents.includes(userIdentifier)) ||
      (user?.uid && course.enrolledStudents?.includes(user.uid)) ||
      (user?.name && course.enrolledStudents?.includes(user.name))
    );
  };

  // Role & Privacy visibility filter for each schedule event
  const isEventVisible = (event: ScheduleEvent) => {
    // 1. Personal / Custom Schedule Event
    if (event.isPersonal) {
      if (event.createdBy === user?.uid || event.createdBy === userIdentifier) {
        return true; // Creator always sees their own events
      }
      if (event.visibility === 'shared_friends' && event.sharedWithUserIds && user?.uid) {
        return event.sharedWithUserIds.includes(user.uid);
      }
      return false;
    }

    // 2. Regular Academic Course Event
    const course = getEventCourse(event);
    if (course) {
      if (isInstructor) {
        // Instructor view: ONLY show events for courses they created / teach
        return isInstructorCourse(course);
      } else {
        // Student view: ONLY show events for courses they have joined
        const isEnrolled = isStudentEnrolledInCourse(course);
        if (!isEnrolled) return false;

        // If enrolled and student has a specific section, match section
        const studentSec = (user?.uid && course.enrolledStudentSections?.[user.uid]) ||
                           (user?.name && course.enrolledStudentSections?.[user.name]) ||
                           course.selectedSection;
        if (studentSec && event.section && event.section !== 'All Sections') {
          return event.section === studentSec;
        }
        return true;
      }
    }

    // General fallback
    if (event.createdBy) {
      return event.createdBy === userIdentifier || (user?.uid && event.createdBy === user.uid);
    }

    return true;
  };

  // Filtered events
  const displayEvents = useMemo(() => {
    return scheduleEvents.filter(isEventVisible);
  }, [scheduleEvents, user, isInstructor, courses]);

  // Section filter options
  const availableSections = useMemo(() => {
    const secSet = new Set<string>();
    displayEvents.forEach(e => {
      if (e.section && e.section !== 'All Sections') {
        secSet.add(e.section);
      }
    });
    return Array.from(secSet).sort();
  }, [displayEvents]);

  // Filter by section if selected
  const filteredEvents = useMemo(() => {
    let list = displayEvents;
    if (selectedSectionFilter !== 'ALL') {
      list = list.filter(e => e.section === selectedSectionFilter || !e.section);
    }
    if (!showCancelledSessions) {
      list = list.filter(e => !e.isCancelled);
    }
    return list;
  }, [displayEvents, selectedSectionFilter, showCancelledSessions]);

  const cancelledEvents = displayEvents.filter(e => e.isCancelled);

  // Relevant courses list for the current user
  const myRelevantCourses = courses.filter(c => 
    isInstructor ? isInstructorCourse(c) : isStudentEnrolledInCourse(c)
  );

  // Auto-detect if weekend has events
  const hasWeekendEvents = useMemo(() => {
    return displayEvents.some(e => e.day === 'SAT' || e.day === 'SUN');
  }, [displayEvents]);

  // Active days list (First column)
  const activeDaysList: Array<{ day: DayOfWeek; offset: number }> = useMemo(() => {
    const shouldIncludeWeekend = showWeekend || hasWeekendEvents;
    const days: Array<{ day: DayOfWeek; offset: number }> = [
      { day: 'MON', offset: 0 },
      { day: 'TUE', offset: 1 },
      { day: 'WED', offset: 2 },
      { day: 'THU', offset: 3 },
      { day: 'FRI', offset: 4 }
    ];
    if (shouldIncludeWeekend) {
      days.push({ day: 'SAT', offset: 5 });
      days.push({ day: 'SUN', offset: 6 });
    }
    return days;
  }, [showWeekend, hasWeekendEvents]);

  // Compute actual date for each day row
  const dayRows = useMemo(() => {
    return activeDaysList.map(({ day, offset }) => {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + offset);
      const isToday = weekOffset === 0 && offset === 2; // Wednesday Oct 25 is today on base week
      return {
        day,
        dateNumber: d.getDate(),
        monthLabel: d.toLocaleDateString('th-TH', { month: 'short' }),
        fullDate: d,
        isToday,
        colorTheme: DAY_COLORS[day]
      };
    });
  }, [activeDaysList, currentMonday, weekOffset]);

  // Define Top Row Periods: 08:00 to 19:00 (11 periods)
  // Determine if any event starts earlier than 08:00 or ends after 19:00
  const timeBounds = useMemo(() => {
    let minHour = 8;
    let maxHour = 19;
    displayEvents.forEach(e => {
      if (e.startTime) {
        const startH = Math.floor(parseTimeToMinutes(e.startTime) / 60);
        if (startH < minHour && startH >= 6) minHour = startH;
      }
      if (e.endTime) {
        const endH = Math.ceil(parseTimeToMinutes(e.endTime) / 60);
        if (endH > maxHour && endH <= 22) maxHour = endH;
      }
    });
    return { minHour, maxHour };
  }, [displayEvents]);

  // Generate periods for the top row
  const periods: PeriodSlot[] = useMemo(() => {
    const slots: PeriodSlot[] = [];
    let periodIdx = 1;

    for (let h = timeBounds.minHour; h < timeBounds.maxHour; h++) {
      const startStr = `${String(h).padStart(2, '0')}:00`;
      const endStr = `${String(h + 1).padStart(2, '0')}:00`;
      const isLunch = h === 12; // 12:00 - 13:00 is standard lunch break

      slots.push({
        periodNumber: isLunch ? 0 : periodIdx,
        label: isLunch ? 'พักกลางวัน' : `คาบ ${periodIdx}`,
        isLunch,
        startTime: startStr,
        endTime: endStr,
        startMinutes: h * 60,
        endMinutes: (h + 1) * 60
      });

      if (!isLunch) {
        periodIdx++;
      }
    }
    return slots;
  }, [timeBounds]);

  const baseMinutes = timeBounds.minHour * 60;
  const totalMinutes = (timeBounds.maxHour - timeBounds.minHour) * 60;

  // Calculate total weekly study hours
  const totalWeeklyHours = useMemo(() => {
    let totalMins = 0;
    filteredEvents.forEach(e => {
      if (!e.isCancelled) {
        const s = parseTimeToMinutes(e.startTime);
        const end = parseTimeToMinutes(e.endTime) || (s + 90);
        if (end > s) totalMins += (end - s);
      }
    });
    return (totalMins / 60).toFixed(1);
  }, [filteredEvents]);

  const handleOpenCourse = (courseId: string) => {
    if (onNavigateToCourse) {
      onNavigateToCourse(courseId);
    } else {
      setActiveCourseId(courseId);
    }
  };

  const handlePrintTimetable = () => {
    window.print();
  };

  // Card theme helper
  const getEventCardStyle = (theme?: ScheduleEvent['colorTheme'], isCancelled?: boolean) => {
    if (isCancelled) {
      return {
        card: 'bg-red-50 hover:bg-red-100 border-red-300 ring-2 ring-red-400/50 text-red-950 shadow-sm',
        badge: 'bg-red-600 text-white font-black',
        accent: 'text-red-700',
        strip: 'bg-red-500'
      };
    }
    switch (theme) {
      case 'emerald':
      case 'teal':
        return {
          card: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950 shadow-2xs',
          badge: 'bg-emerald-600 text-white font-bold',
          accent: 'text-emerald-700',
          strip: 'bg-emerald-500'
        };
      case 'purple':
        return {
          card: 'bg-purple-50 hover:bg-purple-100/80 border-purple-200 text-purple-950 shadow-2xs',
          badge: 'bg-purple-600 text-white font-bold',
          accent: 'text-purple-700',
          strip: 'bg-purple-500'
        };
      case 'peach':
      case 'amber':
        return {
          card: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-950 shadow-2xs',
          badge: 'bg-amber-500 text-white font-bold',
          accent: 'text-amber-800',
          strip: 'bg-amber-500'
        };
      case 'rose':
        return {
          card: 'bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-950 shadow-2xs',
          badge: 'bg-rose-600 text-white font-bold',
          accent: 'text-rose-700',
          strip: 'bg-rose-500'
        };
      case 'blue':
      default:
        return {
          card: 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-200 text-indigo-950 shadow-2xs',
          badge: 'bg-indigo-600 text-white font-bold',
          accent: 'text-indigo-700',
          strip: 'bg-indigo-500'
        };
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F8FAFC] p-3 sm:p-6 lg:p-8 flex flex-col gap-5 max-w-[1550px] mx-auto print:bg-white print:p-2">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & CONTROLS */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-indigo-600" />
              <span>ตารางเรียน / ตารางสอน</span>
            </h1>
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs ${
              isInstructor 
                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' 
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {isInstructor ? <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> : <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{isInstructor ? 'ตารางสอนเฉพาะวิชาของคุณ' : 'ตารางเรียนเฉพาะวิชาที่เข้าร่วม'}</span>
            </span>
          </div>

          {/* Week Selector and Navigation */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button 
                onClick={() => setWeekOffset(prev => prev - 1)}
                title="สัปดาห์ก่อนหน้า (Previous Week)"
                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setWeekOffset(0)}
                title="กลับสัปดาห์นี้"
                className="px-2.5 py-1 text-xs font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-1.5 cursor-pointer"
              >
                <span>{formattedWeekString}</span>
                {weekOffset === 0 && (
                  <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded">
                    สัปดาห์นี้
                  </span>
                )}
              </button>
              <button 
                onClick={() => setWeekOffset(prev => prev + 1)}
                title="สัปดาห์ถัดไป (Next Week)"
                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>กลับสัปดาห์นี้</span>
              </button>
            )}

            {/* 5-day / 7-day Toggle */}
            <button
              onClick={() => setShowWeekend(prev => !prev)}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showWeekend || hasWeekendEvents
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{showWeekend || hasWeekendEvents ? 'แสดง 7 วัน (จันทร์ - อาทิตย์)' : 'แสดง 5 วัน (จันทร์ - ศุกร์)'}</span>
            </button>

            {/* Filter by Section if multiple available */}
            {availableSections.length > 1 && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <select
                  value={selectedSectionFilter}
                  onChange={(e) => setSelectedSectionFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">ทุก Section ({availableSections.length})</option>
                  {availableSections.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right Header Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-end">
          <button
            onClick={handlePrintTimetable}
            title="พิมพ์หรือบันทึกตารางเรียนเป็น PDF"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-2xl font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>พิมพ์ตารางเรียน</span>
          </button>

          <button
            onClick={() => setIsPersonalModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-200 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ เพิ่มนัดหมาย / เตือนความจำ</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. STATS & INFO BAR */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold">{isInstructor ? 'วิชาที่สอน' : 'วิชาที่ลงทะเบียน'}</div>
            <div className="text-base font-black text-slate-900">{myRelevantCourses.length} วิชา</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold">ชั่วโมงเรียน / สัปดาห์</div>
            <div className="text-base font-black text-emerald-700">{totalWeeklyHours} ชม.</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold">คาบเรียนทั้งหมด</div>
            <div className="text-base font-black text-purple-700">{filteredEvents.length} คาบ/สัปดาห์</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              cancelledEvents.length > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">คลาสที่ยกเลิก</div>
              <div className={`text-base font-black ${cancelledEvents.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {cancelledEvents.length} คลาส
              </div>
            </div>
          </div>
          {cancelledEvents.length > 0 && (
            <label className="text-[11px] font-bold text-red-800 flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showCancelledSessions}
                onChange={(e) => setShowCancelledSessions(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span>แสดง</span>
            </label>
          )}
        </div>
      </div>

      {/* Cancellation Banner Alert */}
      {cancelledEvents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-900 shadow-2xs print:hidden">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold block text-red-950">
                แจ้งเตือน: มีการงดการเรียนการสอน (ยกคลาส) ในสัปดาห์นี้ {cancelledEvents.length} คลาส
              </span>
              <span className="text-red-800">
                {cancelledEvents.map(e => `${e.code} (${DAY_LABELS_TH[e.day] || e.day}): ${e.cancellationReason || 'ยกเลิกคลาส'}`).join(' • ')}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-200/80 text-red-900 shrink-0 self-end sm:self-auto">
            แสดงแถบสีแดงในตาราง
          </span>
        </div>
      )}

      {/* Empty State Banner if no events found */}
      {displayEvents.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-3.5 shadow-2xs print:hidden">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isInstructor ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {isInstructor ? <BookOpen className="w-7 h-7" /> : <GraduationCap className="w-7 h-7" />}
          </div>
          <h3 className="font-bold text-base text-slate-800">
            {isInstructor 
              ? 'ยังไม่มีตารางสอนในสัปดาห์นี้' 
              : 'ยังไม่มีตารางเรียนในสัปดาห์นี้'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            {isInstructor 
              ? 'คุณจะเห็นเฉพาะตารางสอนของรายวิชาที่คุณสร้างหรือร่วมสอนเท่านั้น' 
              : 'ระบบจะแสดงเฉพาะตารางเรียนของวิชาที่คุณกดเข้าร่วมแล้วเท่านั้น (หากยังไม่เข้าร่วมสามารถไปที่หน้ารายวิชาเพื่อเข้าร่วมคลาส)'}
          </p>
          <div className="flex flex-wrap gap-2.5 mt-2">
            <button
              onClick={() => handleOpenCourse(courses[0]?.id || '')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isInstructor ? 'ไปจัดการรายวิชา' : 'ไปเลือกเข้าร่วมคลาสเรียน'}</span>
            </button>
            <button
              onClick={() => setIsPersonalModalOpen(true)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มนัดหมายส่วนตัว</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN ACADEMIC TIMETABLE GRID (ตารางเรียน) */}
      {/* Requirement: */}
      {/* - แถวบนสุดเป็นเวลาว่าคาบไหนถึงกี่โมง (Periods & Time Slots) */}
      {/* - คอลัมน์หน้าสุดให้ใส่เป็นวัน (Days MON - SUN) */}
      {/* - ใช้ระบบดึงเวลามาตั้งเหมือนเดิม */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Printable Header Info */}
        <div className="hidden print:block p-4 border-b border-slate-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">ตารางเรียน / ตารางสอน (Class Timetable)</h1>
              <p className="text-xs text-slate-600">
                {user?.name || 'Academic Student'} • {isInstructor ? 'อาจารย์ผู้สอน' : 'นักศึกษา'} • {formattedWeekString}
              </p>
            </div>
            <div className="text-xs font-bold text-slate-500">
              Sochool Academic Hub
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1100px] select-none">
            {/* ---------------------------------------------------- */}
            {/* ROW 1: แถวบนสุด - แสดงคาบเรียนและช่วงเวลา (TOP ROW) */}
            {/* ---------------------------------------------------- */}
            <div 
              className="grid border-b border-slate-200 bg-slate-50/90 sticky top-0 z-20"
              style={{
                gridTemplateColumns: `160px repeat(${periods.length}, minmax(80px, 1fr))`
              }}
            >
              {/* Cell 0 (หน้าสุดของแถวบน): วัน \ คาบ & เวลา */}
              <div className="p-3 border-r border-slate-200 bg-slate-100/90 flex flex-col items-center justify-center text-center font-bold text-slate-700">
                <div className="flex items-center gap-1 text-[11px] font-black uppercase text-indigo-900 tracking-wider">
                  <span>วัน</span>
                  <span className="text-slate-400">\</span>
                  <span>คาบ & เวลา</span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  ({periods.length} ช่วงเวลา)
                </span>
              </div>

              {/* Columns 1..N: แต่ละคาบว่ากี่โมงถึงกี่โมง */}
              {periods.map((period, pIdx) => (
                <div
                  key={pIdx}
                  className={`py-3 px-1.5 text-center border-r border-slate-200 last:border-r-0 flex flex-col items-center justify-center transition-colors ${
                    period.isLunch 
                      ? 'bg-amber-50/60 border-amber-200/50' 
                      : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {period.isLunch && <Coffee className="w-3 h-3 text-amber-600" />}
                    <span className={`text-[11px] font-black uppercase tracking-wider ${
                      period.isLunch ? 'text-amber-800' : 'text-indigo-800'
                    }`}>
                      {period.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 mt-0.5 whitespace-nowrap">
                    {period.startTime} - {period.endTime}
                  </span>
                </div>
              ))}
            </div>

            {/* ---------------------------------------------------- */}
            {/* ROWS 2..N: แต่ละวันในสัปดาห์ (DAYS MON - SUN) */}
            {/* คอลัมน์หน้าสุดใส่เป็นวัน (First column is Day) */}
            {/* ---------------------------------------------------- */}
            <div className="divide-y divide-slate-100 relative">
              {dayRows.map((dayRow) => {
                const dayEvents = filteredEvents.filter(e => e.day === dayRow.day);

                return (
                  <div
                    key={dayRow.day}
                    className={`grid min-h-[110px] transition-colors relative ${
                      dayRow.isToday ? 'bg-indigo-50/15' : 'hover:bg-slate-50/40'
                    }`}
                    style={{
                      gridTemplateColumns: `160px repeat(${periods.length}, minmax(80px, 1fr))`
                    }}
                  >
                    {/* คอลัมน์หน้าสุด: แสดงวัน (Day Column Header) */}
                    <div 
                      className={`p-3 border-r border-slate-200 flex flex-col justify-center gap-1.5 select-none ${dayRow.colorTheme.bg} border-l-4 ${dayRow.colorTheme.border}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${dayRow.colorTheme.badge}`}>
                          {dayRow.day}
                        </span>
                        {dayRow.isToday && (
                          <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            <span>วันนี้</span>
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="font-black text-xs text-slate-900 block leading-tight">
                          {DAY_LABELS_TH[dayRow.day]}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          {dayRow.dateNumber} {dayRow.monthLabel}
                        </span>
                      </div>

                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <span>{dayEvents.length > 0 ? `${dayEvents.length} คาบ` : 'ไม่มีคลาสเรียน'}</span>
                      </div>
                    </div>

                    {/* ช่องตารางของวันนั้นๆ (11 Columns background grid lines) */}
                    <div 
                      className="col-span-11 relative p-1.5 min-h-[110px]"
                      style={{
                        gridColumn: `2 / span ${periods.length}`
                      }}
                    >
                      {/* Background Vertical Grid Lines for periods */}
                      <div 
                        className="absolute inset-0 grid pointer-events-none"
                        style={{
                          gridTemplateColumns: `repeat(${periods.length}, 1fr)`
                        }}
                      >
                        {periods.map((p, idx) => (
                          <div 
                            key={idx} 
                            className={`border-r border-slate-100 last:border-r-0 ${
                              p.isLunch ? 'bg-amber-50/20' : ''
                            }`}
                          >
                            {p.isLunch && (
                              <div className="h-full flex items-center justify-center opacity-10">
                                <Coffee className="w-6 h-6 text-amber-800" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Event Cards for this day placed horizontally based on start/end time */}
                      {dayEvents.map((event) => {
                        const style = getEventCardStyle(event.colorTheme, event.isCancelled);
                        const matchedCourse = getEventCourse(event);

                        // Calculate horizontal position
                        const startMin = parseTimeToMinutes(event.startTime);
                        const endMin = parseTimeToMinutes(event.endTime) || (startMin + 90);
                        
                        // Percentage calculation within the table's total time span
                        const clampedStart = Math.max(baseMinutes, startMin);
                        const clampedEnd = Math.min(baseMinutes + totalMinutes, endMin);
                        
                        const leftPercent = Math.max(0, ((clampedStart - baseMinutes) / totalMinutes) * 100);
                        const durationMins = Math.max(45, clampedEnd - clampedStart);
                        const widthPercent = Math.min(100 - leftPercent, (durationMins / totalMinutes) * 100);

                        return (
                          <div
                            key={event.id}
                            onClick={() => {
                              if (matchedCourse) {
                                handleOpenCourse(matchedCourse.id);
                              } else if (event.isPersonal) {
                                setIsPersonalModalOpen(true);
                              }
                            }}
                            title={
                              matchedCourse 
                                ? `${event.code}: ${matchedCourse.title}\nเวลา: ${event.startTime} - ${event.endTime}\nห้อง: ${event.location}\nคลิกเพื่อเปิดดูวิชา`
                                : `${event.title} (${event.startTime} - ${event.endTime})`
                            }
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              minWidth: '120px'
                            }}
                            className={`absolute top-2 bottom-2 rounded-2xl border ${style.card} p-2.5 transition-all flex flex-col justify-between gap-1 shadow-2xs group cursor-pointer hover:shadow-lg hover:z-30 hover:scale-[1.01] active:scale-[0.99] overflow-hidden`}
                          >
                            {/* Left accent color strip */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.strip}`} />

                            <div className="pl-1.5 flex flex-col gap-0.5">
                              {/* Header: Code & Section badge */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md truncate ${style.badge}`}>
                                    {event.code || 'CLASS'}
                                  </span>
                                  {event.section && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white/80 border border-black/5 text-slate-700 truncate">
                                      {event.section}
                                    </span>
                                  )}
                                </div>

                                {event.isCancelled ? (
                                  <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.2 rounded shrink-0">
                                    งดสอน
                                  </span>
                                ) : event.isPersonal ? (
                                  <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1 py-0.2 rounded shrink-0">
                                    ส่วนตัว
                                  </span>
                                ) : null}
                              </div>

                              {/* Title */}
                              <h4 className="font-extrabold text-xs text-slate-900 truncate leading-tight mt-0.5">
                                {event.title}
                              </h4>

                              {/* Cancellation reason if cancelled */}
                              {event.isCancelled && (
                                <p className="text-[10px] font-bold text-red-700 truncate">
                                  ❌ {event.cancellationReason || 'งดการเรียนการสอน'}
                                </p>
                              )}
                            </div>

                            {/* Footer: Time & Location */}
                            <div className="pl-1.5 flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-600 border-t border-black/5 pt-1 mt-auto">
                              <span className="flex items-center gap-1 font-bold text-slate-700 whitespace-nowrap">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{event.startTime} - {event.endTime}</span>
                              </span>
                              <span className="flex items-center gap-0.5 truncate text-slate-500" title={event.location}>
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Empty indicator for empty day row */}
                      {dayEvents.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-medium">
                          <span className="italic">ไม่มีคาบเรียนในวันนี้</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timetable Legend Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-700">สัญลักษณ์สี:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-indigo-500"></span>
              <span>วิชาบรรยาย (Lecture)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
              <span>ปฏิบัติการ / แล็บ (Lab)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-500"></span>
              <span>นัดหมายส่วนตัว</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-red-500"></span>
              <span>งดคลาส / ยกคลาส</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-400"></span>
              <span>พักกลางวัน (12:00 - 13:00)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            💡 คลิกที่บล็อกวิชาในตารางเพื่อเปิดดูหน้ารายวิชานั้นๆ
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MODALS */}
      {/* ======================================================== */}
      <PersonalEventModal
        isOpen={isPersonalModalOpen}
        onClose={() => setIsPersonalModalOpen(false)}
        onSaveEvent={addScheduleEvent}
      />

      {selectedProfileUser && (
        <UserProfileModal
          isOpen={Boolean(selectedProfileUser)}
          onClose={() => setSelectedProfileUser(null)}
          targetUser={selectedProfileUser}
          onNavigateToCourse={onNavigateToCourse}
        />
      )}
    </div>
  );
};
