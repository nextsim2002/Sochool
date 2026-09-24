import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  User, 
  Mail, 
  School, 
  CreditCard, 
  ShieldCheck, 
  Bell, 
  Database, 
  Sparkles, 
  X, 
  Globe, 
  ThumbsUp, 
  MessageSquare, 
  Trash2, 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  MapPin, 
  Briefcase, 
  Link as LinkIcon, 
  MoreHorizontal,
  ChevronRight,
  Settings as SettingsIcon,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const SettingsView: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { posts, courses, allUsers, addPost, deletePost, toggleLikePost, addCommentToPost } = useData();

  // Navigation tab inside Facebook profile
  const [profileTab, setProfileTab] = useState<'posts' | 'about' | 'courses' | 'settings'>('posts');

  // Profile data state
  const [name, setName] = useState(user?.name || '');
  const [gradeLevel, setGradeLevel] = useState(user?.gradeLevel || (user?.role === 'instructor' ? 'อาจารย์ผู้สอน (Faculty Instructor)' : 'นักศึกษาปริญญาตรี (Undergraduate Student)'));
  const [studentId, setStudentId] = useState(user?.studentId || (user?.role === 'instructor' ? 'T001' : '65012345'));
  const [institution, setInstitution] = useState(user?.institution || 'มหาวิทยาลัยเทคโนโลยี (Institute of Technology)');
  const [bio, setBio] = useState(user?.bio || 'ยินดีที่ได้รู้จักทุกคนในระบบ Academic Hub พร้อมร่วมเรียนรู้และแบ่งปันความรู้ครับ/ค่ะ');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio || 'ยินดีที่ได้รู้จักทุกคนในระบบ Academic Hub พร้อมร่วมเรียนรู้และแบ่งปันความรู้ครับ/ค่ะ');

  // Preferences state
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [assignmentAlerts, setAssignmentAlerts] = useState(true);
  const [chatSounds, setChatSounds] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modals state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [avatarModalTab, setAvatarModalTab] = useState<'upload' | 'preset'>('preset');
  const [selectedAvatarCategory, setSelectedAvatarCategory] = useState<'all' | 'students' | 'faculty' | 'illustrated' | 'campus'>('all');

  // Temp selections in avatar modal
  const [tempAvatar, setTempAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Quick post in Facebook profile
  const [quickPostText, setQuickPostText] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Cover photo presets
  const coverPresets = [
    { title: 'Campus Main Hall', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80' },
    { title: 'Modern Library Commons', url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80' },
    { title: 'Tech Innovation Hub', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&auto=format&fit=crop&q=80' },
    { title: 'Campus Lawn & Architecture', url: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1600&auto=format&fit=crop&q=80' },
    { title: 'Grand Lecture Auditorium', url: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=1600&auto=format&fit=crop&q=80' }
  ];

  // Preset Avatars Collection
  const studentAvatars = [
    { name: 'Student 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80' },
    { name: 'Student 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80' },
    { name: 'Student 3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80' },
    { name: 'Student 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80' },
    { name: 'Student 5', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80' },
    { name: 'Student 6', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=250&auto=format&fit=crop&q=80' },
    { name: 'Student 7', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80' },
    { name: 'Student 8', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=250&auto=format&fit=crop&q=80' }
  ];

  const facultyAvatars = [
    { name: 'Professor 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80' },
    { name: 'Professor 2', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&auto=format&fit=crop&q=80' },
    { name: 'Professor 3', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80' },
    { name: 'Professor 4', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=250&auto=format&fit=crop&q=80' },
    { name: 'Professor 5', url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=250&auto=format&fit=crop&q=80' }
  ];

  const illustratedAvatars = [
    { name: 'Scholar Bot 1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=scholar1' },
    { name: 'Scholar Bot 2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=academic2' },
    { name: 'Creative Sketch 1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix' },
    { name: 'Creative Sketch 2', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka' },
    { name: 'Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=academic' },
    { name: 'Scholar Persona', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Scholar' }
  ];

  // Avatars from active users in the system
  const campusUsersAvatars = allUsers
    .filter(u => u.avatar && u.avatar.startsWith('http'))
    .slice(0, 8)
    .map(u => ({ name: u.name, url: u.avatar }));

  const currentCover = user?.coverImage || coverPresets[0].url;

  // Handle uploading avatar file from device
  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('กรุณาเลือกรูปภาพขนาดไม่เกิน 5 MB');
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setTempAvatar(reader.result);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle uploading cover file from device
  const handleCoverFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          await updateUserProfile({ coverImage: reader.result });
          setIsCoverModalOpen(false);
          showToastSuccess();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save selected avatar
  const handleSaveAvatar = async () => {
    if (!tempAvatar) return;
    await updateUserProfile({ avatar: tempAvatar });
    setIsAvatarModalOpen(false);
    showToastSuccess();
  };

  // Save selected cover from presets
  const handleSelectCover = async (coverUrl: string) => {
    await updateUserProfile({ coverImage: coverUrl });
    setIsCoverModalOpen(false);
    showToastSuccess();
  };

  const showToastSuccess = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Save full profile details
  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name,
      gradeLevel,
      studentId,
      institution,
      bio
    });
    showToastSuccess();
  };

  // Save bio edit
  const handleSaveBio = async () => {
    setBio(bioInput);
    await updateUserProfile({ bio: bioInput });
    setIsEditingBio(false);
    showToastSuccess();
  };

  // Quick post on user profile
  const handleQuickPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPostText.trim()) return;
    setIsSubmittingPost(true);
    try {
      await addPost(quickPostText.trim(), 'General');
      setQuickPostText('');
      showToastSuccess();
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Filter posts authored by this user
  const myPosts = posts.filter(p => 
    p.authorId === user?.uid || 
    p.authorName === user?.name ||
    p.authorName === name
  );

  // My enrolled / taught courses
  const myCourses = courses.filter(c => 
    c.instructorId === user?.uid || 
    c.instructor === user?.name ||
    (c.enrolledStudents && user?.uid && c.enrolledStudents.includes(user.uid)) ||
    (c.enrolledStudents && user?.name && c.enrolledStudents.includes(user.name))
  );

  // Determine avatar list according to selected category
  const displayedAvatars = 
    selectedAvatarCategory === 'students' ? studentAvatars :
    selectedAvatarCategory === 'faculty' ? facultyAvatars :
    selectedAvatarCategory === 'illustrated' ? illustratedAvatars :
    selectedAvatarCategory === 'campus' ? campusUsersAvatars :
    [...studentAvatars, ...facultyAvatars, ...illustratedAvatars];

  return (
    <div className="flex-1 min-h-screen bg-[#F0F2F5] text-slate-800 pb-16 font-sans">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-xs font-bold">บันทึกข้อมูลเรียบร้อยแล้ว (Saved to Firebase)</span>
        </div>
      )}

      {/* =========================================================
          FACEBOOK PROFILE HEADER CONTAINER
          ========================================================= */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto">
          {/* COVER PHOTO AREA */}
          <div className="relative w-full h-56 sm:h-72 md:h-88 lg:h-96 rounded-b-2xl overflow-hidden bg-slate-900 group">
            <img 
              src={currentCover} 
              alt="Cover" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

            {/* EDIT COVER PHOTO BUTTON (Facebook Style) */}
            <button
              type="button"
              onClick={() => setIsCoverModalOpen(true)}
              className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-xs transition-transform active:scale-95 cursor-pointer border border-slate-200"
            >
              <Camera className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">แก้ไขรูปหน้าปก</span>
              <span className="sm:hidden">หน้าปก</span>
            </button>
          </div>

          {/* AVATAR + PROFILE BAR */}
          <div className="px-4 sm:px-8 pb-4">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4 -mt-16 sm:-mt-20 md:-mt-24 mb-4">
              {/* Profile Picture (Facebook Circular Avatar with Camera badge) */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                <div className="relative group">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1.5 bg-white shadow-xl ring-1 ring-slate-200">
                    <img 
                      src={user?.avatar || tempAvatar} 
                      alt={user?.name || name} 
                      className="w-full h-full rounded-full object-cover bg-slate-100"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Camera Icon Button on Avatar */}
                  <button
                    type="button"
                    onClick={() => {
                      setTempAvatar(user?.avatar || tempAvatar);
                      setIsAvatarModalOpen(true);
                    }}
                    title="เปลี่ยนรูปโปรไฟล์"
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-md border-2 border-white transition-all active:scale-95 cursor-pointer hover:text-blue-600"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Name, Role and Bio */}
                <div className="space-y-1 mb-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {name || user?.name}
                    </h1>
                    {user?.role === 'instructor' && (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white shadow-xs" title="อาจารย์ผู้สอนได้รับการยืนยัน">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center justify-center sm:justify-start gap-2">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 font-bold">
                      {gradeLevel}
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">รหัส: {studentId}</span>
                  </p>

                  <p className="text-xs text-slate-500 max-w-xl">
                    {institution}
                  </p>
                </div>
              </div>

              {/* Facebook Action Buttons */}
              <div className="flex items-center gap-2 mb-2 w-full sm:w-auto justify-center">
                <button
                  type="button"
                  onClick={() => setProfileTab('about')}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>แก้ไขโปรไฟล์</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempAvatar(user?.avatar || tempAvatar);
                    setIsAvatarModalOpen(true);
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-blue-200"
                >
                  <Camera className="w-4 h-4" />
                  <span>เปลี่ยนรูปโปรไฟล์</span>
                </button>
              </div>
            </div>

            {/* BIO DISPLAY / EDIT INLINE */}
            <div className="py-2 border-t border-slate-100 flex items-center justify-between">
              {isEditingBio ? (
                <div className="w-full flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <input
                    type="text"
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    maxLength={140}
                    placeholder="เขียนข้อความแนะนำตัวสั้นๆ..."
                    className="flex-1 w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveBio}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                    >
                      บันทึก
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingBio(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <p className="text-xs text-slate-600 italic">
                    "{bio || 'ยังไม่มีคำแนะนำตัว'}"
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBioInput(bio);
                      setIsEditingBio(true);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold ml-2 shrink-0 hover:underline"
                  >
                    แก้ไขคำแนะนำตัว
                  </button>
                </div>
              )}
            </div>

            {/* FACEBOOK NAVIGATION TABS */}
            <div className="flex items-center gap-1 sm:gap-2 pt-2 border-t border-slate-200 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setProfileTab('posts')}
                className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                  profileTab === 'posts'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg'
                }`}
              >
                โพสต์ของฉัน ({myPosts.length})
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('about')}
                className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                  profileTab === 'about'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg'
                }`}
              >
                เกี่ยวกับ (About)
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('courses')}
                className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                  profileTab === 'courses'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg'
                }`}
              >
                วิชาของฉัน ({myCourses.length})
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('settings')}
                className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                  profileTab === 'settings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg'
                }`}
              >
                การตั้งค่าระบบ (Settings)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN BODY CONTAINER (Facebook Two-Column Layout)
          ========================================================= */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ---------------- LEFT COLUMN (Intro & Quick Cards) ---------------- */}
          <div className="lg:col-span-5 space-y-4">
            {/* INTRO CARD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">ข้อมูลแนะนำตัว (Intro)</h3>
              
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">สถานะ / ระดับการศึกษา</span>
                    <span className="font-bold text-slate-800">{gradeLevel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <School className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">สถาบันการศึกษา</span>
                    <span className="font-bold text-slate-800">{institution}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">รหัสนักศึกษา / บุคลากร</span>
                    <span className="font-bold text-slate-800">{studentId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">อีเมลติดต่อ</span>
                    <span className="font-bold text-slate-800">{user?.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">เข้าร่วมระบบ</span>
                    <span className="font-bold text-slate-800">Fall Semester 2024</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProfileTab('about')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                แก้ไขข้อมูลส่วนตัว
              </button>
            </div>

            {/* AVATAR GALLERY QUICK CARD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-900">รูปอวตารของคุณ</h3>
                <button
                  type="button"
                  onClick={() => {
                    setTempAvatar(user?.avatar || tempAvatar);
                    setIsAvatarModalOpen(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                >
                  เลือกดูทั้งหมด
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[...studentAvatars.slice(0, 4), ...facultyAvatars.slice(0, 4)].map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={async () => {
                      await updateUserProfile({ avatar: av.url });
                      showToastSuccess();
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all hover:scale-105 cursor-pointer ${
                      user?.avatar === av.url ? 'border-blue-600 ring-2 ring-blue-200' : 'border-slate-100'
                    }`}
                  >
                    <img src={av.url} alt={av.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    {user?.avatar === av.url && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ENROLLED COURSES SHORTLIST CARD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-900">รายวิชาในระบบ</h3>
                <span className="text-xs text-slate-400 font-bold">{myCourses.length} วิชา</span>
              </div>

              {myCourses.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">ยังไม่มีรายวิชาที่ลงทะเบียน</p>
              ) : (
                <div className="space-y-2">
                  {myCourses.slice(0, 3).map(c => (
                    <div key={c.id} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex items-center gap-3 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                        {c.code.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{c.title}</h4>
                        <span className="text-[11px] text-slate-500">{c.code} • {c.instructor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ---------------- RIGHT COLUMN (Tab Specific Content) ---------------- */}
          <div className="lg:col-span-7 space-y-4">

            {/* 1. POSTS TAB */}
            {profileTab === 'posts' && (
              <div className="space-y-4">
                {/* CREATE POST BOX (Facebook Style) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={user?.avatar || tempAvatar} 
                      alt={user?.name || name} 
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <form onSubmit={handleQuickPostSubmit} className="flex-1">
                      <input
                        type="text"
                        value={quickPostText}
                        onChange={(e) => setQuickPostText(e.target.value)}
                        placeholder={`คุณกำลังคิดอะไรอยู่, ${user?.name?.split(' ')[0] || name}?`}
                        className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200/70 focus:bg-white border border-transparent focus:border-blue-500 rounded-full text-xs sm:text-sm focus:outline-none transition-colors"
                      />
                    </form>
                  </div>

                  {quickPostText.trim() && (
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleQuickPostSubmit}
                        disabled={isSubmittingPost}
                        className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        {isSubmittingPost ? 'กำลังโพสต์...' : 'โพสต์'}
                      </button>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-xs font-bold text-slate-600">
                    <button 
                      type="button"
                      onClick={() => setIsAvatarModalOpen(true)}
                      className="flex items-center gap-2 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>เปลี่ยนรูปโปรไฟล์</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setProfileTab('about')}
                      className="flex items-center gap-2 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-blue-600" />
                      <span>อัปเดตข้อมูล</span>
                    </button>
                  </div>
                </div>

                {/* POSTS LIST */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-extrabold text-sm text-slate-900">โพสต์ของคุณ ({myPosts.length})</h3>
                  </div>

                  {myPosts.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800">ยังไม่มีโพสต์ของคุณ</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        แบ่งปันคำถาม อัปเดตงาน หรือสื่อสารกับเพื่อนๆ ในวิชาเรียนได้จากกล่องข้อความด้านบน
                      </p>
                    </div>
                  ) : (
                    myPosts.map((post) => (
                      <div key={post.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 text-left">
                        {/* Post Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img 
                              src={post.authorAvatar || user?.avatar} 
                              alt={post.authorName} 
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900">{post.authorName}</h4>
                                {post.authorBadge && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                                    {post.authorBadge}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <span>{post.timeAgo || 'เมื่อสักครู่'}</span>
                                <span>•</span>
                                <span className="text-blue-600 font-semibold">{post.courseTag || 'General'}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => deletePost(post.id)}
                            title="ลบโพสต์"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Post Content */}
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>

                        {/* Post Image */}
                        {post.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-slate-100 max-h-96">
                            <img src={post.imageUrl} alt="Attachment" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {/* Post Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <button
                            type="button"
                            onClick={() => toggleLikePost(post.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-xl transition-colors font-bold text-slate-600 cursor-pointer"
                          >
                            <ThumbsUp className={`w-4 h-4 ${post.likedBy?.includes(user?.uid || '') ? 'text-blue-600 fill-blue-600' : ''}`} />
                            <span>{post.likes || 0} ถูกใจ</span>
                          </button>

                          <div className="flex items-center gap-1 px-3 py-1.5 text-slate-500 font-medium">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.commentsCount || 0} ความคิดเห็น</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 2. ABOUT TAB */}
            {profileTab === 'about' && (
              <form onSubmit={handleSaveProfileDetails} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">แก้ไขข้อมูลโปรไฟล์ (Edit Profile)</h3>
                  <p className="text-xs text-slate-500">ข้อมูลของคุณจะแสดงให้เพื่อนร่วมห้องและอาจารย์เห็นในระบบ Academic Hub</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อ-นามสกุล (Full Name)</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ตำแหน่ง / ระดับชั้น (Role / Grade)</label>
                    <input
                      type="text"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">รหัสนักศึกษา / รหัสอาจารย์ (ID)</label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">สถาบันการศึกษา (Institution)</label>
                    <div className="relative">
                      <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">คำแนะนำตัว (Bio)</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-100 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>บันทึกการเปลี่ยนแปลง</span>
                  </button>
                </div>
              </form>
            )}

            {/* 3. COURSES TAB */}
            {profileTab === 'courses' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">วิชาที่เกี่ยวข้อง ({myCourses.length})</h3>
                    <p className="text-xs text-slate-500">รายวิชาที่คุณสอนหรือลงทะเบียนเรียนในระบบ Academic Hub</p>
                  </div>
                </div>

                {myCourses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">ไม่มีรายวิชาในระบบ</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myCourses.map(c => (
                      <div key={c.id} className="p-4 rounded-xl border border-slate-200/80 hover:shadow-sm transition-shadow flex flex-col justify-between gap-3 bg-slate-50/50">
                        <div>
                          <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {c.code}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">{c.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{c.description}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                          <span>{c.instructor}</span>
                          <span className="font-bold text-blue-600">{c.enrolledCount || 1} คน</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. SETTINGS & PREFERENCES TAB */}
            {profileTab === 'settings' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">การตั้งค่าระบบ (Account & Preferences)</h3>
                  <p className="text-xs text-slate-500">จัดการการแจ้งเตือนและความปลอดภัยของบัญชี</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">การแจ้งเตือน (Notifications)</h4>
                  
                  <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">แจ้งเตือนกำหนดส่งการบ้าน (Assignment Deadlines)</span>
                      <span className="text-[11px] text-slate-500">รับการแจ้งเตือนล่วงหน้า 24 ชม. ก่อนถึงกำหนดส่ง</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={assignmentAlerts}
                      onChange={(e) => setAssignmentAlerts(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">เสียงแจ้งเตือนข้อความแชต (Direct & Group Message Sounds)</span>
                      <span className="text-[11px] text-slate-500">ส่งเสียงเมื่อมีข้อความใหม่ในกลุ่ม SEC หรือห้องแชต</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={chatSounds}
                      onChange={(e) => setChatSounds(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                </div>

                {/* Cloud Database Indicator */}
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center gap-3">
                  <Database className="w-6 h-6 text-indigo-600 shrink-0" />
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-indigo-950 block">เชื่อมต่อกับ Firebase Firestore สำเร็จ</span>
                    <span>ข้อมูลโปรไฟล์ รูปอวตาร และโพสต์ของคุณจะถูกซิงก์แบบ Real-time ข้ามอุปกรณ์ตลอดเวลา</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* =========================================================
          MODAL: UPDATE PROFILE PICTURE (Facebook Style)
          ========================================================= */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                อัปเดตรูปโปรไฟล์ (Update profile picture)
              </h3>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 px-4 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setAvatarModalTab('preset')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  avatarModalTab === 'preset'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                🖼️ เลือกรูปอวตารที่มีอยู่ในเว็บ
              </button>
              <button
                type="button"
                onClick={() => setAvatarModalTab('upload')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  avatarModalTab === 'upload'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📤 อัปโหลดรูปภาพใหม่
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              
              {/* Current Preview */}
              <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">ตัวอย่างรูปโปรไฟล์ที่จะแสดง</span>
                <div className="w-28 h-28 rounded-full p-1 bg-white shadow-md ring-2 ring-blue-500">
                  <img
                    src={tempAvatar}
                    alt="Preview"
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* TAB 1: PRESET AVATARS */}
              {avatarModalTab === 'preset' && (
                <div className="space-y-4">
                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedAvatarCategory('all')}
                      className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                        selectedAvatarCategory === 'all'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ทั้งหมด ({studentAvatars.length + facultyAvatars.length + illustratedAvatars.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAvatarCategory('students')}
                      className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                        selectedAvatarCategory === 'students'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      นักศึกษา
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAvatarCategory('faculty')}
                      className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                        selectedAvatarCategory === 'faculty'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      อาจารย์ / ผู้สอน
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAvatarCategory('illustrated')}
                      className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                        selectedAvatarCategory === 'illustrated'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      กราฟิก & อวตาร
                    </button>
                    {campusUsersAvatars.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarCategory('campus')}
                        className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                          selectedAvatarCategory === 'campus'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        สมาชิกในระบบ
                      </button>
                    )}
                  </div>

                  {/* Avatar Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-64 overflow-y-auto p-1">
                    {displayedAvatars.map((item, idx) => {
                      const isSelected = tempAvatar === item.url;
                      return (
                        <div
                          key={idx}
                          onClick={() => setTempAvatar(item.url)}
                          className={`group relative rounded-2xl overflow-hidden aspect-square border-2 cursor-pointer transition-all hover:scale-105 ${
                            isSelected ? 'border-blue-600 ring-2 ring-blue-300 shadow-md' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover bg-slate-100"
                            referrerPolicy="no-referrer"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                                <Check className="w-4 h-4 stroke-[3]" />
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: UPLOAD FROM DEVICE OR URL */}
              {avatarModalTab === 'upload' && (
                <div className="space-y-4">
                  {/* File Upload Box */}
                  <input
                    type="file"
                    ref={avatarFileInputRef}
                    onChange={handleAvatarFileSelected}
                    accept="image/*"
                    className="hidden"
                  />
                  <div
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-md text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 mb-1">
                      {isUploading ? 'กำลังประมวลผลรูปภาพ...' : 'คลิกเพื่อเลือกรูปภาพจากเครื่องคอมพิวเตอร์ / โทรศัพท์'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      รองรับไฟล์ JPG, PNG, WebP ขนาดไม่เกิน 5 MB
                    </p>
                  </div>

                  {/* Or enter custom URL */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">หรือวางลิงก์รูปภาพโดยตรง (Direct Image URL)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        placeholder="https://example.com/my-photo.jpg"
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customAvatarUrl.trim()) {
                            setTempAvatar(customAvatarUrl.trim());
                          }
                        }}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                      >
                        ดูตัวอย่าง
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-white">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกเป็นรูปโปรไฟล์</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: UPDATE COVER PHOTO (Facebook Style)
          ========================================================= */}
      {isCoverModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                แก้ไขรูปภาพหน้าปก (Edit cover photo)
              </h3>
              <button
                type="button"
                onClick={() => setIsCoverModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {/* Device Upload */}
              <input
                type="file"
                ref={coverFileInputRef}
                onChange={handleCoverFileSelected}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl flex items-center justify-center gap-2 bg-slate-50 hover:bg-blue-50/40 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>อัปโหลดรูปหน้าปกจากอุปกรณ์ของคุณ</span>
              </button>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">หรือเลือกจากธีมมหาวิทยาลัย & วิทยาเขต (Campus Themes)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {coverPresets.map((cov, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectCover(cov.url)}
                      className={`group relative rounded-xl overflow-hidden aspect-video border-2 cursor-pointer transition-all hover:scale-102 ${
                        currentCover === cov.url ? 'border-blue-600 ring-2 ring-blue-300' : 'border-slate-200'
                      }`}
                    >
                      <img src={cov.url} alt={cov.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-[11px] font-bold text-white truncate">{cov.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCoverModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
