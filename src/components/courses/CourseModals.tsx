import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  UserPlus, 
  Users, 
  ShieldCheck, 
  AlertCircle, 
  BookOpen, 
  Clock, 
  Key, 
  Check, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Course, CourseType, CourseSectionSchedule, UserProfile, CoInstructorInfo, Assignment } from '../../types';
import { checkSectionScheduleConflict, getNextNonConflictingSchedule, DAY_LABELS_TH } from '../../utils/scheduleConflict';

// ==========================================
// 1. CREATE COURSE MODAL
// ==========================================
interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseData: Omit<Course, 'id'>) => Promise<void>;
  currentUser: UserProfile | null;
  availableInstructors: UserProfile[];
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  availableInstructors
}) => {
  const [courseType, setCourseType] = useState<CourseType>('regular');
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState(currentUser?.name || 'Faculty Instructor');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('from-blue-600 to-indigo-700');
  const [selectedCoInstructor, setSelectedCoInstructor] = useState('');
  const [coInstructorsList, setCoInstructorsList] = useState<CoInstructorInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Section schedules for regular courses
  const [sectionsList, setSectionsList] = useState<CourseSectionSchedule[]>([
    {
      sectionName: 'Section 1',
      day: 'MON',
      startTime: '09:00',
      endTime: '10:30',
      displayTime: '09:00 - 10:30',
      location: 'อาคารบรรยายรวม 4 ห้อง 402'
    }
  ]);

  const [sectionsConflictError, setSectionsConflictError] = useState<string>('');

  // Reset form cleanly whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCode('');
      setTitle('');
      setInstructor(currentUser?.name || 'Faculty Instructor');
      setDescription('');
      setSelectedColor('from-blue-600 to-indigo-700');
      setSelectedCoInstructor('');
      setCoInstructorsList([]);
      setIsSubmitting(false);
      setSubmitError('');
      setSectionsConflictError('');
      setCourseType('regular');
      setSectionsList([
        {
          sectionName: 'Section 1',
          day: 'MON',
          startTime: '09:00',
          endTime: '10:30',
          displayTime: '09:00 - 10:30',
          location: 'อาคารบรรยายรวม 4 ห้อง 402'
        }
      ]);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const sectionConflictResult = checkSectionScheduleConflict(sectionsList);

  const handleAddSection = () => {
    const nextSecNum = sectionsList.length + 1;
    const nonConflictingSec = getNextNonConflictingSchedule(sectionsList, nextSecNum);
    setSectionsList(prev => [...prev, nonConflictingSec]);
    setSectionsConflictError('');
  };

  const handleRemoveSection = (index: number) => {
    if (sectionsList.length <= 1) return;
    setSectionsList(prev => prev.filter((_, i) => i !== index));
    setSectionsConflictError('');
  };

  const handleUpdateSectionField = (index: number, field: keyof CourseSectionSchedule, value: any) => {
    setSectionsList(prev => prev.map((sec, i) => {
      if (i === index) {
        const updated = { ...sec, [field]: value };
        if (field === 'startTime' || field === 'endTime') {
          updated.displayTime = `${updated.startTime} - ${updated.endTime}`;
        }
        return updated;
      }
      return sec;
    }));
    setSectionsConflictError('');
  };

  const handleAddCoInstructor = () => {
    if (!selectedCoInstructor) return;
    const found = availableInstructors.find(u => u.uid === selectedCoInstructor || u.name === selectedCoInstructor);
    const coName = found?.name || selectedCoInstructor;
    const coUid = found?.uid || 'inst_' + Date.now();
    const coEmail = found?.email || '';
    const coAvatar = found?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    if (!coInstructorsList.some(c => c.name === coName || c.uid === coUid)) {
      setCoInstructorsList(prev => [...prev, {
        uid: coUid,
        name: coName,
        email: coEmail,
        avatar: coAvatar,
        roleTitle: 'อาจารย์ร่วมสอน (Co-Instructor)'
      }]);
    }
    setSelectedCoInstructor('');
  };

  const handleRemoveCoInstructor = (identifier: string) => {
    setCoInstructorsList(prev => prev.filter(c => c.uid !== identifier && c.name !== identifier));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!title.trim()) {
      setSubmitError('กรุณาระบุชื่อวิชา (Course Title)');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const generatedCode = 'GEN' + Math.floor(100 + Math.random() * 899);
      const courseCode = code.toUpperCase().trim() || generatedCode;
      const coNames = coInstructorsList.map(c => c.uid || c.name);

      const creatorUid = currentUser?.uid || 'instructor_user';
      const creatorName = instructor.trim() || currentUser?.name || 'Faculty Instructor';
      const enrolledArr = Array.from(new Set([
        creatorUid,
        ...(currentUser?.name ? [currentUser.name] : []),
        ...(creatorName ? [creatorName] : [])
      ]));

      if (courseType === 'regular') {
        // Enforce: sections in the same course cannot have overlapping day/time
        if (sectionsList.length > 1 && sectionConflictResult.hasConflict) {
          setSectionsConflictError(sectionConflictResult.message);
          setIsSubmitting(false);
          return;
        }

        const allSectionNames = ['All Sections', ...sectionsList.map(s => s.sectionName)];
        await onSubmit({
          code: courseCode,
          title: title.trim(),
          type: 'regular',
          instructor: creatorName,
          instructorId: creatorUid,
          coInstructors: coNames,
          coInstructorDetails: coInstructorsList,
          instructorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          location: sectionsList[0]?.location || 'อาคารบรรยายรวม 4 ห้อง 402',
          enrolledCount: 1,
          enrolledStudents: enrolledArr,
          sections: allSectionNames,
          selectedSection: sectionsList[0]?.sectionName || 'Section 1',
          sectionSchedules: sectionsList,
          hasAssignments: true,
          color: selectedColor,
          description: description.trim() || 'หลักสูตรภาคการศึกษาปกติพร้อมตารางเรียนและการส่งงาน',
          cancelledSessions: []
        });
      } else {
        await onSubmit({
          code: courseCode,
          title: title.trim(),
          type: 'workshop',
          instructor: creatorName,
          instructorId: creatorUid,
          coInstructors: coNames,
          coInstructorDetails: coInstructorsList,
          instructorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          location: 'เรียนออนไลน์ตามอัธยาศัย (Self-Paced / Online)',
          enrolledCount: 1,
          enrolledStudents: enrolledArr,
          sections: ['General Session'],
          selectedSection: 'General Session',
          hasAssignments: false,
          color: selectedColor,
          description: description.trim() || 'หลักสูตรอบรม/เรียนเสริมแบบยืดหยุ่น ไม่มีห้องหรือเวลาบังคับ',
          cancelledSessions: []
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Create course error:', err);
      setSubmitError(err?.message || 'เกิดข้อผิดพลาดในการสร้างวิชา กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl flex flex-col gap-5 text-left my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">สร้างคลาสเรียนใหม่ (Create Course)</h3>
              <p className="text-xs text-slate-500">สร้างกลุ่มการเรียนการสอนและเพิ่มอาจารย์ร่วมสอน</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Type Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">ประเภทวิชา</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCourseType('regular')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  courseType === 'regular' ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20' : 'border-slate-200'
                }`}
              >
                <span className="font-bold text-xs text-slate-900">🎓 คลาสปกติ (Regular)</span>
                <span className="text-[11px] text-slate-500">มีตารางเรียน ห้องเรียน และการบ้าน</span>
              </button>
              <button
                type="button"
                onClick={() => setCourseType('workshop')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  courseType === 'workshop' ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20' : 'border-slate-200'
                }`}
              >
                <span className="font-bold text-xs text-slate-900">💡 อบรม (Workshop)</span>
                <span className="text-[11px] text-slate-500">เรียนออนไลน์ตามอัธยาศัย ยืดหยุ่น</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">รหัสวิชา (Code) *</label>
              <input
                type="text"
                required
                placeholder="e.g. CS201"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">อาจารย์ผู้สอนหลัก</label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อวิชา (Course Title) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Algorithms and Data Structures"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Co-Instructors Selection */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>อาจารย์ร่วมสอน (Co-Instructors)</span>
            </label>
            <p className="text-[11px] text-slate-500">อาจารย์ร่วมสอนจะมีสิทธิ์เพิ่ม ลบ แก้ไขคลาสเรียน การบ้าน และจัดการนักศึกษาได้เหมือนผู้สอนหลัก</p>
            
            <div className="flex gap-2">
              <select
                value={selectedCoInstructor}
                onChange={(e) => setSelectedCoInstructor(e.target.value)}
                className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs"
              >
                <option value="">-- เลือกอาจารย์ร่วมสอนจากรายชื่อ --</option>
                {availableInstructors
                  .filter(inst => inst.uid !== currentUser?.uid && inst.name !== currentUser?.name)
                  .map(inst => (
                    <option key={inst.uid} value={inst.uid}>
                      อ. {inst.name} ({inst.email})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAddCoInstructor}
                disabled={!selectedCoInstructor}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>เพิ่ม</span>
              </button>
            </div>

            {coInstructorsList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {coInstructorsList.map(co => (
                  <div key={co.uid || co.name} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200 text-xs font-semibold">
                    <img src={co.avatar} alt={co.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{co.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoInstructor(co.uid || co.name)}
                      className="text-slate-400 hover:text-red-600 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timetable and Section Management for regular course */}
          {courseType === 'regular' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>จัดการ Section และตารางเรียน ({sectionsList.length} กลุ่ม)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่ม Sec</span>
                </button>
              </div>

              {/* Requirement Rule Notice */}
              <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-950">ข้อกำหนดของรายวิชา (Section Schedule Policy)</span>
                  <span className="text-amber-800">
                    ในวิชาเดียวกันนั้น แต่ละ Section <strong>ห้ามมีเวลาเรียนวันและเวลาเดียวกัน</strong> โดยแต่ละกลุ่มจะต้องกำหนดวันหรือช่วงเวลาเรียนที่แยกต่างหากจากกัน
                  </span>
                </div>
              </div>

              {/* Live Conflict Alert if duplicate day/time found */}
              {(sectionConflictResult.hasConflict || sectionsConflictError) && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2.5 text-xs text-red-900 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-950">ตรวจพบเวลาเรียนซ้อนทับกันในวิชาเดียวกัน!</span>
                    <span className="text-red-800">
                      {sectionsConflictError || sectionConflictResult.message}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                {sectionsList.map((sec, idx) => {
                  const isConflicting = sectionConflictResult.conflictingIndices.has(idx);

                  return (
                    <div 
                      key={idx} 
                      className={`p-3 bg-white rounded-xl border transition-all flex flex-col gap-2 shadow-2xs ${
                        isConflicting ? 'border-red-300 ring-2 ring-red-200/70 bg-red-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${
                            isConflicting ? 'bg-red-600' : 'bg-indigo-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={sec.sectionName}
                            onChange={(e) => handleUpdateSectionField(idx, 'sectionName', e.target.value)}
                            className="font-bold text-xs text-slate-900 border-b border-transparent focus:border-indigo-500 focus:outline-none px-1"
                          />
                          {isConflicting && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                              ⚠️ เวลาเรียนซ้อนทับกับกลุ่มอื่น
                            </span>
                          )}
                        </div>
                        {sectionsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(idx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="ลบกลุ่มนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">วันเรียน</span>
                          <select
                            value={sec.day}
                            onChange={(e) => handleUpdateSectionField(idx, 'day', e.target.value as any)}
                            className={`w-full p-1.5 bg-slate-50 border rounded-lg text-xs font-semibold ${
                              isConflicting ? 'border-red-300' : 'border-slate-200'
                            }`}
                          >
                            <option value="MON">วันจันทร์</option>
                            <option value="TUE">วันอังคาร</option>
                            <option value="WED">วันพุธ</option>
                            <option value="THU">วันพฤหัสบดี</option>
                            <option value="FRI">วันศุกร์</option>
                            <option value="SAT">วันเสาร์</option>
                            <option value="SUN">วันอาทิตย์</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">เวลาเริ่ม</span>
                          <input
                            type="time"
                            value={sec.startTime}
                            onChange={(e) => handleUpdateSectionField(idx, 'startTime', e.target.value)}
                            className={`w-full p-1.5 bg-slate-50 border rounded-lg text-xs ${
                              isConflicting ? 'border-red-300' : 'border-slate-200'
                            }`}
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">เวลาเลิก</span>
                          <input
                            type="time"
                            value={sec.endTime}
                            onChange={(e) => handleUpdateSectionField(idx, 'endTime', e.target.value)}
                            className={`w-full p-1.5 bg-slate-50 border rounded-lg text-xs ${
                              isConflicting ? 'border-red-300' : 'border-slate-200'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">ห้องเรียน / อาคาร</span>
                        <input
                          type="text"
                          placeholder="e.g. อาคารบรรยายรวม 4 ห้อง 402"
                          value={sec.location || ''}
                          onChange={(e) => handleUpdateSectionField(idx, 'location', e.target.value)}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">คำอธิบายรายวิชา (Description)</label>
            <textarea
              rows={2}
              placeholder="รายละเอียดโครงสร้างเนื้อหาและการเรียนการสอน..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-100 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังสร้าง...' : 'บันทึกสร้างวิชา'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. EDIT COURSE MODAL
// ==========================================
interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onUpdate: (courseId: string, updates: Partial<Course>) => Promise<void>;
  availableInstructors: UserProfile[];
}

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
  isOpen,
  onClose,
  course,
  onUpdate,
  availableInstructors
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('from-blue-600 to-indigo-700');
  const [sectionsList, setSectionsList] = useState<CourseSectionSchedule[]>([]);
  const [sectionsConflictError, setSectionsConflictError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !course) return;
    setCode(course.code || '');
    setTitle(course.title || '');
    setInstructor(course.instructor || '');
    setLocation(course.location || '');
    setDescription(course.description || '');
    setSelectedColor(course.color || 'from-blue-600 to-indigo-700');
    if (course.sectionSchedules && course.sectionSchedules.length > 0) {
      setSectionsList(course.sectionSchedules);
    } else {
      setSectionsList([
        {
          sectionName: 'Section 1',
          day: 'MON',
          startTime: '09:00',
          endTime: '10:30',
          displayTime: '09:00 - 10:30',
          location: course.location || 'Sci-Tech Hall 402'
        }
      ]);
    }
    setSectionsConflictError('');
  }, [isOpen, course?.id]);

  if (!isOpen || !course) return null;

  const sectionConflictResult = checkSectionScheduleConflict(sectionsList);

  const handleAddSection = () => {
    const nextSecNum = sectionsList.length + 1;
    const nonConflictingSec = getNextNonConflictingSchedule(sectionsList, nextSecNum);
    if (location) nonConflictingSec.location = location;
    setSectionsList(prev => [...prev, nonConflictingSec]);
    setSectionsConflictError('');
  };

  const handleRemoveSection = (index: number) => {
    if (sectionsList.length <= 1) return;
    setSectionsList(prev => prev.filter((_, i) => i !== index));
    setSectionsConflictError('');
  };

  const handleUpdateSectionField = (index: number, field: keyof CourseSectionSchedule, value: any) => {
    setSectionsList(prev => prev.map((sec, i) => {
      if (i === index) {
        const updated = { ...sec, [field]: value };
        if (field === 'startTime' || field === 'endTime') {
          updated.displayTime = `${updated.startTime} - ${updated.endTime}`;
        }
        return updated;
      }
      return sec;
    }));
    setSectionsConflictError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    // Enforce: sections in the same course cannot have overlapping day/time
    if (course.type !== 'workshop' && sectionConflictResult.hasConflict) {
      setSectionsConflictError(sectionConflictResult.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const allSectionNames = ['All Sections', ...sectionsList.map(s => s.sectionName)];
      await onUpdate(course.id, {
        code: code.toUpperCase().trim(),
        title: title.trim(),
        instructor: instructor.trim(),
        location: sectionsList[0]?.location || location.trim(),
        description: description.trim(),
        color: selectedColor,
        sections: allSectionNames,
        sectionSchedules: sectionsList
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl flex flex-col gap-5 text-left my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">แก้ไขข้อมูลรายวิชา (Edit Course)</h3>
              <p className="text-xs text-slate-500">สำหรับอาจารย์ผู้สอนและอาจารย์ร่วมสอน</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">รหัสวิชา (Code)</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">อาจารย์ผู้สอนหลัก</label>
              <input
                type="text"
                required
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อวิชา (Course Title)</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>

          {/* Timetable and Section Management for regular courses */}
          {course.type === 'regular' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>จัดการ Section และตารางเรียน ({sectionsList.length} กลุ่ม)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่ม Sec</span>
                </button>
              </div>

              {/* Requirement Rule Notice */}
              <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-950">ข้อกำหนดของรายวิชา (Section Schedule Policy)</span>
                  <span className="text-amber-800">
                    ในวิชาเดียวกันนั้น แต่ละ Section <strong>ห้ามมีเวลาเรียนวันและเวลาเดียวกัน</strong> โดยแต่ละกลุ่มจะต้องกำหนดวันหรือช่วงเวลาเรียนที่แยกต่างหากจากกัน
                  </span>
                </div>
              </div>

              {/* Live Conflict Alert if duplicate day/time found */}
              {(sectionConflictResult.hasConflict || sectionsConflictError) && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2.5 text-xs text-red-900 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-950">ตรวจพบเวลาเรียนซ้อนทับกันในวิชาเดียวกัน!</span>
                    <span className="text-red-800">
                      {sectionsConflictError || sectionConflictResult.message}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                {sectionsList.map((sec, idx) => {
                  const isConflicting = sectionConflictResult.conflictingIndices.has(idx);

                  return (
                    <div 
                      key={idx} 
                      className={`p-3 bg-white rounded-xl border transition-all flex flex-col gap-2 shadow-2xs ${
                        isConflicting ? 'border-red-300 ring-2 ring-red-200/70 bg-red-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${
                            isConflicting ? 'bg-red-600' : 'bg-indigo-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={sec.sectionName}
                            onChange={(e) => handleUpdateSectionField(idx, 'sectionName', e.target.value)}
                            className="font-bold text-xs text-slate-900 border-b border-transparent focus:border-indigo-500 focus:outline-none px-1"
                          />
                          {isConflicting && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                              ⚠️ เวลาเรียนซ้อนทับกับกลุ่มอื่น
                            </span>
                          )}
                        </div>
                        {sectionsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(idx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="ลบกลุ่มนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">วันเรียน</span>
                          <select
                            value={sec.day}
                            onChange={(e) => handleUpdateSectionField(idx, 'day', e.target.value as any)}
                            className={`w-full p-1.5 bg-slate-50 border rounded-lg text-xs font-semibold ${
                              isConflicting ? 'border-red-300' : 'border-slate-200'
                            }`}
                          >
                            <option value="MON">วันจันทร์</option>
                            <option value="TUE">วันอังคาร</option>
                            <option value="WED">วันพุธ</option>
                            <option value="THU">วันพฤหัสบดี</option>
                            <option value="FRI">วันศุกร์</option>
                            <option value="SAT">วันเสาร์</option>
                            <option value="SUN">วันอาทิตย์</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">เวลาเริ่ม</span>
                          <input
                            type="time"
                            value={sec.startTime}
                            onChange={(e) => handleUpdateSectionField(idx, 'startTime', e.target.value)}
                            className={`w-full p-1.5 bg-slate-50 border rounded-lg text-xs ${
                              isConflicting ? 'border-red-300' : 'border-slate-200'
                            }`}
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">เวลาเลิก</span>
                          <input
                            type="time"
                            value={sec.endTime}
                            onChange={(e) => handleUpdateSectionField(idx, 'endTime', e.target.value)}
                            className={`w-full p-1.5 bg-slate-50 border rounded-lg text-xs ${
                              isConflicting ? 'border-red-300' : 'border-slate-200'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">ห้องเรียน / อาคาร</span>
                        <input
                          type="text"
                          placeholder="e.g. อาคารบรรยายรวม 4 ห้อง 402"
                          value={sec.location || ''}
                          onChange={(e) => handleUpdateSectionField(idx, 'location', e.target.value)}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">คำอธิบายรายวิชา (Description)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-100 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. MANAGE CO-INSTRUCTORS MODAL
// ==========================================
interface ManageCoInstructorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onAddCoInstructor: (courseId: string, co: CoInstructorInfo) => Promise<{ success: boolean; message: string }>;
  onRemoveCoInstructor: (courseId: string, identifier: string) => Promise<void>;
  availableInstructors: UserProfile[];
}

export const ManageCoInstructorsModal: React.FC<ManageCoInstructorsModalProps> = ({
  isOpen,
  onClose,
  course,
  onAddCoInstructor,
  onRemoveCoInstructor,
  availableInstructors
}) => {
  const [selectedInstUid, setSelectedInstUid] = useState('');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [roleTitle, setRoleTitle] = useState('อาจารย์ร่วมสอน (Co-Instructor)');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !course) return null;

  const currentCoDetails = course.coInstructorDetails || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    let coInfo: CoInstructorInfo;

    if (selectedInstUid) {
      const found = availableInstructors.find(u => u.uid === selectedInstUid);
      if (!found) return;
      coInfo = {
        uid: found.uid,
        name: found.name,
        email: found.email,
        avatar: found.avatar,
        roleTitle
      };
    } else if (customName.trim()) {
      coInfo = {
        uid: 'co_' + Date.now(),
        name: customName.trim(),
        email: customEmail.trim() || undefined,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        roleTitle
      };
    } else {
      return;
    }

    const res = await onAddCoInstructor(course.id, coInfo);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setSelectedInstUid('');
      setCustomName('');
      setCustomEmail('');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleRemove = async (identifier: string) => {
    if (window.confirm('คุณต้องการลบอาจารย์ร่วมสอนท่านนี้ออกจากรายวิชาหรือไม่?')) {
      await onRemoveCoInstructor(course.id, identifier);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl flex flex-col gap-5 text-left my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">จัดการอาจารย์ร่วมสอน (Co-Instructors)</h3>
              <p className="text-xs text-slate-500">รายวิชา {course.code} - {course.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}>
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Current Lead Instructor */}
        <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={course.instructorAvatar} alt={course.instructor} className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500" />
            <div>
              <h4 className="font-bold text-xs text-slate-900">{course.instructor}</h4>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                อาจารย์ผู้สอนหลัก (Lead Instructor)
              </span>
            </div>
          </div>
        </div>

        {/* Current Co-Instructors List */}
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            รายชื่ออาจารย์ร่วมสอน ({currentCoDetails.length} ท่าน)
          </h4>

          {currentCoDetails.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200 text-xs text-slate-400">
              ยังไม่มีอาจารย์ร่วมสอนในรายวิชานี้
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {currentCoDetails.map(co => (
                <div key={co.uid || co.name} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={co.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} alt={co.name} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{co.name}</h5>
                      <p className="text-[10px] text-slate-500">{co.roleTitle || 'อาจารย์ร่วมสอน'} {co.email ? `• ${co.email}` : ''}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(co.uid || co.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="ลบอาจารย์ร่วมสอน"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Co-Instructor Form */}
        <form onSubmit={handleAdd} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>+ เพิ่มอาจารย์ร่วมสอนใหม่</span>
          </h4>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">เลือกจากอาจารย์ในระบบ</label>
            <select
              value={selectedInstUid}
              onChange={(e) => {
                setSelectedInstUid(e.target.value);
                if (e.target.value) {
                  setCustomName('');
                  setCustomEmail('');
                }
              }}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
            >
              <option value="">-- เลือกจากรายชื่ออาจารย์ --</option>
              {availableInstructors.map(inst => (
                <option key={inst.uid} value={inst.uid}>
                  {inst.name} ({inst.email})
                </option>
              ))}
            </select>
          </div>

          {!selectedInstUid && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">หรือระบุชื่ออาจารย์</label>
                <input
                  type="text"
                  placeholder="e.g. ดร. สมชาย ใจดี"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">อีเมลอาจารย์ (ถ้ามี)</label>
                <input
                  type="email"
                  placeholder="somchai@univ.ac.th"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">บทบาท / ตำแหน่ง</label>
            <select
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="อาจารย์ร่วมสอน (Co-Instructor)">อาจารย์ร่วมสอน (Co-Instructor)</option>
              <option value="ผู้ช่วยสอน / TA (Teaching Assistant)">ผู้ช่วยสอน / TA (Teaching Assistant)</option>
              <option value="วิทยากรพิเศษ (Guest Lecturer)">วิทยากรพิเศษ (Guest Lecturer)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!selectedInstUid && !customName.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>ยืนยันเพิ่มอาจารย์ร่วมสอน</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 4. DELETE COURSE CONFIRMATION MODAL
// ==========================================
interface DeleteCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onDelete: (courseId: string) => Promise<void>;
}

export const DeleteCourseModal: React.FC<DeleteCourseModalProps> = ({
  isOpen,
  onClose,
  course,
  onDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !course) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(course.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-4 text-left">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
          <Trash2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-bold text-lg text-slate-900">ลบรายวิชา {course.code}?</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            คุณแน่ใจหรือไม่ว่าต้องการลบวิชา <strong>{course.title}</strong>? ข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบถาวร:
          </p>
          <ul className="mt-2 text-xs text-slate-600 bg-red-50/70 p-3 rounded-xl border border-red-100 space-y-1">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
              <span>โพสต์และความคิดเห็นทั้งหมดในวิชา</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
              <span>การบ้าน ไฟล์งาน และคะแนนการตรวจทั้งหมด</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
              <span>ประกาศประจำวิชา / ประจำ SEC</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
              <span>ตารางเรียนและห้องแชตกลุ่มของวิชานี้</span>
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs"
          >
            {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบวิชาถาวร'}
          </button>
        </div>
      </div>
    </div>
  );
};
