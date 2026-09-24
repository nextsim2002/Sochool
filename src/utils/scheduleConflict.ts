import { CourseSectionSchedule, DayOfWeek } from '../types';

export interface SectionConflictDetail {
  indexA: number;
  indexB: number;
  nameA: string;
  nameB: string;
  day: DayOfWeek;
  dayLabel: string;
  timeA: string;
  timeB: string;
}

export interface SectionConflictResult {
  hasConflict: boolean;
  message: string;
  conflictingIndices: Set<number>;
  conflicts: SectionConflictDetail[];
}

export const DAY_LABELS_TH: Record<DayOfWeek, string> = {
  MON: 'วันจันทร์',
  TUE: 'วันอังคาร',
  WED: 'วันพุธ',
  THU: 'วันพฤหัสบดี',
  FRI: 'วันศุกร์',
  SAT: 'วันเสาร์',
  SUN: 'วันอาทิตย์'
};

export const DAY_COLORS: Record<DayOfWeek, { bg: string; text: string; border: string; badge: string; accent: string; dot: string }> = {
  MON: {
    bg: 'bg-amber-50',
    text: 'text-amber-950',
    border: 'border-amber-300',
    badge: 'bg-amber-400 text-amber-950',
    accent: 'text-amber-700',
    dot: 'bg-amber-500'
  },
  TUE: {
    bg: 'bg-pink-50',
    text: 'text-pink-950',
    border: 'border-pink-300',
    badge: 'bg-pink-400 text-pink-950',
    accent: 'text-pink-700',
    dot: 'bg-pink-500'
  },
  WED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-950',
    border: 'border-emerald-300',
    badge: 'bg-emerald-500 text-white',
    accent: 'text-emerald-700',
    dot: 'bg-emerald-500'
  },
  THU: {
    bg: 'bg-orange-50',
    text: 'text-orange-950',
    border: 'border-orange-300',
    badge: 'bg-orange-500 text-white',
    accent: 'text-orange-700',
    dot: 'bg-orange-500'
  },
  FRI: {
    bg: 'bg-sky-50',
    text: 'text-sky-950',
    border: 'border-sky-300',
    badge: 'bg-sky-500 text-white',
    accent: 'text-sky-700',
    dot: 'bg-sky-500'
  },
  SAT: {
    bg: 'bg-purple-50',
    text: 'text-purple-950',
    border: 'border-purple-300',
    badge: 'bg-purple-500 text-white',
    accent: 'text-purple-700',
    dot: 'bg-purple-500'
  },
  SUN: {
    bg: 'bg-rose-50',
    text: 'text-rose-950',
    border: 'border-rose-300',
    badge: 'bg-rose-500 text-white',
    accent: 'text-rose-700',
    dot: 'bg-rose-500'
  }
};

/**
 * Parses time string e.g. "09:30" or "9:30" into total minutes from midnight
 */
export const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim();
  const parts = cleaned.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

/**
 * Formats minutes from midnight into "HH:mm"
 */
export const formatMinutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Validates that sections within the same course do NOT have overlapping schedules.
 * Requirement: "ในวิชาเดียวกันนั้นน่ะ section ที่อยู่ในวิชานั้นอีกทีนึงห้ามมีเวลาเรียนวันเวลาเดียวกัน"
 */
export const checkSectionScheduleConflict = (sections: CourseSectionSchedule[]): SectionConflictResult => {
  const conflictingIndices = new Set<number>();
  const conflicts: SectionConflictDetail[] = [];

  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const secA = sections[i];
      const secB = sections[j];

      // Same day check
      if (secA.day && secB.day && secA.day === secB.day) {
        const startA = parseTimeToMinutes(secA.startTime);
        const endA = parseTimeToMinutes(secA.endTime) || (startA + 90);
        const startB = parseTimeToMinutes(secB.startTime);
        const endB = parseTimeToMinutes(secB.endTime) || (startB + 90);

        // Strict time overlap check: startA < endB && startB < endA
        if (startA < endB && startB < endA) {
          conflictingIndices.add(i);
          conflictingIndices.add(j);
          conflicts.push({
            indexA: i,
            indexB: j,
            nameA: secA.sectionName || `Section ${i + 1}`,
            nameB: secB.sectionName || `Section ${j + 1}`,
            day: secA.day,
            dayLabel: DAY_LABELS_TH[secA.day] || secA.day,
            timeA: `${secA.startTime} - ${secA.endTime}`,
            timeB: `${secB.startTime} - ${secB.endTime}`
          });
        }
      }
    }
  }

  const hasConflict = conflictingIndices.size > 0;
  let message = '';
  if (hasConflict) {
    const conflictDescriptions = conflicts.map(
      c => `"${c.nameA}" (${c.timeA}) ชนกับ "${c.nameB}" (${c.timeB}) ใน${c.dayLabel}`
    ).join(', ');
    message = `ข้อกำหนดของรายวิชา: Section ในวิชาเดียวกัน ห้ามมีเวลาเรียนวันและเวลาเดียวกัน ตรวจพบกลุ่มที่เวลาเรียนซ้อนทับกัน: ${conflictDescriptions} กรุณาปรับเปลี่ยนวันหรือเวลาเรียนให้ไม่ตรงกัน`;
  }

  return {
    hasConflict,
    message,
    conflictingIndices,
    conflicts
  };
};

/**
 * Recommends the next non-conflicting default schedule slot when adding a section
 */
export const getNextNonConflictingSchedule = (
  existingSections: CourseSectionSchedule[],
  nextSecNumber: number
): CourseSectionSchedule => {
  const candidateSlots: Array<{ day: DayOfWeek; startTime: string; endTime: string }> = [
    { day: 'MON', startTime: '09:00', endTime: '10:30' },
    { day: 'MON', startTime: '13:00', endTime: '14:30' },
    { day: 'TUE', startTime: '09:00', endTime: '10:30' },
    { day: 'TUE', startTime: '13:00', endTime: '14:30' },
    { day: 'WED', startTime: '09:00', endTime: '10:30' },
    { day: 'WED', startTime: '13:00', endTime: '14:30' },
    { day: 'THU', startTime: '09:00', endTime: '10:30' },
    { day: 'THU', startTime: '13:00', endTime: '14:30' },
    { day: 'FRI', startTime: '09:00', endTime: '10:30' },
    { day: 'FRI', startTime: '13:00', endTime: '14:30' },
    { day: 'SAT', startTime: '09:00', endTime: '12:00' }
  ];

  for (const slot of candidateSlots) {
    const tempSection: CourseSectionSchedule = {
      sectionName: `Section ${nextSecNumber}`,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      displayTime: `${slot.startTime} - ${slot.endTime}`,
      location: existingSections[0]?.location || 'Sci-Tech Hall 402'
    };
    const testList = [...existingSections, tempSection];
    const testResult = checkSectionScheduleConflict(testList);
    if (!testResult.hasConflict) {
      return tempSection;
    }
  }

  return {
    sectionName: `Section ${nextSecNumber}`,
    day: 'FRI',
    startTime: '15:00',
    endTime: '16:30',
    displayTime: '15:00 - 16:30',
    location: existingSections[0]?.location || 'Sci-Tech Hall 402'
  };
};
