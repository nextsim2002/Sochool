import React, { useState, useEffect } from 'react';
import { 
  X, 
  Layers, 
  Clock, 
  MapPin, 
  Check, 
  UserCheck, 
  Sparkles,
  GraduationCap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Course } from '../../types';

interface JoinSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  enrolledSec?: string;
  isAlreadyEnrolled?: boolean;
  onConfirmJoin: (courseId: string, sectionName: string) => Promise<void>;
}

export const JoinSectionModal: React.FC<JoinSectionModalProps> = ({
  isOpen,
  onClose,
  course,
  enrolledSec,
  isAlreadyEnrolled = false,
  onConfirmJoin
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute available sections list
  const sectionSchedules = course?.sectionSchedules || [];
  const rawSectionsList = course?.sections && course.sections.length > 0 
    ? course.sections.filter(s => s !== 'All Sections' && s !== 'All SEC')
    : (sectionSchedules.length > 0 ? sectionSchedules.map(s => s.sectionName) : ['SEC 1']);

  // Ensure sections list has at least SEC 1
  const sectionsList = rawSectionsList.length > 0 ? rawSectionsList : ['SEC 1'];

  useEffect(() => {
    if (enrolledSec) {
      setSelectedSection(enrolledSec);
    } else if (sectionsList.length > 0) {
      setSelectedSection(sectionsList[0]);
    }
  }, [enrolledSec, course?.id]);

  if (!isOpen || !course) return null;

  const currentSelection = selectedSection || enrolledSec || sectionsList[0] || 'SEC 1';

  const dayLabelMap: Record<string, string> = {
    'MON': 'วันจันทร์ (Monday)',
    'TUE': 'วันอังคาร (Tuesday)',
    'WED': 'วันพุธ (Wednesday)',
    'THU': 'วันพฤหัสบดี (Thursday)',
    'FRI': 'วันศุกร์ (Friday)'
  };

  const handleJoin = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmJoin(course.id, currentSelection);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-5 text-left my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {isAlreadyEnrolled ? 'ข้อมูลกลุ่มเรียน (SEC) ของคุณ' : 'เลือก SEC ของวิชานี้ก่อนเข้าร่วม'}
              </h3>
              <p className="text-xs text-slate-500">วิชา {course.code} - {course.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isAlreadyEnrolled ? (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-emerald-950">คุณลงทะเบียนในวิชานี้แล้ว</p>
              <p className="text-xs text-emerald-800 mt-1">
                กลุ่มเรียนปัจจุบัน: <strong className="bg-white px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-900">{enrolledSec || currentSelection}</strong>
              </p>
              <p className="text-[11px] text-emerald-700 mt-1.5">
                ระบบได้บันทึกความสัมพันธ์ของคุณกับกลุ่มเรียนนี้เรียบร้อยแล้ว และจะไม่สร้างสมาชิกซ้ำ
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>กรุณาเลือก SEC เพื่อดูประกาศ ข่าวสาร โพสต์ และสมาชิกเฉพาะกลุ่มเรียนของคุณ</span>
          </div>
        )}

        {/* Section Options */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-700 block">
            {isAlreadyEnrolled ? 'กลุ่มเรียนที่เปิดสอนในวิชานี้:' : 'กลุ่มเรียนที่ต้องการเข้าร่วม (เลือก 1 กลุ่ม):'}
          </label>

          {sectionsList.map((secName) => {
            const sched = sectionSchedules.find(s => s.sectionName === secName);
            const isEnrolledInThis = isAlreadyEnrolled && enrolledSec === secName;
            const isSelected = currentSelection === secName;

            return (
              <div
                key={secName}
                onClick={() => {
                  if (!isAlreadyEnrolled) {
                    setSelectedSection(secName);
                  }
                }}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                  isEnrolledInThis
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 cursor-default'
                    : isSelected 
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 cursor-pointer' 
                      : isAlreadyEnrolled
                        ? 'border-slate-200 bg-slate-50/50 opacity-80 cursor-default'
                        : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                    isEnrolledInThis 
                      ? 'bg-emerald-600 text-white'
                      : isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : 'border border-slate-300 text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{secName}</h4>
                      {isEnrolledInThis && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          กลุ่มของคุณ
                        </span>
                      )}
                    </div>
                    {sched ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{dayLabelMap[sched.day] || sched.day} {sched.displayTime || `${sched.startTime} - ${sched.endTime}`}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sched.location || 'Academic Building'}</span>
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5">เรียนตามตารางที่ภาควิชากำหนด</p>
                    )}
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  isEnrolledInThis
                    ? 'bg-emerald-600 text-white'
                    : isSelected 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-600'
                }`}>
                  {isEnrolledInThis ? 'สังกัดกลุ่มนี้' : isSelected ? 'เลือกอยู่' : 'เลือก Sec นี้'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {isAlreadyEnrolled ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
          </button>
          {!isAlreadyEnrolled && (
            <button
              type="button"
              onClick={handleJoin}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังเข้าร่วม...' : `เข้าร่วมคลาส (${currentSelection})`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
