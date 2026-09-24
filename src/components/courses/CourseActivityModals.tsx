import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Trash2, AlertCircle, Check, FileText } from 'lucide-react';
import { Assignment, Course } from '../../types';

// ==========================================
// 1. ADD / EDIT ASSIGNMENT MODAL
// ==========================================
interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  editingAssignment?: Assignment | null;
  onSave: (assignData: Omit<Assignment, 'id'>, editId?: string) => Promise<void>;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  course,
  editingAssignment,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [module, setModule] = useState('Module 1');
  const [points, setPoints] = useState(100);
  const [dueDate, setDueDate] = useState('Next Friday, 11:59 PM');
  const [instructions, setInstructions] = useState('');
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [targetSecId, setTargetSecId] = useState('ALL_SEC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingAssignment) {
      setTitle(editingAssignment.title || '');
      setModule(editingAssignment.module || 'Module 1');
      setPoints(editingAssignment.points || 100);
      setDueDate(editingAssignment.dueDate || '');
      setInstructions((editingAssignment.instructions || []).join('\n'));
      setAllowResubmission(editingAssignment.allowResubmission !== false);
      setTargetSecId(editingAssignment.targetSecId || 'ALL_SEC');
    } else {
      setTitle('');
      setModule('Module 1');
      setPoints(100);
      setDueDate('Next Friday, 11:59 PM');
      setInstructions('');
      setAllowResubmission(true);
      setTargetSecId('ALL_SEC');
    }
  }, [editingAssignment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        courseId: course.id,
        courseName: course.title,
        title: title.trim(),
        module: module.trim(),
        points: Number(points) || 100,
        dueDate: dueDate.trim(),
        targetSecId: targetSecId || 'ALL_SEC',
        status: editingAssignment?.status || 'Not Submitted',
        instructions: instructions.split('\n').filter(Boolean),
        allowResubmission: allowResubmission
      }, editingAssignment?.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {editingAssignment ? 'แก้ไขการบ้าน (Edit Assignment)' : 'เพิ่มการบ้านใหม่ (Add Assignment)'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">ชื่องาน (Title) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Lab Report 1: Graph Algorithms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">คะแนนเต็ม</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">กำหนดส่ง</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">คำสั่งและรายละเอียด</label>
            <textarea
              rows={3}
              placeholder="ใส่คำสั่งหรือขั้นตอนการส่งงาน..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* Target Section (SEC) Selection - Requirement 8 */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              กลุ่มเรียนเป้าหมาย (Target Section / SEC) *
            </label>
            <select
              value={targetSecId}
              onChange={(e) => setTargetSecId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL_SEC">ทุกกลุ่มเรียน (ทุก SEC ในวิชา - ALL_SEC)</option>
              {(course.sections && course.sections.length > 0 ? course.sections : ['SEC 1', 'SEC 2', 'SEC 3']).map((sec) => (
                <option key={sec} value={sec}>เฉพาะกลุ่ม {sec}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {targetSecId === 'ALL_SEC' 
                ? 'นักศึกษาทุกกลุ่มเรียน (SEC 1, SEC 2, ...) จะเห็นและส่งงานชิ้นนี้ได้'
                : `เฉพาะนักศึกษาในกลุ่ม ${targetSecId} เท่านั้นที่จะเห็นและส่งงานได้ (กลุ่มอื่นจะไม่เห็น)`}
            </p>
          </div>

          {/* Resubmission Permission Setting */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">สิทธิ์การแก้ไข/ส่งงานใหม่</p>
              <p className="text-[11px] text-slate-500">
                {allowResubmission ? 'เปิดให้นักศึกษาแก้ไข/ส่งใหม่ได้' : 'ส่งได้ครั้งเดียว (ล็อกไม่อนุญาตให้แก้ไข)'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allowResubmission}
                onChange={(e) => setAllowResubmission(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              {isSubmitting ? 'กำลังบันทึก...' : (editingAssignment ? 'บันทึกแก้ไข' : 'บันทึกการบ้าน')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. CANCEL CLASS SESSION MODAL (CALENDAR-BASED)
// ==========================================
interface CancelClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onCancelSession: (
    courseId: string, 
    day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI', 
    sectionName: string, 
    reason: string, 
    dateNote: string
  ) => Promise<void>;
}

export const CancelClassModal: React.FC<CancelClassModalProps> = ({
  isOpen,
  onClose,
  course,
  onCancelSession
}) => {
  const availableSections = course.sections && course.sections.length > 0 
    ? course.sections 
    : ['All Sections', 'Section 1'];

  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<'MON' | 'TUE' | 'WED' | 'THU' | 'FRI'>('MON');
  const [reason, setReason] = useState('อาจารย์ติดภารกิจประชุมวิชาการ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(2023, 9, 1)); // October 2023 base

  // Determine teaching days for this course and selected section
  const sectionSchedules = course.sectionSchedules;
  const activeTeachingDays = React.useMemo(() => {
    let schedules = sectionSchedules || [];
    if (selectedSection !== 'All Sections') {
      schedules = schedules.filter(s => s.sectionName === selectedSection);
    }
    if (schedules.length === 0) {
      // Default to Monday and Wednesday if not specified
      return ['MON', 'WED'] as ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI')[];
    }
    return schedules.map(s => s.day);
  }, [sectionSchedules, selectedSection]);

  const activeTeachingDaysKey = activeTeachingDays.join(',');

  const dayOfWeekIndexToKey: Record<number, 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI'> = {
    1: 'MON',
    2: 'TUE',
    3: 'WED',
    4: 'THU',
    5: 'FRI'
  };

  // Generate calendar dates for the month
  const calendarDays = React.useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean; isTeachingDay: boolean; dayKey?: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const dayOfWeek = dt.getDay(); // 0 = Sun, 1 = Mon ...
      const dayKey = dayOfWeekIndexToKey[dayOfWeek];
      const isTeachingDay = Boolean(dayKey && activeTeachingDays.includes(dayKey));

      days.push({
        date: dt,
        isCurrentMonth: true,
        isTeachingDay,
        dayKey
      });
    }

    return days;
  }, [calendarMonth, activeTeachingDaysKey]);

  // Set default selected date to the first available teaching day safely
  useEffect(() => {
    if (!isOpen) return;
    const firstValid = calendarDays.find(d => d.isTeachingDay);
    if (firstValid) {
      setSelectedDate(prev => (prev && prev.getTime() === firstValid.date.getTime() ? prev : firstValid.date));
      if (firstValid.dayKey) {
        setSelectedDayKey(prev => (prev === firstValid.dayKey ? prev : firstValid.dayKey!));
      }
    }
  }, [isOpen, calendarDays, activeTeachingDaysKey]);

  if (!isOpen) return null;

  const handleSelectDate = (d: { date: Date; isTeachingDay: boolean; dayKey?: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' }) => {
    if (!d.isTeachingDay || !d.dayKey) return;
    setSelectedDate(d.date);
    setSelectedDayKey(d.dayKey);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedDate) return;

    setIsSubmitting(true);
    try {
      const formattedDateStr = selectedDate.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      const dateNote = `${formattedDateStr}`;
      await onCancelSession(course.id, selectedDayKey, selectedSection, reason, dateNote);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthNames = [
    'มกราคม (January)', 'กุมภาพันธ์ (February)', 'มีนาคม (March)', 'เมษายน (April)',
    'พฤษภาคม (May)', 'มิถุนายน (June)', 'กรกฎาคม (July)', 'สิงหาคม (August)',
    'กันยายน (September)', 'ตุลาคม (October)', 'พฤศจิกายน (November)', 'ธันวาคม (December)'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl flex flex-col gap-4 text-left my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 text-amber-600">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">แจ้งงดการเรียนการสอน (Cancel Class)</h3>
              <p className="text-xs text-slate-500">วิชา {course.code} - {course.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Section Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">เลือก Section ที่ต้องการงดคลาส</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              {availableSections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Calendar Day Picker (Requirement 1 & 5) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800">
                เลือกวันที่ในปฏิทิน: {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="px-2 py-1 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold border border-slate-200 cursor-pointer"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="px-2 py-1 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold border border-slate-200 cursor-pointer"
                >
                  →
                </button>
              </div>
            </div>

            {/* Teaching Days Note */}
            <p className="text-[11px] text-indigo-700 font-semibold mb-2">
              * เลือกได้เฉพาะวันที่มีการเรียนการสอน ({activeTeachingDays.join(', ')})
            </p>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1 font-bold text-slate-400">
              <span>อา</span>
              <span>จ</span>
              <span>อ</span>
              <span>พ</span>
              <span>พฤ</span>
              <span>ศ</span>
              <span>ส</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Offset for first day */}
              {Array.from({ length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 text-transparent">0</div>
              ))}

              {calendarDays.map((d, idx) => {
                const isSelected = selectedDate && selectedDate.toDateString() === d.date.toDateString();
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!d.isTeachingDay}
                    onClick={() => handleSelectDate(d)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs scale-105'
                        : d.isTeachingDay
                        ? 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold cursor-pointer'
                        : 'text-slate-300 cursor-not-allowed bg-slate-100/50'
                    }`}
                  >
                    {d.date.getDate()}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-3 p-2.5 bg-amber-100/80 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-between">
                <span>วันที่เลือก: {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span className="bg-amber-600 text-white px-2 py-0.5 rounded-md text-[10px]">
                  {selectedDayKey}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">เหตุผลในการงดคลาส *</label>
            <input
              type="text"
              required
              placeholder="e.g. อาจารย์ติดภารกิจสัมมนาวิชาการ / เลื่อนเป็น Make-up Class"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ปิด
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedDate}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-200 cursor-pointer"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการงดคลาส'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
