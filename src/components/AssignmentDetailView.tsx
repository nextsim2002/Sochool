import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, 
  Trophy, 
  Calendar, 
  Paperclip, 
  UploadCloud, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Send, 
  CheckSquare, 
  ArrowLeft, 
  Sparkles, 
  Download, 
  Image as ImageIcon, 
  Eye, 
  X, 
  ExternalLink, 
  Users, 
  Award, 
  AlertCircle, 
  Edit3, 
  Lock, 
  Unlock, 
  RotateCcw,
  Search,
  Filter,
  Clock,
  Check,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SubmittedFile, AssignmentSubmission, StudentSubmissionItem } from '../types';
import { secApi } from '../services/secApi';

interface AssignmentDetailViewProps {
  assignmentId: string;
  onBack: () => void;
  initialTab?: 'details' | 'submissions';
}

export const AssignmentDetailView: React.FC<AssignmentDetailViewProps> = ({
  assignmentId,
  onBack,
  initialTab = 'details'
}) => {
  const { user } = useAuth();
  const { 
    assignments, 
    updateAssignment, 
    submitAssignment, 
    gradeAssignmentSubmission, 
    discussionComments, 
    addDiscussionComment,
    getUserEnrolledSec,
    courses,
    allUsers
  } = useData();
  
  const assignment = assignments.find(a => a.id === assignmentId);
  const isInstructor = user?.role === 'instructor';
  const myUid = user?.uid || 'guest';

  // Submission input states
  const [submissionTab, setSubmissionTab] = useState<'upload' | 'text'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<SubmittedFile[]>([]);
  const [textEntry, setTextEntry] = useState('');
  const [discussionInput, setDiscussionInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [successToast, setSuccessToast] = useState(false);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  // Instructor view states
  const [instructorViewTab, setInstructorViewTab] = useState<'details' | 'submissions'>(initialTab);
  const [selectedSecFilter, setSelectedSecFilter] = useState<string>('ALL_SEC');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'not_submitted' | 'graded'>('all');
  const [searchStudentTerm, setSearchStudentTerm] = useState('');
  const [gradingStudent, setGradingStudent] = useState<StudentSubmissionItem | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(100);
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [instructorSummary, setInstructorSummary] = useState<{
    students: StudentSubmissionItem[];
    totalStudents: number;
    submittedCount: number;
    notSubmittedCount: number;
    gradedCount: number;
  } | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [gradeModalError, setGradeModalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Available sections for this course
  const currentCourse = assignment ? courses.find(c => c.id === assignment.courseId) : null;
  const courseSections = currentCourse?.sections && currentCourse.sections.length > 0
    ? currentCourse.sections.filter(s => s !== 'All Sections' && s !== 'All SEC')
    : ['SEC 1', 'SEC 2', 'SEC 3'];

  // Load instructor submission summary with individual isolation
  const loadInstructorData = async () => {
    if (!assignment) return;
    setIsLoadingSummary(true);
    try {
      const res = await secApi.getInstructorSummary(assignment.id, user, selectedSecFilter);
      if (res.success) {
        setInstructorSummary({
          students: res.students,
          totalStudents: res.totalStudents,
          submittedCount: res.submittedCount,
          notSubmittedCount: res.notSubmittedCount,
          gradedCount: res.gradedCount
        });
      }
    } catch (e) {
      console.warn('Failed to load instructor summary:', e);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (assignment && isInstructor) {
      loadInstructorData();
    }
  }, [instructorViewTab, selectedSecFilter, assignment?.id, isInstructor]);

  if (!assignment) {
    return (
      <div className="flex-1 min-h-screen bg-[#F8FAFC] p-8 max-w-xl mx-auto flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">ไม่พบการบ้านนี้ (Assignment Not Found)</h2>
        <p className="text-xs text-slate-500">การบ้านนี้อาจถูกลบหรือไม่มีอยู่ในระบบ</p>
        <button 
          onClick={onBack} 
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          &larr; กลับไปยังหน้ารายวิชา (Back to Courses)
        </button>
      </div>
    );
  }

  // Check SEC scope isolation for student
  const studentEnrolledSec = getUserEnrolledSec ? getUserEnrolledSec(assignment.courseId) : undefined;
  const isRestrictedBySec = !isInstructor && assignment.targetSecId && assignment.targetSecId !== 'ALL_SEC' && studentEnrolledSec && studentEnrolledSec !== assignment.targetSecId;

  if (isRestrictedBySec) {
    return (
      <div className="flex-1 min-h-screen bg-[#F8FAFC] p-8 max-w-xl mx-auto flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">ไม่มีสิทธิ์เข้าถึงการบ้านนี้</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          การบ้าน <strong>"{assignment.title}"</strong> กำหนดไว้เฉพาะกลุ่มเรียน <strong>{assignment.targetSecId}</strong> เท่านั้น
          <br />
          (กลุ่มเรียนปัจจุบันของคุณ: <strong>{studentEnrolledSec}</strong>)
        </p>
        <button 
          onClick={onBack} 
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          &larr; กลับไปยังหน้ารายวิชา (Back)
        </button>
      </div>
    );
  }

  // Strictly individual student submission (Student A ≠ Student B)
  const mySubmission: AssignmentSubmission | undefined = 
    assignment.submissions?.[myUid] || 
    (assignment.submission?.studentId === myUid ? assignment.submission : undefined);

  const isAlreadySubmitted = Boolean(
    mySubmission && 
    (mySubmission.status === 'submitted' || mySubmission.status === 'graded' || 
     (mySubmission.files && mySubmission.files.length > 0) || mySubmission.textEntry)
  );
  const allowResubmission = assignment.allowResubmission !== false;

  const handleStartEdit = () => {
    if (mySubmission?.files && mySubmission.files.length > 0 && uploadedFiles.length === 0) {
      setUploadedFiles(mySubmission.files);
    }
    if (mySubmission?.textEntry && !textEntry) {
      setTextEntry(mySubmission.textEntry);
    }
    setIsEditingSubmission(true);
  };

  const handleCancelEdit = () => {
    setIsEditingSubmission(false);
  };

  const handleToggleAllowResubmission = async () => {
    await updateAssignment(assignment.id, {
      allowResubmission: !allowResubmission
    });
  };

  // Process files from input
  const processFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    filesArray.forEach((file) => {
      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const sizeStr = file.size < 1024 * 1024 
          ? `${(file.size / 1024).toFixed(1)} KB` 
          : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

        const newFileObj: SubmittedFile = {
          name: file.name,
          size: sizeStr,
          type: file.type || (isImg ? 'image' : 'document'),
          dataUrl: reader.result as string
        };

        setUploadedFiles(prev => [...prev, newFileObj]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadFile = (file: SubmittedFile | { name: string; size?: string; dataUrl?: string }) => {
    if (file.dataUrl) {
      const a = document.createElement('a');
      a.href = file.dataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(`กำลังดาวน์โหลดไฟล์: ${file.name}`);
    }
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0 && !textEntry.trim()) {
      alert('กรุณาเลือกไฟล์/รูปภาพจากเครื่องอย่างน้อย 1 ไฟล์ หรือพิมพ์ข้อความส่งงานก่อนกดยืนยัน');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAssignment(assignment.id, {
        fileNames: uploadedFiles.map(f => f.name),
        files: uploadedFiles,
        textEntry: textEntry || undefined
      });

      setIsEditingSubmission(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 4000);

      // Fire celebratory confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      alert(err.message || 'ส่งงานไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussionInput.trim()) return;
    await addDiscussionComment(discussionInput);
    setDiscussionInput('');
  };

  const handleOpenGradingModal = (item: StudentSubmissionItem) => {
    setGradingStudent(item);
    setGradeModalError(null);
    const existingGrade = item.submission?.grade;
    const initialGrade = (existingGrade !== undefined && existingGrade !== null)
      ? Math.min(Number(existingGrade), assignment.points)
      : assignment.points;
    setGradeInput(initialGrade);
    setFeedbackInput(item.submission?.feedback || '');
  };

  const handleSaveGrade = async () => {
    if (!gradingStudent || isSavingGrade) return;
    setGradeModalError(null);
    const maxPoints = Number(assignment.points) || 100;
    const numGrade = Number(gradeInput);

    if (isNaN(numGrade) || numGrade < 0) {
      setGradeModalError('กรุณากรอกคะแนนที่ถูกต้อง (0 หรือมากกว่า)');
      return;
    }

    if (numGrade > maxPoints) {
      setGradeModalError(`ไม่สามารถใส่คะแนนเกินคะแนนที่ตั้งไว้ตอนสร้างงานได้ (คะแนนเต็ม ${maxPoints} คะแนน)`);
      setGradeInput(maxPoints);
      return;
    }

    setIsSavingGrade(true);
    try {
      const studentMeta = {
        studentName: gradingStudent.studentName || gradingStudent.name,
        studentCode: gradingStudent.studentCode,
        studentAvatar: gradingStudent.studentAvatar || gradingStudent.avatar,
        secId: gradingStudent.secId
      };

      if (typeof gradeAssignmentSubmission === 'function') {
        await gradeAssignmentSubmission(
          assignment.id, 
          gradingStudent.studentId, 
          numGrade, 
          feedbackInput.trim() || 'ตรวจเรียบร้อยแล้ว',
          studentMeta
        );
      } else {
        await secApi.gradeSubmission(
          assignment.id,
          gradingStudent.studentId,
          numGrade,
          feedbackInput.trim() || 'ตรวจเรียบร้อยแล้ว',
          user,
          studentMeta
        );
      }

      setGradingStudent(null);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
      try {
        await loadInstructorData();
      } catch (e) {
        console.warn('loadInstructorData sync note:', e);
      }
    } catch (e: any) {
      setGradeModalError(e.message || 'บันทึกคะแนนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSavingGrade(false);
    }
  };

  // Helper for flexible SEC matching (e.g., 'Section 1' matches 'SEC 1')
  const isMatchingSec = (secA?: string, secB?: string) => {
    if (!secB || secB === 'ALL_SEC' || secB === 'All SEC' || secB === 'All Sections') return true;
    if (!secA) return false;
    if (secA === secB) return true;
    const cleanA = secA.toLowerCase().replace(/section\s*/i, 'sec ').replace(/\s+/g, ' ').trim();
    const cleanB = secB.toLowerCase().replace(/section\s*/i, 'sec ').replace(/\s+/g, ' ').trim();
    return cleanA === cleanB;
  };

  // Comprehensive student roster ensuring 100% data consistency
  const allCourseStudents = React.useMemo(() => {
    // Predefined student directory for the course
    const defaultStudentDirectory: Record<string, { name: string; studentId: string; sec: string; avatar: string }> = {
      '65012345': { name: 'สมชาย ใจดี', studentId: '65012345', sec: 'SEC 1', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
      '65014892': { name: 'กัญญา พรประสิทธิ์', studentId: '65014892', sec: 'SEC 1', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
      '66023114': { name: 'พีรพล รุ่งโรจน์', studentId: '66023114', sec: 'SEC 2', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      '66025678': { name: 'ธนภรณ์ ศรีสุวรรณ', studentId: '66025678', sec: 'SEC 2', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
      '65031980': { name: 'ชัชวาล เลิศปัญญา', studentId: '65031980', sec: 'SEC 3', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
    };

    const studentMap = new Map<string, {
      studentId: string;
      studentCode: string;
      name: string;
      studentName: string;
      avatar: string;
      studentAvatar: string;
      secId: string;
      status: 'submitted' | 'not_submitted' | 'graded';
      submission?: AssignmentSubmission;
    }>();

    // 1. Seed from course enrolled students
    const enrolledIds = currentCourse?.enrolledStudents && currentCourse.enrolledStudents.length > 0 
      ? currentCourse.enrolledStudents 
      : Object.keys(defaultStudentDirectory);

    enrolledIds.forEach((stdKey) => {
      const dir = defaultStudentDirectory[stdKey];
      const matchedUser = allUsers?.find(u => u.uid === stdKey || u.studentId === stdKey || u.name === stdKey);
      const assignedSec = currentCourse?.enrolledStudentSections?.[stdKey] || dir?.sec || 'SEC 1';
      const code = matchedUser?.studentId || dir?.studentId || stdKey;
      const name = matchedUser?.name || dir?.name || stdKey;
      const avatar = matchedUser?.avatar || dir?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

      studentMap.set(stdKey, {
        studentId: stdKey,
        studentCode: code,
        name,
        studentName: name,
        avatar,
        studentAvatar: avatar,
        secId: assignedSec,
        status: 'not_submitted'
      });
    });

    // 2. Merge students from API instructorSummary if present
    if (instructorSummary?.students && instructorSummary.students.length > 0) {
      instructorSummary.students.forEach(item => {
        const key = item.studentId || item.studentCode || item.name;
        let matchedKey: string | null = null;
        for (const [k, v] of studentMap.entries()) {
          if (
            k === key || 
            v.studentId === item.studentId || 
            (item.studentCode && (v.studentCode === item.studentCode || k === item.studentCode)) ||
            (item.name && (v.name === item.name || v.studentName === item.name))
          ) {
            matchedKey = k;
            break;
          }
        }

        const existing = matchedKey ? studentMap.get(matchedKey) : undefined;
        const name = existing?.name || existing?.studentName || (item as any).studentName || item.name || key;
        const avatar = existing?.avatar || existing?.studentAvatar || (item as any).studentAvatar || item.avatar || '';
        const code = existing?.studentCode || item.studentCode || key;
        // Keep existing secId if already known, or fallback to item.secId
        const sec = existing?.secId || item.secId || 'SEC 1';

        const status = (item.status === 'graded' || existing?.status === 'graded') 
          ? 'graded' 
          : (item.status || existing?.status || 'not_submitted');

        studentMap.set(matchedKey || key, {
          studentId: existing?.studentId || item.studentId || key,
          studentCode: code,
          name,
          studentName: name,
          avatar,
          studentAvatar: avatar,
          secId: sec,
          status,
          submission: item.submission || existing?.submission
        });
      });
    }

    // 3. Integrate all submissions from assignment.submissions
    const submissionsMap: Record<string, AssignmentSubmission> = assignment?.submissions || {};
    Object.entries(submissionsMap).forEach(([subStdId, rawSub]) => {
      const sub = rawSub as AssignmentSubmission;
      if (!sub) return;
      let matchedKey: string | null = null;
      for (const [k, v] of studentMap.entries()) {
        if (
          k === subStdId || 
          v.studentId === subStdId || 
          (sub.studentId && (v.studentId === sub.studentId || k === sub.studentId)) ||
          (sub.studentCode && (v.studentCode === sub.studentCode || k === sub.studentCode)) ||
          (sub.studentName && (v.studentName === sub.studentName || v.name === sub.studentName))
        ) {
          matchedKey = k;
          break;
        }
      }

      const targetKey = matchedKey || subStdId;
      const existing = matchedKey ? studentMap.get(matchedKey) : undefined;
      const dir = defaultStudentDirectory[subStdId] || defaultStudentDirectory[sub.studentCode || ''];
      const name = existing?.name || existing?.studentName || sub.studentName || dir?.name || 'Student';
      const avatar = existing?.avatar || existing?.studentAvatar || sub.studentAvatar || dir?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      const code = existing?.studentCode || sub.studentCode || dir?.studentId || subStdId;
      // Preserve existing secId if already known
      const sec = existing?.secId || sub.secId || currentCourse?.enrolledStudentSections?.[subStdId] || dir?.sec || 'SEC 1';
      const status: 'submitted' | 'graded' = (sub.grade !== undefined && sub.grade !== null) ? 'graded' : 'submitted';

      studentMap.set(targetKey, {
        studentId: existing?.studentId || sub.studentId || subStdId,
        studentCode: code,
        name,
        studentName: name,
        avatar,
        studentAvatar: avatar,
        secId: sec,
        status,
        submission: {
          ...sub,
          secId: sec,
          studentName: name,
          studentCode: code
        }
      });
    });

    return Array.from(studentMap.values());
  }, [assignment, currentCourse, instructorSummary, allUsers]);

  // SEC-Scoped Students (Respects SEC filtering for instructors with flexible matching)
  const secScopedStudents = React.useMemo(() => {
    return allCourseStudents.filter(item => {
      if (selectedSecFilter === 'ALL_SEC') return true;
      return isMatchingSec(item.secId, selectedSecFilter);
    });
  }, [allCourseStudents, selectedSecFilter]);

  // Derive Summary Counters directly from secScopedStudents to guarantee 100% data integrity
  const totalStudentsCount = secScopedStudents.length;
  const submittedCount = secScopedStudents.filter(s => s.status === 'submitted').length;
  const gradedCount = secScopedStudents.filter(s => s.status === 'graded').length;
  const notSubmittedCount = secScopedStudents.filter(s => s.status === 'not_submitted').length;
  const totalSubmissionsSubmitted = submittedCount + gradedCount;

  // Filtered Students for the table
  const filteredStudents = React.useMemo(() => {
    return secScopedStudents.filter(item => {
      // Status filter
      if (statusFilter === 'submitted' && item.status !== 'submitted') return false;
      if (statusFilter === 'graded' && item.status !== 'graded') return false;
      if (statusFilter === 'not_submitted' && item.status !== 'not_submitted') return false;

      // Search filter
      if (searchStudentTerm.trim()) {
        const q = searchStudentTerm.toLowerCase();
        const sName = (item.studentName || item.name || '').toLowerCase();
        const sCode = (item.studentCode || item.studentId || '').toLowerCase();
        const sSec = (item.secId || '').toLowerCase();
        if (!sName.includes(q) && !sCode.includes(q) && !sSec.includes(q)) return false;
      }
      return true;
    });
  }, [secScopedStudents, statusFilter, searchStudentTerm]);

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6 text-left font-sans">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
          <button 
            onClick={onBack} 
            className="hover:text-blue-600 flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">กลับไปยังรายวิชา (Back)</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-600 font-medium">{assignment.courseName}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold">ส่งการบ้าน & ดูรายละเอียด</span>
        </div>

        {/* Toggle Tabs: Details vs Instructor Submissions / Grading View */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setInstructorViewTab('details')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              instructorViewTab === 'details' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>หน้ารายละเอียดงาน</span>
          </button>
          <button
            onClick={() => {
              setInstructorViewTab('submissions');
              loadInstructorData();
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              instructorViewTab === 'submissions' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ตรวจงานนักศึกษา ({totalSubmissionsSubmitted} ส่งแล้ว)</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-sm">บันทึกผลการตรวจเรียบร้อยแล้ว!</h4>
              <p className="text-xs text-white/90">คะแนนและความคิดเห็นถูกบันทึกเข้าระบบเรียบร้อยแล้ว</p>
            </div>
          </div>
          <button onClick={() => setSuccessToast(false)} className="text-white/80 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INSTRUCTOR SUBMISSIONS TAB (INDIVIDUAL ISOLATED SUBMISSIONS BY SEC) */}
      {/* ========================================================================= */}
      {instructorViewTab === 'submissions' ? (
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-xs flex flex-col gap-6">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                  {assignment.module || 'Assignment'}
                </span>
                {assignment.targetSecId && assignment.targetSecId !== 'ALL_SEC' ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    กลุ่มเป้าหมาย: {assignment.targetSecId}
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    ทุกกลุ่มเรียน (ALL SEC)
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{assignment.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                คะแนนเต็ม {assignment.points} คะแนน • กำหนดส่ง {assignment.dueDate}
              </p>
            </div>

            {/* SEC Selector Dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-bold text-slate-700">กลุ่มเรียน:</span>
                <select
                  value={selectedSecFilter}
                  onChange={(e) => setSelectedSecFilter(e.target.value)}
                  className="bg-transparent font-bold text-indigo-900 focus:outline-none cursor-pointer"
                >
                  <option value="ALL_SEC">All SEC (ทุกกลุ่ม)</option>
                  {courseSections.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>

              {/* Toggle Resubmission */}
              <button
                onClick={handleToggleAllowResubmission}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  allowResubmission 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
                title="คลิกเพื่อเปลี่ยนการตั้งค่าให้นักศึกษาแก้ไขงานได้หรือไม่"
              >
                {allowResubmission ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>อนุญาตให้แก้ไขงาน</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    <span>ส่งได้ครั้งเดียว (ล็อก)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stat Summary Cards - Directly synced with secScopedStudents */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              onClick={() => setStatusFilter('all')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                statusFilter === 'all' 
                  ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20' 
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-bold text-slate-500 block">นักศึกษาทั้งหมด</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {totalStudentsCount}
              </span>
            </div>

            <div 
              onClick={() => setStatusFilter('submitted')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                statusFilter === 'submitted' 
                  ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20' 
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-bold text-amber-700 block">ส่งแล้ว (รอตรวจ)</span>
              <span className="text-2xl font-black text-amber-900 mt-1 block">
                {submittedCount}
              </span>
            </div>

            <div 
              onClick={() => setStatusFilter('graded')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                statusFilter === 'graded' 
                  ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20' 
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-bold text-emerald-700 block">ตรวจแล้ว</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">
                {gradedCount}
              </span>
            </div>

            <div 
              onClick={() => setStatusFilter('not_submitted')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                statusFilter === 'not_submitted' 
                  ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20' 
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-bold text-rose-700 block">ยังไม่ส่งงาน</span>
              <span className="text-2xl font-black text-rose-900 mt-1 block">
                {notSubmittedCount}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อนักศึกษา, รหัสนักศึกษา หรือกลุ่ม SEC..."
              value={searchStudentTerm}
              onChange={(e) => setSearchStudentTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Student Submissions List */}
          {isLoadingSummary ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-xs font-medium">กำลังโหลดข้อมูลการส่งงาน...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-300" />
              <p className="font-bold text-sm text-slate-700">
                {statusFilter === 'submitted' 
                  ? 'ยังไม่มีนักศึกษาส่งงาน' 
                  : statusFilter === 'graded' 
                  ? 'ยังไม่มีงานที่ตรวจแล้ว' 
                  : statusFilter === 'not_submitted' 
                  ? 'ไม่มีนักศึกษาที่ค้างส่งงาน' 
                  : 'ไม่พบรายชื่อนักศึกษา'}
              </p>
              <p className="text-xs">
                {statusFilter === 'submitted' 
                  ? `นักศึกษาในกลุ่ม ${selectedSecFilter === 'ALL_SEC' ? 'ทั้งหมด' : selectedSecFilter} ยังไม่มีการส่งงานที่รอตรวจ` 
                  : 'ลองเปลี่ยนกลุ่ม SEC หรือปรับตัวกรองสถานะ'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((item) => {
                const sub = item.submission;
                const isSub = item.status === 'submitted' || item.status === 'graded';
                return (
                  <div 
                    key={item.studentId} 
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col gap-4 hover:border-slate-300 transition-all"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.studentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                          alt={item.studentName} 
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{item.studentName}</h4>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {item.secId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            รหัส: <strong className="text-slate-600">{item.studentCode}</strong>
                            {sub?.submittedAt && ` • ส่งเมื่อ: ${sub.submittedAt}`}
                            {sub?.version && sub.version > 1 && ` (เวอร์ชัน ${sub.version})`}
                          </p>
                        </div>
                      </div>

                      {/* Badges & Action */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.status === 'graded' && sub?.grade !== undefined ? (
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ตรวจแล้ว: {sub.grade} / {assignment.points} คะแนน</span>
                          </span>
                        ) : item.status === 'submitted' ? (
                          <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>ส่งงานแล้ว (รอการตรวจ)</span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold bg-slate-200/70 text-slate-600 px-3 py-1.5 rounded-xl">
                            ยังไม่ได้ส่งงาน
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenGradingModal(item)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{item.status === 'graded' ? 'แก้ไขคะแนน' : 'ตรวจงาน'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Submitted Files */}
                    {sub?.files && sub.files.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-700 mb-2">ไฟล์และรูปภาพที่ส่ง ({sub.files.length}):</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {sub.files.map((file, idx) => {
                            const isImg = file.type?.startsWith('image') || /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                            return (
                              <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {isImg && file.dataUrl ? (
                                    <img 
                                      src={file.dataUrl} 
                                      alt={file.name} 
                                      onClick={() => setPreviewImage({ url: file.dataUrl!, title: file.name })}
                                      className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:opacity-80 shrink-0"
                                    />
                                  ) : (
                                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate" title={file.name}>{file.name}</p>
                                    <p className="text-[10px] text-slate-400">{file.size}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  {isImg && file.dataUrl && (
                                    <button
                                      onClick={() => setPreviewImage({ url: file.dataUrl!, title: file.name })}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                                      title="ดูรูปภาพ"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDownloadFile(file)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                                    title="ดาวน์โหลด"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Text Entry from Student */}
                    {sub?.textEntry && (
                      <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs">
                        <p className="font-bold text-slate-700 mb-1">ข้อความแนบส่งงาน:</p>
                        <p className="text-slate-600 whitespace-pre-wrap">{sub.textEntry}</p>
                      </div>
                    )}

                    {/* Instructor Feedback Display */}
                    {sub?.feedback && (
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs">
                        <p className="font-bold text-emerald-900">ข้อเสนอแนะจากอาจารย์:</p>
                        <p className="text-emerald-950 mt-0.5 whitespace-pre-wrap">{sub.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Grading Modal */}
          {gradingStudent && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">ตรวจให้คะแนนนักศึกษา</h3>
                    <p className="text-xs text-slate-500">
                      {gradingStudent.studentName} ({gradingStudent.studentCode}) • {gradingStudent.secId}
                    </p>
                  </div>
                  <button onClick={() => setGradingStudent(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Maximum points constraint & visual indication */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        คะแนนที่ได้ (คะแนนเต็ม {assignment.points} คะแนน)
                      </label>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        คะแนนเต็ม: {assignment.points}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={assignment.points}
                        value={gradeInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setGradeInput('' as any);
                            return;
                          }
                          let num = Number(val);
                          if (isNaN(num)) return;
                          // Strictly enforce maximum points from assignment creation
                          if (num > assignment.points) {
                            num = assignment.points;
                          } else if (num < 0) {
                            num = 0;
                          }
                          setGradeInput(num);
                        }}
                        placeholder={`0 - ${assignment.points}`}
                        className={`w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          Number(gradeInput) > assignment.points ? 'border-red-400 text-red-600 bg-red-50/30' : 'border-slate-200 text-slate-900'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                        / {assignment.points}
                      </div>
                    </div>

                    {/* Warning if exceeds maximum */}
                    {Number(gradeInput) > assignment.points && (
                      <p className="text-[11px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>ไม่สามารถใส่คะแนนเกินคะแนนเต็มที่ตั้งไว้ ({assignment.points} คะแนน)</span>
                      </p>
                    )}

                    {/* Quick Points Preset Buttons */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[11px] text-slate-400">เลือกคะแนนด่วน:</span>
                      <button
                        type="button"
                        onClick={() => setGradeInput(assignment.points)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer transition-colors"
                      >
                        เต็ม 100% ({assignment.points})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeInput(Math.round(assignment.points * 0.8))}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                      >
                        80% ({Math.round(assignment.points * 0.8)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeInput(Math.round(assignment.points * 0.5))}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                      >
                        50% ({Math.round(assignment.points * 0.5)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeInput(0)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                      >
                        0
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ข้อเสนอแนะและความคิดเห็นของอาจารย์ (Feedback)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="ใส่คำแนะนำหรือความคิดเห็นสำหรับนักศึกษาคนนี้..."
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {gradeModalError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{gradeModalError}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setGradingStudent(null)}
                    disabled={isSavingGrade}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveGrade}
                    disabled={Number(gradeInput) > assignment.points || isSavingGrade}
                    className={`px-5 py-2 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5 ${
                      Number(gradeInput) > assignment.points || isSavingGrade
                        ? 'bg-slate-400 cursor-not-allowed opacity-60' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{isSavingGrade ? 'กำลังบันทึก...' : 'บันทึกผลการตรวจ'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* MAIN VIEW: ASSIGNMENT INSTRUCTIONS & STUDENT'S ISOLATED SUBMISSION BOX */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* Left Column: Assignment Details & Submission Box */}
          <div className="flex flex-col gap-6">
            {/* Assignment Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col gap-5">
              {/* Top Badges & Meta */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    mySubmission?.grade !== undefined
                      ? 'bg-emerald-100 text-emerald-800'
                      : isAlreadySubmitted
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {mySubmission?.grade !== undefined 
                      ? `ตรวจแล้ว (${mySubmission.grade}/${assignment.points} คะแนน)` 
                      : isAlreadySubmitted 
                      ? 'ส่งงานแล้ว (Submitted)' 
                      : 'ยังไม่ส่ง (Not Submitted)'}
                  </span>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    {assignment.module || 'Assignment'}
                  </span>
                  {assignment.targetSecId && assignment.targetSecId !== 'ALL_SEC' ? (
                    <span className="text-xs font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                      เฉพาะกลุ่ม {assignment.targetSecId}
                    </span>
                  ) : (
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                      ทุกกลุ่มเรียน (ALL SEC)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                  {/* Instructor Resubmission Toggle */}
                  {isInstructor && (
                    <button
                      onClick={handleToggleAllowResubmission}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                        allowResubmission 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                      title="คลิกเพื่อเปลี่ยนการตั้งค่าให้นักศึกษาแก้ไขงานได้หรือไม่"
                    >
                      {allowResubmission ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>สิทธิ์: นักศึกษาแก้ไขงานได้</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                          <span>สิทธิ์: ส่งได้ครั้งเดียว (ล็อก)</span>
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>{assignment.points} คะแนน</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>กำหนดส่ง: {assignment.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Title & Course */}
              <div>
                <h1 className="text-2xl font-black text-slate-900 leading-tight">
                  {assignment.title}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  วิชา: <strong>{assignment.courseName}</strong>
                </p>
              </div>

              {/* Instructions Box */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  คำสั่งและขั้นตอนการส่งงาน (Instructions)
                </h3>
                {assignment.instructions && assignment.instructions.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {assignment.instructions.map((inst, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{inst}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-600">กรุณาจัดทำรายงานหรือเอกสารตามที่ได้รับมอบหมายในห้องเรียน และอัปโหลดไฟล์ส่งตามกำหนดเวลา</p>
                )}

                {/* Template Download */}
                {assignment.templateFileName && (
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                      <Paperclip className="w-4 h-4" />
                      <span>{assignment.templateFileName}</span>
                    </div>
                    <button
                      onClick={() => alert(`กำลังดาวน์โหลดแบบฟอร์ม: ${assignment.templateFileName}`)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-3.5 py-1.5 rounded-xl hover:bg-blue-50 shadow-2xs transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดแบบฟอร์มงาน</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Container */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">การส่งงานของคุณ (Your Submission)</h3>
                  <p className="text-xs text-slate-500">
                    {isAlreadySubmitted && !isEditingSubmission
                      ? 'ข้อมูลและไฟล์ที่คุณได้ส่งให้อาจารย์เรียบร้อยแล้ว'
                      : 'อัปโหลดไฟล์เอกสาร หรือรูปภาพผลงานของคุณ (ระบบแยกส่งรายบุคคลอย่างเป็นอิสระ)'}
                  </p>
                </div>
                
                {/* Mode Tabs (only when not submitted yet or in edit mode) */}
                {(!isAlreadySubmitted || isEditingSubmission) && (
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setSubmissionTab('upload')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        submissionTab === 'upload' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      อัปโหลดไฟล์/รูปภาพ
                    </button>
                    <button
                      onClick={() => setSubmissionTab('text')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        submissionTab === 'text' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      พิมพ์ข้อความส่งงาน
                    </button>
                  </div>
                )}
              </div>

              {/* CASE 1: ALREADY SUBMITTED (NOT IN EDITING MODE) -> DISPLAY SUBMISSION SUMMARY & RESUBMIT BUTTON */}
              {isAlreadySubmitted && !isEditingSubmission && mySubmission && (
                <div className="flex flex-col gap-4">
                  <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          ✓
                        </div>
                        <div>
                          <span className="text-sm font-bold text-emerald-950 block">ส่งงานเรียบร้อยแล้ว (Turned In)</span>
                          <span className="text-xs text-emerald-700">ส่งเมื่อ: {mySubmission.submittedAt}</span>
                        </div>
                      </div>

                      {/* Resubmit button / lock status */}
                      <div className="flex items-center gap-2">
                        {allowResubmission ? (
                          <button
                            onClick={handleStartEdit}
                            className="px-4 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                            <span>แก้ไขการส่งงาน / ส่งใหม่</span>
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>ส่งได้ครั้งเดียว (ไม่อนุญาตให้แก้ไข)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Graded info if available */}
                    {mySubmission.grade !== undefined && (
                      <div className="mt-2 p-3.5 bg-white/90 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900">ผลการประเมินคะแนน:</span>
                          <span className="text-sm font-black text-emerald-700">
                            {mySubmission.grade} / {assignment.points} คะแนน
                          </span>
                        </div>
                        {mySubmission.feedback && (
                          <div className="mt-2 pt-2 border-t border-emerald-100 text-xs text-slate-700">
                            <strong className="text-slate-900">ข้อคิดเห็นจากอาจารย์: </strong>
                            {mySubmission.feedback}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submitted Files List */}
                  {mySubmission.files && mySubmission.files.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 mb-2">ไฟล์ที่คุณแนบส่ง ({mySubmission.files.length} รายการ):</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {mySubmission.files.map((file, idx) => {
                          const isImg = file.type?.startsWith('image') || /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isImg && file.dataUrl ? (
                                  <img 
                                    src={file.dataUrl} 
                                    alt={file.name} 
                                    onClick={() => setPreviewImage({ url: file.dataUrl!, title: file.name })}
                                    className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:opacity-80 shrink-0" 
                                  />
                                ) : (
                                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate" title={file.name}>{file.name}</p>
                                  <p className="text-[10px] text-slate-400">{file.size}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {isImg && file.dataUrl && (
                                  <button
                                    onClick={() => setPreviewImage({ url: file.dataUrl!, title: file.name })}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white cursor-pointer"
                                    title="ดูรูปภาพ"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDownloadFile(file)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white cursor-pointer"
                                  title="ดาวน์โหลด"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Submitted Text Note */}
                  {mySubmission.textEntry && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <p className="font-bold text-slate-800 mb-1">ข้อความที่คุณแนบส่ง:</p>
                      <p className="text-slate-600 whitespace-pre-wrap">{mySubmission.textEntry}</p>
                    </div>
                  )}
                </div>
              )}

              {/* CASE 2: NOT SUBMITTED YET OR IN EDIT MODE -> SHOW UPLOAD / TEXT ENTRY FORM */}
              {(!isAlreadySubmitted || isEditingSubmission) && (
                <div className="flex flex-col gap-4">
                  {isEditingSubmission && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>คุณกำลังอยู่ในโหมดแก้ไขการส่งงาน กรุณาอัปโหลดหรือแก้ไขข้อมูลแล้วกดยืนยันอีกครั้ง</span>
                      </div>
                      <button
                        onClick={handleCancelEdit}
                        className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
                      >
                        ยกเลิกการแก้ไข
                      </button>
                    </div>
                  )}

                  {submissionTab === 'upload' ? (
                    <div className="flex flex-col gap-4">
                      {/* Hidden File Inputs */}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        multiple 
                        className="hidden" 
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                      />
                      <input 
                        type="file" 
                        ref={imageInputRef} 
                        onChange={handleFileChange} 
                        multiple 
                        className="hidden" 
                        accept="image/*"
                      />

                      {/* Drag & Drop Upload Zone */}
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">ลากไฟล์หรือรูปภาพมาวางที่นี่</h4>
                          <p className="text-xs text-slate-400 mt-0.5">รองรับเอกสาร (PDF, Word, Zip) หรือไฟล์รูปภาพผลงาน</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>เลือกไฟล์เอกสาร</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>เลือกรูปภาพ</span>
                          </button>
                        </div>
                      </div>

                      {/* Uploaded Files Preview List */}
                      {uploadedFiles.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs font-bold text-slate-700">ไฟล์ที่เลือกพร้อมส่ง ({uploadedFiles.length}):</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {uploadedFiles.map((file, idx) => {
                              const isImg = file.type?.startsWith('image') || /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                              return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {isImg && file.dataUrl ? (
                                      <img 
                                        src={file.dataUrl} 
                                        alt={file.name} 
                                        onClick={() => setPreviewImage({ url: file.dataUrl!, title: file.name })}
                                        className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:opacity-80 shrink-0" 
                                      />
                                    ) : (
                                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-800 truncate" title={file.name}>{file.name}</p>
                                      <p className="text-[10px] text-slate-400">{file.size}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {isImg && file.dataUrl && (
                                      <button
                                        onClick={() => setPreviewImage({ url: file.dataUrl!, title: file.name })}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white cursor-pointer"
                                        title="ดูรูปภาพ"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleRemoveFile(idx)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white cursor-pointer"
                                      title="ลบไฟล์"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Text Entry Mode */
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-700">พิมพ์คำตอบหรือลิงก์ผลงานของคุณ:</label>
                      <textarea
                        rows={6}
                        placeholder="พิมพ์เนื้อหาการบ้าน คำอธิบาย หรือวางลิงก์ Google Docs, GitHub, Canva..."
                        value={textEntry}
                        onChange={(e) => setTextEntry(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  )}

                  {/* Submission Action Button */}
                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>กำลังส่งงาน...</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4" />
                          <span>{isEditingSubmission ? 'บันทึกการแก้ไขการส่งงาน' : 'ยืนยันการส่งงาน (Submit)'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Submission Info & Class Discussion */}
          <div className="flex flex-col gap-6">
            {/* Status Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col gap-4">
              <h3 className="font-bold text-slate-900 text-sm">ข้อมูลสถานะของคุณ</h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">สถานะการส่ง:</span>
                  <span className={`font-bold ${
                    mySubmission?.grade !== undefined
                      ? 'text-emerald-700'
                      : isAlreadySubmitted 
                      ? 'text-blue-600' 
                      : 'text-amber-600'
                  }`}>
                    {mySubmission?.grade !== undefined 
                      ? 'ตรวจแล้ว' 
                      : isAlreadySubmitted 
                      ? 'ส่งแล้ว' 
                      : 'ยังไม่ส่ง'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">กลุ่มเรียนที่ลงทะเบียน:</span>
                  <span className="font-bold text-slate-800">
                    {studentEnrolledSec || 'SEC 1'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">กลุ่มเป้าหมายการบ้าน:</span>
                  <span className="font-bold text-slate-800">
                    {assignment.targetSecId && assignment.targetSecId !== 'ALL_SEC' ? assignment.targetSecId : 'ทุกกลุ่ม (ALL)'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">คะแนนเต็ม:</span>
                  <span className="font-bold text-slate-800">{assignment.points} คะแนน</span>
                </div>

                {mySubmission?.grade !== undefined && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 bg-emerald-50 px-2 rounded-lg">
                    <span className="font-bold text-emerald-900">คะแนนที่คุณได้:</span>
                    <span className="font-black text-emerald-700 text-sm">
                      {mySubmission.grade} / {assignment.points}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Class Discussion */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col gap-4">
              <h3 className="font-bold text-slate-900 text-sm">กระดานสนทนาประจำงาน</h3>
              
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {discussionComments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">ยังไม่มีข้อความสนทนาในงานนี้</p>
                ) : (
                  discussionComments.map((com) => (
                    <div key={com.id} className="p-3 bg-slate-50 rounded-xl text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <img 
                          src={com.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                          alt={com.authorName} 
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-800">{com.authorName}</span>
                        <span className="text-[10px] text-slate-400">{com.timestamp}</span>
                      </div>
                      <p className="text-slate-600 pl-7">{com.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleSendDiscussion} className="flex gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="พิมพ์ข้อความถามอาจารย์หรือเพื่อน..."
                  value={discussionInput}
                  onChange={(e) => setDiscussionInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full text-white px-2">
              <span className="text-xs font-bold truncate max-w-md">{previewImage.title}</span>
              <button 
                onClick={() => setPreviewImage(null)} 
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={previewImage.url} 
              alt={previewImage.title} 
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
