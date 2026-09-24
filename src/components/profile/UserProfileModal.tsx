import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  UserCheck, 
  UserX, 
  MessageSquare, 
  Edit3, 
  School, 
  Mail, 
  CreditCard, 
  Globe, 
  Github, 
  Linkedin, 
  Instagram, 
  Heart, 
  MessageCircle, 
  Share2, 
  Calendar, 
  GraduationCap, 
  Sparkles, 
  Check, 
  Camera, 
  Upload, 
  Layers,
  Clock,
  BookOpen
} from 'lucide-react';
import { UserProfile, PostItem, Course } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { EditPostModal } from '../EditPostModal';
import { Trash2 } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  onNavigateToCourse?: (courseId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onNavigateToCourse
}) => {
  const { user: currentUser, updateUserProfile, sendFriendRequest, acceptFriendRequest, removeFriend } = useAuth();
  const { posts, courses, createChatThread, setCurrentChatId, allUsers, toggleLikePost, deletePost } = useData();

  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'courses' | 'friends'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !targetUser) return null;

  const isOwnProfile = Boolean(currentUser && (currentUser.uid === targetUser.uid || currentUser.email === targetUser.email));

  const isFriend = Boolean(
    currentUser?.friends?.includes(targetUser.uid) || 
    targetUser.friends?.includes(currentUser?.uid || '')
  );

  const isRequestSent = Boolean(currentUser?.friendRequestsSent?.includes(targetUser.uid));
  const isRequestReceived = Boolean(currentUser?.friendRequestsReceived?.includes(targetUser.uid));

  // Filter posts by this user
  const userPosts = posts.filter(p => 
    p.authorId === targetUser.uid || 
    (p.authorName && targetUser.name && p.authorName.toLowerCase() === targetUser.name.toLowerCase())
  );

  // Filter courses taught or enrolled by this user
  const userCourses = courses.filter(c => 
    c.instructorId === targetUser.uid || 
    (c.instructor && targetUser.name && c.instructor.toLowerCase() === targetUser.name.toLowerCase()) ||
    (c.coInstructors && (c.coInstructors.includes(targetUser.uid) || (targetUser.name && c.coInstructors.includes(targetUser.name)))) ||
    (c.enrolledStudents && (c.enrolledStudents.includes(targetUser.uid) || (targetUser.name && c.enrolledStudents.includes(targetUser.name))))
  );

  // User's friends list
  const friendsList = allUsers.filter(u => targetUser.friends?.includes(u.uid));

  const handleStartEdit = () => {
    setEditName(targetUser.name || '');
    setEditBio(targetUser.bio || '');
    setEditStatus(targetUser.statusMessage || '');
    setEditAvatar(targetUser.avatar || '');
    setEditCover(targetUser.coverImage || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80');
    setEditInterests((targetUser.interests || ['Computer Science', 'Design', 'AI Systems']).join(', '));
    setEditGithub(targetUser.socialLinks?.github || '');
    setEditLinkedin(targetUser.socialLinks?.linkedin || '');
    setEditWebsite(targetUser.socialLinks?.website || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const interestsArray = editInterests.split(',').map(s => s.trim()).filter(Boolean);
      await updateUserProfile({
        name: editName.trim() || currentUser.name,
        bio: editBio.trim(),
        statusMessage: editStatus.trim(),
        avatar: editAvatar.trim() || currentUser.avatar,
        coverImage: editCover.trim(),
        interests: interestsArray,
        socialLinks: {
          github: editGithub.trim() || undefined,
          linkedin: editLinkedin.trim() || undefined,
          website: editWebsite.trim() || undefined
        }
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMessageUser = async () => {
    if (!currentUser) return;
    await createChatThread(`${targetUser.name}`, false);
    onClose();
  };

  const coverPresets = [
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=800&auto=format&fit=crop&q=80'
  ];

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  ];

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditCover(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Cover Photo Header */}
        <div className="relative h-44 sm:h-52 w-full bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 overflow-hidden shrink-0">
          <img 
            src={targetUser.coverImage || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80'} 
            alt="Profile Cover" 
            className="w-full h-full object-cover opacity-90"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info Overlay Row */}
        <div className="px-6 pb-4 bg-white relative shrink-0 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar & Basic Info */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <img 
                  src={targetUser.avatar} 
                  alt={targetUser.name} 
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white" title="Active now"></span>
              </div>

              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{targetUser.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    targetUser.role === 'instructor' 
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {targetUser.role === 'instructor' ? 'FACULTY' : 'STUDENT'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {targetUser.gradeLevel || (targetUser.role === 'instructor' ? 'Faculty Instructor' : 'Student')} • {targetUser.institution || 'University Campus'}
                </p>
                {targetUser.statusMessage && (
                  <p className="text-xs text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>"{targetUser.statusMessage}"</span>
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isOwnProfile ? (
                <button
                  onClick={handleStartEdit}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>ตกแต่ง / แก้ไขโปรไฟล์</span>
                </button>
              ) : (
                <>
                  {isFriend ? (
                    <div className="flex items-center gap-1.5">
                      <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-1">
                        <UserCheck className="w-4 h-4" />
                        <span>เพื่อนแล้ว (Friends)</span>
                      </span>
                      <button
                        onClick={() => removeFriend(targetUser.uid)}
                        title="Unfriend (ลบเพื่อน)"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors cursor-pointer"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : isRequestReceived ? (
                    <button
                      onClick={() => acceptFriendRequest(targetUser.uid)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-100 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>ยอมรับคำขอเป็นเพื่อน</span>
                    </button>
                  ) : isRequestSent ? (
                    <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>ส่งคำขอแล้ว (Pending)</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(targetUser.uid)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-100 cursor-pointer transition-all hover:scale-105"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ เพิ่มเพื่อน (Add Friend)</span>
                    </button>
                  )}

                  <button
                    onClick={handleMessageUser}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                    title="Send Direct Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 mt-4 pt-2 border-t border-slate-100 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('posts'); setIsEditing(false); }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'posts' && !isEditing ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>โพสต์และการแชร์ ({userPosts.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab('about'); setIsEditing(false); }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'about' && !isEditing ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>เกี่ยวกับ & ข้อมูล</span>
            </button>
            <button
              onClick={() => { setActiveTab('courses'); setIsEditing(false); }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'courses' && !isEditing ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>รายวิชา ({userCourses.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab('friends'); setIsEditing(false); }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'friends' && !isEditing ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>เพื่อน ({targetUser.friends?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {isEditing ? (
            /* EDIT PROFILE FORM */
            <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>ตกแต่งและปรับแต่งโปรไฟล์ของคุณ</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ยกเลิก
                </button>
              </div>

              {/* Cover Photo Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ภาพหน้าปกโปรไฟล์ (Cover Banner)</label>
                <div className="flex items-center gap-2 mb-2">
                  {coverPresets.map((preset, idx) => (
                    <img 
                      key={idx}
                      src={preset} 
                      alt={`Cover preset ${idx}`}
                      onClick={() => setEditCover(preset)}
                      className={`h-12 w-20 rounded-xl object-cover cursor-pointer border-2 hover:scale-105 transition-all ${
                        editCover === preset ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="หรือใส่ลิงก์รูปภาพ URL..."
                    value={editCover}
                    onChange={(e) => setEditCover(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลด</span>
                    <input type="file" accept="image/*" onChange={handleCoverFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">รูปโปรไฟล์ (Avatar)</label>
                <div className="flex items-center gap-2 mb-2">
                  {avatarPresets.map((preset, idx) => (
                    <img 
                      key={idx}
                      src={preset} 
                      alt={`Avatar preset ${idx}`}
                      onClick={() => setEditAvatar(preset)}
                      className={`h-10 w-10 rounded-full object-cover cursor-pointer border-2 hover:scale-105 transition-all ${
                        editAvatar === preset ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="หรือใส่ลิงก์รูปโปรไฟล์ URL..."
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                    <span>อัปโหลด</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อที่แสดง (Display Name)</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">สเตตัส / คำคมประจำวัน</label>
                  <input
                    type="text"
                    placeholder="e.g. Ready for the hackathon! 🚀"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ประวัติย่อ (Bio)</label>
                <textarea
                  rows={2}
                  placeholder="เขียนแนะนำตัวเอง ความสนใจ หรือสิ่งที่กำลังศึกษา..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ความสนใจ / Tags (คั่นด้วยจุลภาค ,)</label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack, AI Systems, UI/UX, Robotics"
                  value={editInterests}
                  onChange={(e) => setEditInterests(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">GitHub URL</label>
                  <input
                    type="text"
                    placeholder="github.com/username"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    placeholder="linkedin.com/in/username"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Website / Portfolio</label>
                  <input
                    type="text"
                    placeholder="myportfolio.dev"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}</span>
                </button>
              </div>
            </form>
          ) : activeTab === 'posts' ? (
            /* USER ACTIVITY & POSTS (Requirement 7) */
            <div className="flex flex-col gap-4 text-left">
              {userPosts.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">ยังไม่มีโพสต์หรือการแชร์กิจกรรม</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">โพสต์และบทความที่เผยแพร่จะปรากฏที่นี่</p>
                </div>
              ) : (
                userPosts.map(post => {
                  const isPostOwner = currentUser && (currentUser.uid === post.authorId || currentUser.name === post.authorName);

                  return (
                    <div key={post.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img src={post.authorAvatar} alt={post.authorName} className="w-9 h-9 rounded-full object-cover" />
                          <div>
                            <h5 className="font-bold text-xs text-slate-900">{post.authorName}</h5>
                            <span className="text-[10px] text-slate-400">
                              {post.timeAgo} {post.isEdited ? '• (แก้ไขแล้ว)' : ''} {post.courseTag ? `• ${post.courseTag}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Owner action buttons */}
                        {isPostOwner && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingPost(post)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
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
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบโพสต์"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                      {post.imageUrl && (
                        <div className="rounded-2xl overflow-hidden max-h-60 border border-slate-100">
                          <img src={post.imageUrl} alt="Attachment" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2 border-t border-slate-50 text-xs text-slate-500">
                        <button 
                          onClick={() => toggleLikePost(post.id)}
                          className="flex items-center gap-1 hover:text-red-500 cursor-pointer"
                        >
                          <Heart className={`w-4 h-4 ${post.likedBy?.includes(currentUser?.uid || '') ? 'fill-red-500 text-red-500' : ''}`} />
                          <span>{post.likes} ถูกใจ</span>
                        </button>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.commentsCount || (post.comments?.length ?? 0)} ความคิดเห็น</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === 'about' ? (
            /* ABOUT & INTERESTS */
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-5 text-left">
              <div>
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">เกี่ยวกับฉัน (Bio)</h4>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {targetUser.bio || 'ยังไม่ได้ระบุประวัติย่อ'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">ความสนใจและทักษะ</h4>
                <div className="flex flex-wrap gap-2">
                  {(targetUser.interests && targetUser.interests.length > 0 
                    ? targetUser.interests 
                    : ['Computer Science', 'Machine Learning', 'UX Design', 'Cloud Computing']
                  ).map((interest, idx) => (
                    <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
                      #{interest}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">ช่องทางโซเชียล & เว็บไซต์</h4>
                <div className="flex flex-wrap gap-3">
                  {targetUser.socialLinks?.github && typeof targetUser.socialLinks.github === 'string' && (
                    <a href={`https://${(targetUser.socialLinks.github || '').replace('https://', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200">
                      <Github className="w-3.5 h-3.5" />
                      <span>{targetUser.socialLinks.github}</span>
                    </a>
                  )}
                  {targetUser.socialLinks?.linkedin && typeof targetUser.socialLinks.linkedin === 'string' && (
                    <a href={`https://${(targetUser.socialLinks.linkedin || '').replace('https://', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200">
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>{targetUser.socialLinks.linkedin}</span>
                    </a>
                  )}
                  {targetUser.socialLinks?.website && typeof targetUser.socialLinks.website === 'string' && (
                    <a href={`https://${(targetUser.socialLinks.website || '').replace('https://', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold border border-purple-200">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{targetUser.socialLinks.website}</span>
                    </a>
                  )}
                  {!targetUser.socialLinks?.github && !targetUser.socialLinks?.linkedin && !targetUser.socialLinks?.website && (
                    <p className="text-xs text-slate-400">ยังไม่มีลิงก์โซเชียลที่เพิ่มไว้</p>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'courses' ? (
            /* ENROLLED / TAUGHT COURSES */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {userCourses.length === 0 ? (
                <div className="col-span-2 p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                  ยังไม่ได้เข้าร่วมหรือเปิดสอนรายวิชาใดๆ
                </div>
              ) : (
                userCourses.map(course => (
                  <div 
                    key={course.id} 
                    onClick={() => {
                      if (onNavigateToCourse) {
                        onNavigateToCourse(course.id);
                        onClose();
                      }
                    }}
                    className="p-4 bg-white hover:bg-indigo-50/50 rounded-2xl border border-slate-200 shadow-xs cursor-pointer transition-colors flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          {course.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {course.enrolledCount} นักศึกษา
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">{course.title}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">ผู้สอน: {course.instructor}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* FRIENDS LIST */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {friendsList.length === 0 ? (
                <div className="col-span-2 p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                  ยังไม่มีรายชื่อเพื่อนในระบบ
                </div>
              ) : (
                friendsList.map(friend => (
                  <div key={friend.uid} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <h5 className="font-bold text-xs text-slate-900">{friend.name}</h5>
                        <p className="text-[10px] text-slate-400">{friend.gradeLevel || friend.role}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          post={editingPost}
        />
      )}
    </div>
  );
};
