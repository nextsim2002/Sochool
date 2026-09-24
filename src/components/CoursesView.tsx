import React, { useState, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Compass, 
  Search, 
  Settings, 
  BookOpen, 
  MessageSquare, 
  CheckCircle2, 
  FileText, 
  Clock, 
  ChevronRight, 
  Send, 
  Image as ImageIcon, 
  MoreHorizontal, 
  AlertCircle, 
  ShieldCheck, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Calendar,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
  UserX,
  Share2,
  Lock,
  Globe,
  Paperclip,
  Download,
  Eye,
  X,
  Palette,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Course, PostItem, Assignment, UserProfile, CoInstructorInfo, PostAttachment, ClassAnnouncement } from '../types';
import { 
  CreateCourseModal, 
  EditCourseModal, 
  ManageCoInstructorsModal, 
  DeleteCourseModal 
} from './courses/CourseModals';
import { 
  AssignmentModal, 
  CancelClassModal 
} from './courses/CourseActivityModals';
import { ClassPageCustomizeModal } from './courses/ClassPageCustomizeModal';
import { UserProfileModal } from './profile/UserProfileModal';
import { JoinSectionModal } from './courses/JoinSectionModal';
import { CreateAnnouncementModal } from './courses/CreateAnnouncementModal';
import { EditPostModal } from './EditPostModal';

interface CoursesViewProps {
  onSelectAssignment?: (assignmentId: string) => void;
  onOpenAssignment?: (assignmentId: string, initialTab?: 'details' | 'submissions') => void;
  onOpenNewPost?: () => void;
  onNavigateToMessages?: (threadId?: string) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({ 
  onSelectAssignment, 
  onOpenAssignment, 
  onOpenNewPost,
  onNavigateToMessages
}) => {
  const { user } = useAuth();
  const { 
    courses, 
    activeCourseId, 
    setActiveCourseId, 
    setActiveAssignmentId,
    addCourse, 
    updateCourse, 
    deleteCourse,
    addCoInstructor,
    removeCoInstructor,
    removeStudentFromCourse,
    joinCourse, 
    leaveCourse, 
    posts, 
    addPost, 
    deletePost,
    toggleLikePost, 
    addCommentToPost,
    assignments,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    cancelCourseSession,
    restoreCourseSession,
    allInstructors,
    allUsers,
    chatThreads,
    createChatThread,
    setCurrentChatId,
    classAnnouncements,
    addClassAnnouncement,
    deleteClassAnnouncement,
    getUserEnrolledSec
  } = useData();

  // Navigation states
  const [navMode, setNavMode] = useState<'feed' | 'discover' | 'course'>('course');
  const [selectedCourseTab, setSelectedCourseTab] = useState<'discussion' | 'curriculum' | 'assignments' | 'members' | 'schedule' | 'about'>('discussion');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCoInstructorsModal, setShowCoInstructorsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserProfile | null>(null);
  const [showJoinSecModal, setShowJoinSecModal] = useState(false);
  const [courseToJoin, setCourseToJoin] = useState<Course | null>(null);
  const [showCreateAnnModal, setShowCreateAnnModal] = useState(false);
  const [instructorSelectedSec, setInstructorSelectedSec] = useState<string>('ALL_SEC');
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);

  // Discussion state
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postAttachment, setPostAttachment] = useState<PostAttachment | null>(null);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const coursePhotoInputRef = useRef<HTMLInputElement>(null);
  const courseFileInputRef = useRef<HTMLInputElement>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const currentUserId = user?.uid || 'guest';
  const isInstructorRole = user?.role === 'instructor';

  const handleOpenAssignment = (assignId: string, initialTab: 'details' | 'submissions' = 'details') => {
    setActiveAssignmentId(assignId);
    if (onOpenAssignment) {
      onOpenAssignment(assignId, initialTab);
    } else if (onSelectAssignment) {
      onSelectAssignment(assignId);
    }
  };

  // Active selected course
  const activeCourse = courses.find(c => c.id === activeCourseId) || courses[0] || null;

  // Check if current user is Lead Instructor
  const isLeadInstructor = (course: Course | null) => {
    if (!course || !user) return false;
    return Boolean(
      (course.instructorId && course.instructorId === user.uid) ||
      (course.instructor && user.name && course.instructor.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
      (course.enrolledStudents && user.uid && course.enrolledStudents.includes(user.uid) && isInstructorRole)
    );
  };

  // Check if current user is Co-Instructor
  const isCoInstructor = (course: Course | null) => {
    if (!course || !user || !course.coInstructors) return false;
    return course.coInstructors.some(co => 
      co === user.uid || 
      (user.name && co.toLowerCase() === user.name.toLowerCase()) ||
      (user.email && co.toLowerCase() === user.email.toLowerCase())
    );
  };

  // Check if user has management permissions (Lead OR Co-Instructor OR Creator)
  const canManageCurrentCourse = isLeadInstructor(activeCourse) || 
    isCoInstructor(activeCourse) || 
    (activeCourse?.instructorId === user?.uid) ||
    (isInstructorRole && !activeCourse?.instructorId);

  // Check if student is enrolled
  const isEnrolledInCourse = (course: Course | null) => {
    if (!course || !user) return false;
    return Boolean(
      course.enrolledStudents?.includes(user.uid) || 
      (user.name && course.enrolledStudents?.includes(user.name)) ||
      course.instructorId === user.uid ||
      isLeadInstructor(course) ||
      isCoInstructor(course)
    );
  };

  // My courses / Joined courses filter
  const myCourses = courses.filter(c => isLeadInstructor(c) || isCoInstructor(c) || c.instructorId === user?.uid);
  const enrolledCourses = courses.filter(c => isEnrolledInCourse(c));

  // Filtered courses for Discover
  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // User enrolled SEC in active course
  const studentEnrolledSec = activeCourse ? getUserEnrolledSec(activeCourse.id) : undefined;
  const isStudentEnrolledInSec = Boolean(studentEnrolledSec);

  // Available sections
  const courseRawSections = activeCourse?.sections && activeCourse.sections.length > 0
    ? activeCourse.sections.filter(s => s !== 'All Sections' && s !== 'All SEC')
    : (activeCourse?.sectionSchedules && activeCourse.sectionSchedules.length > 0
       ? activeCourse.sectionSchedules.map(s => s.sectionName)
       : ['SEC 1', 'SEC 2']);
  const availableSections = courseRawSections.length > 0 ? courseRawSections : ['SEC 1'];

  // Announcements filtered strictly by SEC & scope
  const courseAnnouncements = classAnnouncements.filter(ann => {
    if (!activeCourse || ann.class_id !== activeCourse.id) return false;
    if (!isInstructorRole) {
      // Student: sees ALL_SEC OR their own enrolled SEC
      return ann.scope === 'ALL_SEC' || ann.sec_id === 'ALL_SEC' || (studentEnrolledSec && ann.sec_id === studentEnrolledSec);
    }
    // Instructor: filter by instructorSelectedSec
    if (instructorSelectedSec === 'ALL_SEC') return true;
    return ann.scope === 'ALL_SEC' || ann.sec_id === 'ALL_SEC' || ann.sec_id === instructorSelectedSec;
  });

  // Course posts strictly filtered by SEC & scope
  const coursePosts = posts.filter(p => {
    if (!activeCourse) return false;
    const isCoursePost = p.courseId === activeCourse.id || p.courseTag === activeCourse.code || p.courseTag === activeCourse.title;
    if (!isCoursePost) return false;

    if (!isInstructorRole) {
      // Student: can only view posts within their enrolled SEC or ALL_SEC
      if (p.scope === 'ALL_SEC') return true;
      if (studentEnrolledSec && p.secId) {
        return p.secId === studentEnrolledSec;
      }
      return !p.secId || p.secId === studentEnrolledSec;
    }

    // Instructor: filter by instructorSelectedSec
    if (instructorSelectedSec === 'ALL_SEC') return true;
    return p.scope === 'ALL_SEC' || p.secId === instructorSelectedSec || !p.secId;
  });

  // Course assignments strictly filtered by SEC scope (Requirement 8)
  const courseAssignments = assignments.filter(a => {
    if (!activeCourse || a.courseId !== activeCourse.id) return false;
    
    if (!isInstructorRole) {
      // Student: only sees assignments targeting ALL_SEC or their enrolled SEC
      if (!a.targetSecId || a.targetSecId === 'ALL_SEC') return true;
      return a.targetSecId === studentEnrolledSec;
    }

    // Instructor: filter by instructorSelectedSec if chosen
    if (instructorSelectedSec === 'ALL_SEC') return true;
    return !a.targetSecId || a.targetSecId === 'ALL_SEC' || a.targetSecId === instructorSelectedSec;
  });

  // Handlers
  const handleCreateCourse = async (courseData: Omit<Course, 'id'>) => {
    const created = await addCourse(courseData);
    setActiveCourseId(created.id);
    setNavMode('course');
  };

  const handleUpdateCourse = async (courseId: string, updates: Partial<Course>) => {
    await updateCourse(courseId, updates);
  };

  const handleDeleteCourse = async (courseId: string) => {
    await deleteCourse(courseId);
    setNavMode('feed');
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!postContent.trim() && !postImageUrl && !postAttachment) || !activeCourse) return;

    let targetSec = studentEnrolledSec || availableSections[0] || 'SEC 1';
    let targetScope: 'SEC' | 'ALL_SEC' = 'SEC';

    if (isInstructorRole) {
      if (instructorSelectedSec === 'ALL_SEC') {
        targetScope = 'ALL_SEC';
        targetSec = 'ALL_SEC';
      } else {
        targetSec = instructorSelectedSec;
        targetScope = 'SEC';
      }
    }

    await addPost(
      postContent.trim() || (postImageUrl ? 'แชร์รูปภาพ' : 'แชร์ไฟล์แนบ'), 
      activeCourse.code,
      postImageUrl || undefined,
      postAttachment || undefined,
      activeCourse.id,
      targetSec,
      targetScope
    );
    setPostContent('');
    setPostImageUrl('');
    setPostAttachment(null);
  };

  const handleCreateAnnouncement = async (title: string, content: string, scope: 'SEC' | 'ALL_SEC', secId: string) => {
    if (!activeCourse) return;
    await addClassAnnouncement(activeCourse.id, secId, scope, title, content);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setPostImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType: PostAttachment['type'] = 'other';
        if (['pdf'].includes(ext)) fileType = 'pdf';
        else if (['doc', 'docx'].includes(ext)) fileType = 'doc';
        else if (['zip', 'rar', '7z'].includes(ext)) fileType = 'zip';
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) fileType = 'image';

        setPostAttachment({
          name: file.name,
          size: file.size < 1024 * 1024 
            ? `${(file.size / 1024).toFixed(1)} KB` 
            : `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: fileType,
          dataUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadFile = (att: PostAttachment) => {
    if (att.dataUrl) {
      const a = document.createElement('a');
      a.href = att.dataUrl;
      a.download = att.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(`กำลังดาวน์โหลดไฟล์: ${att.name}`);
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!commentInput.trim()) return;
    await addCommentToPost(postId, commentInput);
    setCommentInput('');
    setActiveCommentPostId(null);
  };

  const handleSaveAssignment = async (assignData: Omit<Assignment, 'id'>, editId?: string) => {
    if (editId) {
      await updateAssignment(editId, assignData);
    } else {
      await addAssignment(assignData);
    }
    setEditingAssignment(null);
  };

  return (
    <div className="flex-1 bg-[#F0F2F5] min-h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden text-left font-sans">
      {/* ==========================================
          LEFT SIDEBAR (Facebook Groups Navigation)
          ========================================== */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto max-h-[calc(100vh-64px)] shadow-xs">
        <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>กลุ่มและการเรียน</span>
              <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                {courses.length}
              </span>
            </h1>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหากลุ่มหรือรหัสวิชา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 pl-9 pr-3 py-2 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Action Menu */}
        <div className="p-2 space-y-1">
          <button
            onClick={() => setNavMode('feed')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              navMode === 'feed' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${navMode === 'feed' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <span>ฟีดกิจกรรมรวม (Your Feed)</span>
          </button>

          <button
            onClick={() => setNavMode('discover')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              navMode === 'discover' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${navMode === 'discover' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <Compass className="w-4 h-4" />
            </div>
            <span>ค้นหากลุ่ม / รายวิชาทั้งหมด (Discover)</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ สร้างคลาสเรียนใหม่ (Create Course)</span>
          </button>
        </div>

        <hr className="my-2 border-slate-100" />

        {/* Instructor Managed Courses */}
        {isInstructorRole && myCourses.length > 0 && (
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-1.5 px-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">วิชาที่คุณสอน & ร่วมสอน</span>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">{myCourses.length}</span>
            </div>
            <div className="space-y-1">
              {myCourses.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCourseId(c.id);
                    setNavMode('course');
                  }}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-all ${
                    navMode === 'course' && activeCourseId === c.id 
                      ? 'bg-blue-50/80 border border-blue-200 text-blue-900 font-bold' 
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center shrink-0 font-extrabold text-xs shadow-xs`}>
                    {c.code.substring(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate font-bold text-slate-900">{c.code}</p>
                    <p className="text-[11px] truncate text-slate-500">{c.title}</p>
                  </div>
                  {isCoInstructor(c) && (
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold shrink-0">
                      Co-Teach
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Joined Groups List */}
        <div className="px-3 py-2 flex-1">
          <div className="flex items-center justify-between mb-1.5 px-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">กลุ่มที่คุณเข้าร่วม</span>
            <span className="text-[10px] text-slate-400 font-bold">{enrolledCourses.length}</span>
          </div>

          <div className="space-y-1">
            {enrolledCourses.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCourseId(c.id);
                  setNavMode('course');
                }}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-all ${
                  navMode === 'course' && activeCourseId === c.id 
                    ? 'bg-blue-50/80 border border-blue-200 text-blue-900 font-bold' 
                    : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center shrink-0 font-extrabold text-xs shadow-xs`}>
                  {c.code.substring(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate font-bold text-slate-900">{c.code} - {c.title}</p>
                  <p className="text-[11px] truncate text-slate-500">อ. {c.instructor}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ==========================================
          MAIN CONTENT AREA
          ========================================== */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-64px)] p-4 md:p-6 flex flex-col items-center">
        {/* ==========================================
            MODE 1: ALL COURSES DISCOVER
            ========================================== */}
        {navMode === 'discover' && (
          <div className="w-full max-w-4xl flex flex-col gap-6">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900">สำรวจและเข้าร่วมรายวิชา (Discover Courses)</h2>
                <p className="text-xs text-slate-500">เลือกเข้าร่วมรายวิชาเพื่อรับข้อมูลข่าวสาร การบ้าน และตารางเรียน</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>สร้างวิชาใหม่</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.map(course => {
                const enrolled = isEnrolledInCourse(course);
                const isMyCourse = isLeadInstructor(course) || isCoInstructor(course);

                return (
                  <div key={course.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className={`h-24 bg-gradient-to-r ${course.color} p-4 flex items-start justify-between text-white`}>
                        <span className="text-xs font-extrabold bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full uppercase">
                          {course.code}
                        </span>
                        <span className="text-xs font-semibold bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full">
                          {course.type === 'workshop' ? 'Workshop' : 'Regular Course'}
                        </span>
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-sm text-slate-900 mb-1">{course.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{course.description}</p>

                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                          <img src={course.instructorAvatar} alt={course.instructor} className="w-5 h-5 rounded-full object-cover" />
                          <span>ผู้สอนหลัก: <strong>{course.instructor}</strong></span>
                        </div>

                        {course.coInstructors && course.coInstructors.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg mb-2">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>มีอาจารย์ร่วมสอน {course.coInstructors.length} ท่าน</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        👥 สมาชิก {course.enrolledCount || 1} คน
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveCourseId(course.id);
                            setNavMode('course');
                          }}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                        >
                          เข้าดู
                        </button>
                        
                        {!enrolled ? (
                          <button
                            onClick={() => {
                              setCourseToJoin(course);
                              setShowJoinSecModal(true);
                            }}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            เข้าร่วมกลุ่ม (เลือก SEC)
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>เข้าร่วมแล้ว ({getUserEnrolledSec(course.id)})</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================
            MODE 2: GENERAL FEED OF ALL GROUPS
            ========================================== */}
        {navMode === 'feed' && (
          <div className="w-full max-w-2xl flex flex-col gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">ฟีดกิจกรรมรวม (All Courses Activity)</h2>
                  <p className="text-xs text-slate-500">โพสต์และประกาศล่าสุดจากทุกรายวิชา</p>
                </div>
              </div>
            </div>

            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img src={post.authorAvatar} alt={post.authorName} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900">{post.authorName}</h4>
                        {post.authorBadge && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                            {post.authorBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{post.timeAgo} • ในกลุ่ม <strong className="text-blue-600">{post.courseTag}</strong></p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed mb-3">{post.content}</p>

                {post.imageUrl && (
                  <img src={post.imageUrl} alt="attachment" className="rounded-xl max-h-60 w-full object-cover mb-3" />
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <button
                    onClick={() => toggleLikePost(post.id)}
                    className={`font-bold flex items-center gap-1 hover:text-blue-600 ${
                      post.likedBy?.includes(currentUserId) ? 'text-blue-600' : ''
                    }`}
                  >
                    👍 ถูกใจ ({post.likes || 0})
                  </button>
                  <span>💬 ความคิดเห็น ({post.commentsCount || 0})</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==========================================
            MODE 3: SINGLE COURSE GROUP VIEW (Facebook Style)
            ========================================== */}
        {navMode === 'course' && activeCourse && (
          <div className="w-full max-w-4xl flex flex-col gap-4 pb-12">
            {/* Header Banner */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs relative">
              <div className={`h-44 md:h-56 bg-linear-to-r ${activeCourse.color} p-6 flex flex-col justify-between text-white relative overflow-hidden`}>
                {/* Custom Banner Image if set */}
                {activeCourse.bannerImage && (
                  <img 
                    src={activeCourse.bannerImage} 
                    alt="Course Banner" 
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-black/40 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-wider">
                      {activeCourse.code}
                    </span>
                    <span className="text-xs font-medium bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      <span>กลุ่มสาธารณะสำหรับคลาส</span>
                    </span>
                  </div>

                  {/* Instructor Controls */}
                  {canManageCurrentCourse && (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button
                        onClick={() => setShowCustomizeModal(true)}
                        className="px-3 py-1.5 bg-white/25 hover:bg-white/35 backdrop-blur-md text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>🎨 ตกแต่งเพจวิชา</span>
                      </button>
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไขข้อมูล</span>
                      </button>
                      <button
                        onClick={() => setShowCoInstructorsModal(true)}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>อาจารย์ร่วม</span>
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="p-1.5 bg-red-600/60 hover:bg-red-600 text-white rounded-xl transition-all"
                        title="ลบวิชานี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative z-10">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
                    {activeCourse.title}
                  </h1>
                  <p className="text-xs text-white/95 font-medium mt-1 drop-shadow-xs">
                    📍 {activeCourse.location || 'อาคารบรรยายรวม'} • 👥 {activeCourse.enrolledCount || 1} สมาชิก {activeCourse.sections && activeCourse.sections.length > 0 ? `• 📚 ${activeCourse.sections.length} กลุ่มเรียน (Sections)` : ''}
                  </p>
                </div>
              </div>

              {/* Pinned Welcome / Important Announcement if configured */}
              {activeCourse.welcomeAnnouncement && (
                <div className="bg-linear-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border-b border-indigo-100 p-3.5 px-6 flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">ประกาศสำคัญประจำรายวิชา</span>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed mt-0.5">{activeCourse.welcomeAnnouncement}</p>
                  </div>
                </div>
              )}

              {/* Group Subheader / Info Bar */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <img 
                    src={activeCourse.instructorAvatar} 
                    alt={activeCourse.instructor} 
                    onClick={() => {
                      const instName = activeCourse.instructor || 'Instructor';
                      const matched = allUsers.find(u => (activeCourse.instructorId && u.uid === activeCourse.instructorId) || (u.name && u.name === instName));
                      if (matched) setSelectedProfileUser(matched);
                      else setSelectedProfileUser({
                        uid: activeCourse.instructorId || 'inst-1',
                        name: instName,
                        role: 'instructor',
                        avatar: activeCourse.instructorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                        email: `${instName.toLowerCase().replace(/\s+/g, '')}@university.edu`,
                        gradeLevel: 'Lead Course Instructor',
                        bio: `ผู้สอนรายวิชา ${activeCourse.code || ''} ${activeCourse.title || ''}`
                      });
                    }}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500 shadow-xs cursor-pointer hover:scale-105 transition-transform" 
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 
                        onClick={() => {
                          const instName = activeCourse.instructor || 'Instructor';
                          const matched = allUsers.find(u => (activeCourse.instructorId && u.uid === activeCourse.instructorId) || (u.name && u.name === instName));
                          if (matched) setSelectedProfileUser(matched);
                          else setSelectedProfileUser({
                            uid: activeCourse.instructorId || 'inst-1',
                            name: instName,
                            role: 'instructor',
                            avatar: activeCourse.instructorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                            email: `${instName.toLowerCase().replace(/\s+/g, '')}@university.edu`,
                            gradeLevel: 'Lead Course Instructor',
                            bio: `ผู้สอนรายวิชา ${activeCourse.code || ''} ${activeCourse.title || ''}`
                          });
                        }}
                        className="font-bold text-sm text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        อ. {activeCourse.instructor || 'ผู้สอน'}
                      </h3>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        ผู้สอนหลัก (Lead)
                      </span>
                    </div>

                    {/* Co-Instructors Preview */}
                    {activeCourse.coInstructors && activeCourse.coInstructors.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-slate-500 font-medium">อาจารย์ร่วมสอน:</span>
                        <div className="flex items-center -space-x-1.5">
                          {(activeCourse.coInstructorDetails || []).map((co, idx) => (
                            <img
                              key={idx}
                              src={co.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                              alt={co.name || 'Co-Instructor'}
                              title={`${co.name || 'Co-Instructor'} (${co.roleTitle || 'อาจารย์ร่วมสอน'})`}
                              onClick={() => {
                                const coName = co.name || 'Co-Instructor';
                                const matched = allUsers.find(u => (co.uid && u.uid === co.uid) || (u.name && u.name === coName));
                                if (matched) setSelectedProfileUser(matched);
                                else setSelectedProfileUser({
                                  uid: co.uid || `co-inst-${idx}`,
                                  name: coName,
                                  role: 'instructor',
                                  avatar: co.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                                  email: `${coName.toLowerCase().replace(/\s+/g, '')}@university.edu`,
                                  gradeLevel: co.roleTitle || 'Co-Instructor',
                                  bio: `อาจารย์ร่วมสอนรายวิชา ${activeCourse.code || ''}`
                                });
                              }}
                              className="w-5 h-5 rounded-full ring-2 ring-white object-cover cursor-pointer hover:scale-110 transition-transform"
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-indigo-700">
                          +{activeCourse.coInstructors.length} ท่าน
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Jump to Group / Section Chat Button */}
                  <button
                    onClick={async () => {
                      if (onNavigateToMessages) {
                        // Find matching chat thread for this course
                        const thread = chatThreads.find(t => t.courseId === activeCourse.id || t.name.includes(activeCourse.code));
                        if (thread) {
                          setCurrentChatId(thread.id);
                          onNavigateToMessages(thread.id);
                        } else {
                          const newThread = await createChatThread(`${activeCourse.code} Group Chat`, true, activeCourse.id);
                          onNavigateToMessages(newThread.id);
                        }
                      }
                    }}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>💬 แชทประจำวิชา</span>
                  </button>

                  {canManageCurrentCourse ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-bold text-slate-700">มุมมองกลุ่ม (SEC):</span>
                        <select
                          value={instructorSelectedSec}
                          onChange={(e) => setInstructorSelectedSec(e.target.value)}
                          className="bg-transparent font-bold text-indigo-900 focus:outline-none cursor-pointer"
                        >
                          <option value="ALL_SEC">All SEC (ทุกกลุ่มเรียน)</option>
                          {availableSections.map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>แจ้งงดคลาส</span>
                      </button>
                    </div>
                  ) : null}

                  {!isEnrolledInCourse(activeCourse) ? (
                    <button
                      onClick={() => setShowJoinSecModal(true)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ เข้าร่วมคลาส (เลือก SEC)</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowJoinSecModal(true)}
                        className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        title="คลิกเพื่อดูรายละเอียดกลุ่มเรียนของคุณ"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>กลุ่มของคุณ: {studentEnrolledSec || 'SEC 1'}</span>
                      </button>
                      {!canManageCurrentCourse && (
                        <button
                          onClick={() => leaveCourse(activeCourse.id)}
                          className="text-xs text-slate-400 hover:text-red-600 px-2 py-1 cursor-pointer"
                        >
                          ออกจากกลุ่ม
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Group Tabs (Facebook Style) */}
              <div className="flex items-center gap-1 px-4 overflow-x-auto bg-slate-50/50">
                {[
                  { key: 'discussion', label: 'ฟีดพูดคุย (Discussion)', icon: MessageSquare },
                  { key: 'curriculum', label: 'หลักสูตร & กลุ่มเรียน (Curriculum & SECs)', icon: BookOpen },
                  { key: 'assignments', label: `การบ้าน & งาน (${courseAssignments.length})`, icon: FileText },
                  { key: 'members', label: `สมาชิก & ผู้สอน (${(activeCourse.enrolledCount || 1) + (activeCourse.coInstructors?.length || 0)})`, icon: Users },
                  { key: 'schedule', label: 'ตารางเรียน', icon: Calendar },
                  { key: 'about', label: 'เกี่ยวกับกลุ่ม', icon: BookOpen },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = selectedCourseTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedCourseTab(tab.key as any)}
                      className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'border-blue-600 text-blue-600 bg-white'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB CONTENT: DISCUSSION */}
            {selectedCourseTab === 'discussion' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 flex flex-col gap-4">

                  {/* Prompt to join SEC for students who haven't selected SEC */}
                  {!isInstructorRole && !isStudentEnrolledInSec && (
                    <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-amber-950">คุณยังไม่ได้เลือกกลุ่มเรียน (SEC) สำหรับวิชานี้</h4>
                          <p className="text-[11px] text-amber-800">
                            กรุณากดเลือก SEC เพื่อเข้าสู่กลุ่มเรียน ดูประกาศ ข่าวสาร และแลกเปลี่ยนข้อมูลกับเพื่อนในกลุ่มของคุณ
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowJoinSecModal(true)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
                      >
                        + เลือก SEC ของคุณ
                      </button>
                    </div>
                  )}

                  {/* Create Post Box */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    {/* SEC Scope Indicator in Post Header */}
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">ขอบเขตการโพสต์:</span>
                      {isInstructorRole ? (
                        <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                          {instructorSelectedSec === 'ALL_SEC' ? <Globe className="w-3 h-3 text-indigo-600" /> : <Layers className="w-3 h-3 text-indigo-600" />}
                          <span>{instructorSelectedSec === 'ALL_SEC' ? 'All SEC (ทุกคนในวิชา)' : `เฉพาะกลุ่ม ${instructorSelectedSec}`}</span>
                        </span>
                      ) : (
                        <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-600" />
                          <span>กลุ่มของคุณ: {studentEnrolledSec || 'SEC 1'}</span>
                        </span>
                      )}
                    </div>

                    {/* Hidden file inputs */}
                    <input
                      type="file"
                      accept="image/*"
                      ref={coursePhotoInputRef}
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={courseFileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <form onSubmit={handlePostSubmit} className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <img 
                          src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                          alt="Me" 
                          className="w-9 h-9 rounded-full object-cover shrink-0" 
                        />
                        <div className="flex-1 flex flex-col gap-2">
                          <textarea
                            rows={2}
                            placeholder={`เขียนประกาศ ถามคำถาม หรือแชร์เอกสารใน ${activeCourse.code}...`}
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            className="w-full p-2.5 bg-slate-100 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          />

                          {/* Selected Image Preview */}
                          {postImageUrl && (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48 flex items-center justify-center">
                              <img src={postImageUrl} alt="Upload" className="max-h-48 w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setPostImageUrl('')}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg backdrop-blur-xs"
                                title="ลบรูปภาพ"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Selected Attachment Preview */}
                          {postAttachment && (
                            <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{postAttachment.name}</p>
                                  <p className="text-[10px] text-slate-500">{postAttachment.size}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPostAttachment(null)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => coursePhotoInputRef.current?.click()}
                            className="px-2.5 py-1 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 bg-slate-50 border border-slate-200/80 transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>รูปภาพ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => courseFileInputRef.current?.click()}
                            className="px-2.5 py-1 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 bg-slate-50 border border-slate-200/80 transition-colors"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                            <span>แนบไฟล์</span>
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={!postContent.trim() && !postImageUrl && !postAttachment}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>โพสต์</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Course Posts Feed */}
                  {coursePosts.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-2">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">ยังไม่มีโพสต์ในกลุ่มนี้</p>
                      <p className="text-[11px] text-slate-400">เป็นคนแรกที่เขียนประกาศ แชร์รูปภาพ หรือถามคำถามในคลาสเรียนนี้!</p>
                    </div>
                  ) : (
                    coursePosts.map(post => (
                      <div key={post.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={post.authorAvatar} alt={post.authorName} className="w-9 h-9 rounded-full object-cover" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs text-slate-900">{post.authorName}</h4>
                                {post.authorBadge && (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                                    {post.authorBadge}
                                  </span>
                                )}
                                {post.scope === 'ALL_SEC' ? (
                                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Globe className="w-2.5 h-2.5" />
                                    <span>All SEC</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Layers className="w-2.5 h-2.5" />
                                    <span>{post.secId || 'SEC 1'}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">{post.timeAgo}</p>
                            </div>
                          </div>

                          {(post.authorId === currentUserId || canManageCurrentCourse) && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingPost(post)}
                                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                title="แก้ไขโพสต์"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm('คุณต้องการลบโพสต์นี้หรือไม่?')) {
                                    await deletePost(post.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                title="ลบโพสต์"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {post.content && (
                          <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">{post.content}</p>
                        )}

                        {/* Post Image Display */}
                        {post.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group cursor-pointer">
                            <img 
                              src={post.imageUrl} 
                              alt="Post attached visual" 
                              onClick={() => setPreviewModalImage(post.imageUrl!)}
                              className="max-h-80 w-full object-cover hover:opacity-95 transition-opacity" 
                            />
                            <button
                              onClick={() => setPreviewModalImage(post.imageUrl!)}
                              className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg text-xs flex items-center gap-1 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ดูรูปใหญ่</span>
                            </button>
                          </div>
                        )}

                        {/* Post Attachment Display */}
                        {post.attachment && (
                          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{post.attachment.name}</p>
                                <p className="text-[10px] text-slate-500">{post.attachment.size}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownloadFile(post.attachment!)}
                              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>ดาวน์โหลด</span>
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                          <button
                            onClick={() => toggleLikePost(post.id)}
                            className={`font-bold flex items-center gap-1 hover:text-blue-600 cursor-pointer ${
                              post.likedBy?.includes(currentUserId) ? 'text-blue-600' : ''
                            }`}
                          >
                            👍 ถูกใจ ({post.likes || 0})
                          </button>
                          <button
                            onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                            className="hover:text-blue-600 cursor-pointer"
                          >
                            💬 แสดงความคิดเห็น ({post.comments?.length || post.commentsCount || 0})
                          </button>
                        </div>

                        {/* Comments Section */}
                        {activeCommentPostId === post.id && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-2">
                            {post.comments && post.comments.map(c => (
                              <div key={c.id} className="flex gap-2 bg-slate-50 p-2.5 rounded-xl">
                                <img src={c.authorAvatar} alt={c.authorName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                <div className="text-xs">
                                  <span className="font-bold text-slate-900">{c.authorName}: </span>
                                  <span className="text-slate-700">{c.content}</span>
                                </div>
                              </div>
                            ))}

                            <div className="flex gap-2 mt-1">
                              <input
                                type="text"
                                placeholder="เขียนความคิดเห็น..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                                className="flex-1 p-2 bg-slate-100 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleCommentSubmit(post.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-bold"
                              >
                                ส่ง
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Right Side Widget: About & Faculty */}
                <div className="flex flex-col gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-900 mb-2">เกี่ยวกับกลุ่มวิชานี้</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{activeCourse.description}</p>
                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>กลุ่มเปิดสาธารณะ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>สมาชิก {activeCourse.enrolledCount || 1} คน</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Instructors Widget */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-900">คณะผู้สอน (Instructors)</h4>
                      {canManageCurrentCourse && (
                        <button
                          onClick={() => setShowCoInstructorsModal(true)}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          + จัดการ
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Lead */}
                      <div className="flex items-center gap-2.5 p-2 bg-blue-50/50 rounded-xl border border-blue-100">
                        <img src={activeCourse.instructorAvatar} alt={activeCourse.instructor} className="w-7 h-7 rounded-full object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{activeCourse.instructor}</p>
                          <p className="text-[10px] text-blue-700 font-semibold">อาจารย์ผู้สอนหลัก</p>
                        </div>
                      </div>

                      {/* Co-Instructors */}
                      {(activeCourse.coInstructorDetails || []).map((co, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <img src={co.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} alt={co.name} className="w-7 h-7 rounded-full object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{co.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{co.roleTitle || 'อาจารย์ร่วมสอน'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ASSIGNMENTS */}
            {selectedCourseTab === 'assignments' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">การบ้านและแบบฝึกหัด (Assignments)</h3>
                    <p className="text-xs text-slate-500">งานที่ได้รับมอบหมายในวิชา {activeCourse.code}</p>
                  </div>
                  {canManageCurrentCourse && (
                    <button
                      onClick={() => {
                        setEditingAssignment(null);
                        setShowAssignmentModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ เพิ่มการบ้านใหม่</span>
                    </button>
                  )}
                </div>

                {courseAssignments.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    ยังไม่มีการบ้านในวิชานี้
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {courseAssignments.map(assign => (
                      <div 
                        key={assign.id} 
                        onClick={() => handleOpenAssignment(assign.id)}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                                {assign.module || 'Assignment'}
                              </span>
                              {assign.targetSecId && assign.targetSecId !== 'ALL_SEC' ? (
                                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                                  เฉพาะ {assign.targetSecId}
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                  ทุก SEC
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                              {assign.points} คะแนน
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {assign.title}
                          </h4>
                          <p className="text-xs text-slate-500 mb-2">⏰ กำหนดส่ง: <strong>{assign.dueDate}</strong></p>

                          {/* Individual Submission Status Badge */}
                          {(() => {
                            if (isInstructorRole) {
                              const count = Object.keys(assign.submissions || {}).length;
                              return (
                                <div className="mt-2">
                                  <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200/60 inline-flex items-center gap-1">
                                    <Users className="w-3 h-3 text-indigo-600" />
                                    <span>ส่งงานแล้ว {count} คน</span>
                                  </span>
                                </div>
                              );
                            }
                            const mySub = assign.submissions?.[user?.uid || ''] || (assign.submission?.studentId === user?.uid ? assign.submission : undefined);
                            const hasSubmitted = Boolean(mySub && (mySub.status === 'submitted' || mySub.status === 'graded' || (mySub.files && mySub.files.length > 0) || mySub.textEntry));
                            if (mySub && mySub.grade !== undefined) {
                              return (
                                <div className="mt-2">
                                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>ตรวจแล้ว: {mySub.grade}/{assign.points} คะแนน</span>
                                  </span>
                                </div>
                              );
                            }
                            if (hasSubmitted) {
                              return (
                                <div className="mt-2">
                                  <span className="text-[11px] font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                    <span>ส่งงานเรียบร้อยแล้ว</span>
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div className="mt-2">
                                <span className="text-[11px] font-bold bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>ยังไม่ได้ส่งงาน (Not Submitted)</span>
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenAssignment(assign.id, 'details')}
                              className="text-xs font-bold text-slate-700 hover:text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>ส่งงาน & รายละเอียด</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenAssignment(assign.id, 'submissions')}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>ตรวจงาน</span>
                            </button>
                          </div>

                          {canManageCurrentCourse && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingAssignment(assign);
                                  setShowAssignmentModal(true);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700"
                                title="แก้ไขการบ้าน"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteAssignment(assign.id)}
                                className="p-1 text-slate-400 hover:text-red-600"
                                title="ลบการบ้าน"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: MEMBERS */}
            {selectedCourseTab === 'members' && (() => {
              // Predefined directory of student profiles for realistic matching
              const studentDirectory: Record<string, { name: string; studentId: string; sec: string; avatar: string }> = {
                '65012345': { name: 'สมชาย ใจดี', studentId: '65012345', sec: 'SEC 1', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
                '65014892': { name: 'กัญญา พรประสิทธิ์', studentId: '65014892', sec: 'SEC 1', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
                '66023114': { name: 'พีรพล รุ่งโรจน์', studentId: '66023114', sec: 'SEC 2', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
                '66025678': { name: 'ธนภรณ์ ศรีสุวรรณ', studentId: '66025678', sec: 'SEC 2', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
                '65031980': { name: 'ชัชวาล เลิศปัญญา', studentId: '65031980', sec: 'SEC 3', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
              };

              // Faculty members
              const facultyMembers = [
                {
                  id: activeCourse.instructorId || 'lead-instructor',
                  code: activeCourse.instructorId && !activeCourse.instructorId.startsWith('user_') ? activeCourse.instructorId : 'T001',
                  name: activeCourse.instructor,
                  avatar: activeCourse.instructorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  badge: 'อาจารย์ผู้สอนหลัก',
                  badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200'
                },
                ...(activeCourse.coInstructorDetails || []).map((co, idx) => ({
                  id: co.uid || `co-inst-${idx}`,
                  code: co.uid && !co.uid.startsWith('co-inst') ? co.uid : `T00${idx + 2}`,
                  name: co.name,
                  avatar: co.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                  badge: co.roleTitle || 'อาจารย์ร่วมสอน',
                  badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }))
              ];

              // Build full student list
              const enrolledIds = activeCourse.enrolledStudents && activeCourse.enrolledStudents.length > 0
                ? activeCourse.enrolledStudents
                : Object.keys(studentDirectory);

              const allCourseStudents: { id: string; code: string; name: string; avatar: string; sec: string }[] = [];

              enrolledIds.forEach((stdKey) => {
                const assignedSec = activeCourse.enrolledStudentSections?.[stdKey] || studentDirectory[stdKey]?.sec || 'SEC 1';
                const matchedUser = allUsers.find(u => u.uid === stdKey || u.studentId === stdKey || u.name === stdKey);
                const defaultDir = studentDirectory[stdKey];

                const code = matchedUser?.studentId || defaultDir?.studentId || stdKey;
                const name = matchedUser?.name || defaultDir?.name || stdKey;
                const avatar = matchedUser?.avatar || defaultDir?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

                allCourseStudents.push({
                  id: stdKey,
                  code,
                  name,
                  avatar,
                  sec: assignedSec
                });
              });

              // Add current logged-in user if enrolled as student and not yet in list
              if (user && user.role !== 'instructor' && isStudentEnrolledInSec) {
                const alreadyInList = allCourseStudents.some(s => s.id === user.uid || s.code === (user.studentId || user.uid));
                if (!alreadyInList) {
                  allCourseStudents.push({
                    id: user.uid,
                    code: user.studentId || '65019999',
                    name: user.name,
                    avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    sec: studentEnrolledSec || 'SEC 1'
                  });
                }
              }

              // SEC-based filtering for students: ONLY show students in the same SEC!
              const currentEnrolledSec = studentEnrolledSec || 'SEC 1';
              const visibleStudents = isInstructorRole
                ? (instructorSelectedSec === 'ALL_SEC' ? allCourseStudents : allCourseStudents.filter(s => s.sec === instructorSelectedSec))
                : allCourseStudents.filter(s => s.sec === currentEnrolledSec);

              return (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <span>สมาชิกของคลาส (Class Members)</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          รวม {facultyMembers.length + visibleStudents.length} ท่าน
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {!isInstructorRole
                          ? `แสดงอาจารย์ผู้สอน และเฉพาะนักศึกษาในกลุ่ม ${currentEnrolledSec} ของคุณเท่านั้น`
                          : `มุมมองผู้สอน: ${instructorSelectedSec === 'ALL_SEC' ? 'แสดงนักศึกษาทุกกลุ่มเรียน' : `แสดงเฉพาะกลุ่ม ${instructorSelectedSec}`}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isInstructorRole && (
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-medium text-slate-600">กรองกลุ่ม:</span>
                          <select
                            value={instructorSelectedSec}
                            onChange={(e) => setInstructorSelectedSec(e.target.value)}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                          >
                            <option value="ALL_SEC">All SEC (ทุกกลุ่ม)</option>
                            {availableSections.map(sec => (
                              <option key={sec} value={sec}>{sec}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {canManageCurrentCourse && (
                        <button
                          onClick={() => setShowCoInstructorsModal(true)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>จัดการอาจารย์ร่วมสอน</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section 1: Faculty Members */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>อาจารย์ประจำรายวิชา (Faculty)</span>
                      </h4>
                      <span className="text-[11px] text-slate-500">{facultyMembers.length} ท่าน</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {facultyMembers.map((fac) => (
                        <div
                          key={fac.id}
                          id={`member-faculty-${fac.id}`}
                          className="p-3 sm:p-3.5 bg-slate-50/70 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex items-center justify-between transition-colors shadow-2xs"
                        >
                          {/* Layout: [รูปโปรไฟล์] | [รหัสอาจารย์] | [ชื่อนามสกุล] */}
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <img
                              src={fac.avatar}
                              alt={fac.name}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0"
                            />
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                              <span className="font-mono text-xs sm:text-sm font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                                {fac.code}
                              </span>
                              <span className="text-slate-300 font-light select-none">|</span>
                              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {fac.name}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${fac.badgeStyle}`}>
                              {fac.badge}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Students in Same SEC */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span>
                            {!isInstructorRole
                              ? `เพื่อนร่วมชั้นในกลุ่มเรียน (${currentEnrolledSec})`
                              : `นักศึกษาในรายวิชา (${instructorSelectedSec === 'ALL_SEC' ? 'ทุก SEC' : instructorSelectedSec})`}
                          </span>
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {visibleStudents.length} คน
                        </span>
                      </div>

                      {!isInstructorRole && (
                        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                          🔒 กรองเฉพาะกลุ่ม {currentEnrolledSec} เพื่อความเป็นส่วนตัว
                        </span>
                      )}
                    </div>

                    {visibleStudents.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                        ยังไม่มีนักศึกษาลงทะเบียนใน {currentEnrolledSec}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {visibleStudents.map((std) => (
                          <div
                            key={std.id}
                            id={`member-student-${std.id}`}
                            className="p-3 sm:p-3.5 bg-slate-50/70 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex items-center justify-between transition-colors shadow-2xs"
                          >
                            {/* Layout: [รูปโปรไฟล์] | [รหัสนักศึกษา] | [ชื่อนามสกุล] */}
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                              <img
                                src={std.avatar}
                                alt={std.name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30 shrink-0"
                              />
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <span className="font-mono text-xs sm:text-sm font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                                  {std.code}
                                </span>
                                <span className="text-slate-300 font-light select-none">|</span>
                                <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                  {std.name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5 text-slate-500" />
                                <span>{std.sec}</span>
                              </span>

                              {canManageCurrentCourse && (
                                <button
                                  onClick={() => removeStudentFromCourse(activeCourse.id, std.id)}
                                  className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="นำนักศึกษาออกจากกลุ่ม"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* TAB CONTENT: SCHEDULE */}
            {selectedCourseTab === 'schedule' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">ตารางเวลาเรียนและห้องเรียน</h3>
                    <p className="text-xs text-slate-500">ข้อมูล Section และวันเวลาที่มีการเรียนการสอน</p>
                  </div>
                </div>

                {activeCourse.type === 'workshop' ? (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                    💡 หลักสูตรอบรม (Workshop) เป็นการเรียนตามอัธยาศัย ไม่มีตารางเวลาบังคับ
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(activeCourse.sectionSchedules || []).map((sec, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mb-1 inline-block">
                            {sec.sectionName}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 mt-1">
                            วัน{sec.day === 'MON' ? 'จันทร์' : sec.day === 'TUE' ? 'อังคาร' : sec.day === 'WED' ? 'พุธ' : sec.day === 'THU' ? 'พฤหัสบดี' : 'ศุกร์'} เวลา {sec.startTime} - {sec.endTime}
                          </h4>
                          <p className="text-xs text-slate-500">📍 ห้องเรียน: {sec.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CURRICULUM & SECS */}
            {selectedCourseTab === 'curriculum' && (
              <div className="flex flex-col gap-5">
                {/* Course Information Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <span>ข้อมูลรายวิชา (Course Information)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{activeCourse.code} • {activeCourse.title}</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
                      {activeCourse.credits || 3} หน่วยกิต
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line mb-4">{activeCourse.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">อาจารย์ผู้สอนหลัก</span>
                      <p className="text-xs font-bold text-slate-800 mt-1">{activeCourse.instructor}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">รูปแบบวิชา</span>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {activeCourse.type === 'lecture' ? 'บรรยาย (Lecture)' : activeCourse.type === 'lab' ? 'ปฏิบัติการ (Lab)' : 'สัมมนา / อบรม'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">กลุ่มเรียนเปิดสอน</span>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {availableSections.length} กลุ่ม ({availableSections.join(', ')})
                      </p>
                    </div>
                  </div>
                </div>

                {/* SEC Breakdown Grid */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-600" />
                        <span>โครงสร้างกลุ่มเรียน (SECs Breakdown)</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        {isStudentEnrolledInSec ? `กลุ่มปัจจุบันของคุณ: ${studentEnrolledSec}` : 'คุณยังไม่ได้เลือกกลุ่มเรียน'}
                      </p>
                    </div>
                    {!isInstructorRole && (
                      <button
                        onClick={() => setShowJoinSecModal(true)}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors self-start sm:self-auto cursor-pointer"
                      >
                        {isStudentEnrolledInSec ? 'เปลี่ยนกลุ่มเรียน (Switch SEC)' : '+ เลือกกลุ่มเรียน (Enroll SEC)'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {availableSections.map((secName) => {
                      const schedule = (activeCourse.sectionSchedules || []).find(s => s.sectionName === secName);
                      const isCurrentEnrolled = studentEnrolledSec === secName;
                      const enrolledInThisSec = activeCourse.enrolledStudents?.filter(
                        sId => activeCourse.enrolledStudentSections?.[sId] === secName
                      ).length || 0;

                      return (
                        <div
                          key={secName}
                          className={`p-4 rounded-2xl border transition-all ${
                            isCurrentEnrolled
                              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40'
                              : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                              isCurrentEnrolled
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-200 text-slate-800'
                            }`}>
                              <Layers className="w-3 h-3" />
                              <span>{secName}</span>
                            </span>
                            {isCurrentEnrolled && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                กลุ่มของคุณ
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                            <p className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800">เวลาเรียน:</span>
                              {schedule ? (
                                <span>
                                  วัน{schedule.day === 'MON' ? 'จันทร์' : schedule.day === 'TUE' ? 'อังคาร' : schedule.day === 'WED' ? 'พุธ' : schedule.day === 'THU' ? 'พฤหัสบดี' : 'ศุกร์'} {schedule.startTime} - {schedule.endTime}
                                </span>
                              ) : (
                                <span>ตามตารางประจำสัปดาห์</span>
                              )}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800">ห้องเรียน:</span>
                              <span>{schedule?.location || 'อาคารบรรยายรวม'}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800">ผู้สอน:</span>
                              <span>{activeCourse.instructor}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800">นักศึกษาในกลุ่ม:</span>
                              <span className="font-bold text-slate-900">{enrolledInThisSec} คน</span>
                            </p>
                          </div>

                          {!isInstructorRole && !isCurrentEnrolled && (
                            <button
                              onClick={() => {
                                setCourseToJoin(activeCourse);
                                setShowJoinSecModal(true);
                              }}
                              className="mt-3.5 w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              ย้ายเข้ากลุ่มนี้
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ABOUT */}
            {selectedCourseTab === 'about' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
                <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
                  รายละเอียดรายวิชา {activeCourse.code}
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{activeCourse.description}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==========================================
          MODALS
          ========================================== */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCourse}
        currentUser={user}
        availableInstructors={allInstructors}
      />

      {showEditModal && activeCourse && (
        <EditCourseModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          course={activeCourse}
          onUpdate={handleUpdateCourse}
          availableInstructors={allInstructors}
        />
      )}

      {showCoInstructorsModal && activeCourse && (
        <ManageCoInstructorsModal
          isOpen={showCoInstructorsModal}
          onClose={() => setShowCoInstructorsModal(false)}
          course={activeCourse}
          onAddCoInstructor={addCoInstructor}
          onRemoveCoInstructor={removeCoInstructor}
          availableInstructors={allInstructors}
        />
      )}

      {showDeleteModal && activeCourse && (
        <DeleteCourseModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          course={activeCourse}
          onDelete={handleDeleteCourse}
        />
      )}

      {activeCourse && (
        <>
          {showAssignmentModal && (
            <AssignmentModal
              isOpen={showAssignmentModal}
              onClose={() => {
                setShowAssignmentModal(false);
                setEditingAssignment(null);
              }}
              course={activeCourse}
              editingAssignment={editingAssignment}
              onSave={handleSaveAssignment}
            />
          )}

          {showCancelModal && (
            <CancelClassModal
              isOpen={showCancelModal}
              onClose={() => setShowCancelModal(false)}
              course={activeCourse}
              onCancelSession={cancelCourseSession}
            />
          )}

          {showCustomizeModal && (
            <ClassPageCustomizeModal
              isOpen={showCustomizeModal}
              onClose={() => setShowCustomizeModal(false)}
              course={activeCourse}
              onSaveTheme={async (courseId, themeData) => {
                await updateCourse(courseId, themeData);
              }}
              onSave={async (themeData) => {
                await updateCourse(activeCourse.id, themeData);
              }}
            />
          )}

          {editingPost && (
            <EditPostModal
              isOpen={!!editingPost}
              onClose={() => setEditingPost(null)}
              post={editingPost}
            />
          )}
        </>
      )}

      {/* Join Section Modal */}
      {(courseToJoin || activeCourse) && (
        <JoinSectionModal
          isOpen={showJoinSecModal}
          onClose={() => {
            setShowJoinSecModal(false);
            setCourseToJoin(null);
          }}
          course={courseToJoin || activeCourse}
          enrolledSec={getUserEnrolledSec((courseToJoin || activeCourse).id)}
          isAlreadyEnrolled={isEnrolledInCourse(courseToJoin || activeCourse)}
          onConfirmJoin={async (courseId, secName) => {
            await joinCourse(courseId, secName);
            setShowJoinSecModal(false);
            setCourseToJoin(null);
          }}
        />
      )}

      {/* Create Announcement Modal */}
      {activeCourse && (
        <CreateAnnouncementModal
          isOpen={showCreateAnnModal}
          onClose={() => setShowCreateAnnModal(false)}
          course={activeCourse}
          currentSec={instructorSelectedSec}
          availableSections={availableSections}
          onSubmit={handleCreateAnnouncement}
        />
      )}

      {/* User Profile Modal when clicking avatars/names */}
      {selectedProfileUser && (
        <UserProfileModal
          isOpen={Boolean(selectedProfileUser)}
          onClose={() => setSelectedProfileUser(null)}
          targetUser={selectedProfileUser}
          onNavigateToCourse={(courseId) => {
            setActiveCourseId(courseId);
            setNavMode('course');
          }}
        />
      )}

      {/* Lightbox for viewing full post images */}
      {previewModalImage && (
        <div 
          onClick={() => setPreviewModalImage(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewModalImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewModalImage} 
              alt="Full Preview" 
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
