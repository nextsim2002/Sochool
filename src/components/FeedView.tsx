import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Image as ImageIcon, 
  Paperclip, 
  Send, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Download, 
  Eye, 
  X, 
  FileText,
  Edit3,
  Trash2,
  Copy,
  Flag,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PostAttachment, PostItem, UserProfile } from '../types';
import { UserProfileModal } from './profile/UserProfileModal';
import { EditPostModal } from './EditPostModal';

interface FeedViewProps {
  onOpenNewPost: () => void;
  onNavigateToCourse: (courseId: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  onOpenNewPost,
  onNavigateToCourse
}) => {
  const { user } = useAuth();
  const { posts, toggleLikePost, addCommentToPost, deletePost, courses, allUsers } = useData();
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});
  const [copiedToast, setCopiedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserProfile | null>(null);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [postToDelete, setPostToDelete] = useState<PostItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setCopiedToast(true);
    setTimeout(() => {
      setCopiedToast(false);
      setToastMessage('');
    }, 2800);
  };

  const handleShare = (post?: PostItem) => {
    const shareText = post ? `${post.authorName}: "${post.content.slice(0, 100)}..."\n${window.location.href}` : window.location.href;
    navigator.clipboard?.writeText(shareText);
    showNotification('คัดลอกลิงก์โพสต์ลงคลิปบอร์ดแล้ว!');
  };

  const handleAddComment = (postId: string) => {
    const text = commentInput[postId];
    if (!text || !text.trim()) return;
    addCommentToPost(postId, text);
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deletePost(postToDelete.id);
      if (result.success) {
        showNotification('ลบโพสต์ออกจากฐานข้อมูลเรียบร้อยแล้ว');
      } else {
        alert(result.message || 'ไม่สามารถลบโพสต์ได้');
      }
      setPostToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadAttachment = (att: PostAttachment) => {
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

  const handleOpenAuthorProfile = (authorName?: string, authorAvatar?: string, authorRole?: string, authorId?: string) => {
    const validName = authorName || 'Campus Member';
    const matched = allUsers.find(u => (authorId && u.uid === authorId) || (u.name && u.name.toLowerCase() === validName.toLowerCase()));
    if (matched) {
      setSelectedProfileUser(matched);
    } else {
      setSelectedProfileUser({
        uid: authorId || 'post-author',
        name: validName,
        role: (authorRole === 'INSTRUCTOR' || authorRole === 'Faculty' ? 'instructor' : 'student'),
        avatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        email: `${validName.toLowerCase().replace(/\s+/g, '')}@university.edu`,
        gradeLevel: authorRole || 'Member',
        bio: 'Active member on Sochool Academic Hub'
      });
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F8FAFC] p-8 max-w-7xl mx-auto flex gap-8">
      {/* Main Feed Column */}
      <div className="flex-1 flex flex-col gap-6 max-w-2xl">
        {/* Quick Post Box */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-100"
              referrerPolicy="no-referrer"
            />
            <div 
              onClick={onOpenNewPost}
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full py-2.5 px-4 text-sm cursor-pointer transition-colors"
            >
              What's on your mind?
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs">
            <div className="flex items-center gap-3">
              <button 
                onClick={onOpenNewPost}
                className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-medium py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span>Photo</span>
              </button>
              <button 
                onClick={onOpenNewPost}
                className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-medium py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <Paperclip className="w-4 h-4 text-indigo-500" />
                <span>File</span>
              </button>
            </div>
            <button
              onClick={onOpenNewPost}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1.5 px-4 rounded-full text-xs transition-colors shadow-sm cursor-pointer"
            >
              Post
            </button>
          </div>
        </div>

        {/* Action Toast Notification */}
        {copiedToast && (
          <div className="fixed top-20 right-8 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-50 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage || 'ดำเนินการสำเร็จ!'}</span>
          </div>
        )}

        {/* Posts Stream */}
        <div className="flex flex-col gap-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No Posts Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                The campus feed is clean and ready. Share an announcement, question, or study resource to start the conversation!
              </p>
              <button
                onClick={onOpenNewPost}
                className="mt-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Create First Post
              </button>
            </div>
          ) : (
            posts.map((post) => {
            const isLiked = user ? post.likedBy?.includes(user.uid) : false;
            const isCommentOpen = activeCommentPostId === post.id;
            const isOwner = Boolean(user && (user.uid === post.authorId || user.name === post.authorName));
            const postCourse = courses.find(c => 
              (post.courseId && c.id === post.courseId) || 
              (post.courseTag && (c.code === post.courseTag || c.title === post.courseTag))
            );
            const isTeacherOfCourse = Boolean(
              user?.role === 'instructor' && postCourse && (
                postCourse.instructorId === user.uid ||
                postCourse.instructor === user.name ||
                (postCourse.coInstructors && postCourse.coInstructors.includes(user.uid)) ||
                (postCourse.coInstructorDetails && postCourse.coInstructorDetails.some(ci => ci.uid === user.uid || ci.name === user.name))
              )
            );
            const canManageThisPost = isOwner || isTeacherOfCourse;
            const isMenuOpen = openMenuPostId === post.id;

            return (
              <article 
                key={post.id} 
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 transition-all hover:border-slate-200 relative"
              >
                {/* Post Author Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      onClick={() => handleOpenAuthorProfile(post.authorName, post.authorAvatar, post.authorBadge, post.authorId)}
                      className="w-11 h-11 rounded-full object-cover border border-slate-100 cursor-pointer hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 
                          onClick={() => handleOpenAuthorProfile(post.authorName, post.authorAvatar, post.authorBadge, post.authorId)}
                          className="text-sm font-bold text-slate-900 leading-none cursor-pointer hover:text-indigo-600 transition-colors"
                        >
                          {post.authorName}
                        </h4>
                        {post.authorBadge && (
                          <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded tracking-wider">
                            {post.authorBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-medium flex items-center gap-1.5 flex-wrap">
                        <span>{post.timeAgo}</span>
                        {post.isEdited && (
                          <span className="text-[10px] text-slate-400 font-normal italic">(แก้ไขแล้ว)</span>
                        )}
                        {post.courseTag && <span>• {post.courseTag}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Post Options Menu Button */}
                  <div className="relative">
                    <button 
                      onClick={() => setOpenMenuPostId(isMenuOpen ? null : post.id)}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 cursor-pointer transition-colors"
                      title="ตัวเลือกโพสต์"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-8 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 animate-in fade-in zoom-in-95 text-xs font-medium">
                        {canManageThisPost ? (
                          <>
                            <div className="px-3 py-1 text-[10px] font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-50">
                              {isOwner ? 'จัดการโพสต์ของคุณ' : 'จัดการโพสต์ (ผู้สอนประจำวิชา)'}
                            </div>
                            <button
                              onClick={() => {
                                setEditingPost(post);
                                setOpenMenuPostId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                              <span>แก้ไขโพสต์</span>
                            </button>
                            <button
                              onClick={() => {
                                setPostToDelete(post);
                                setOpenMenuPostId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              <span>ลบโพสต์</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                handleShare(post);
                                setOpenMenuPostId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>คัดลอกลิงก์โพสต์</span>
                            </button>
                            <button
                              onClick={() => {
                                showNotification('ส่งรายงานโพสต์นี้ให้ผู้ดูแลระบบแล้ว');
                                setOpenMenuPostId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-slate-600 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Flag className="w-3.5 h-3.5 text-amber-500" />
                              <span>รายงานโพสต์</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line font-normal">
                  {post.content}
                </p>

                {/* Optional Attached Image */}
                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-100 max-h-96 bg-slate-950 flex items-center justify-center relative group cursor-pointer">
                    <img
                      src={post.imageUrl}
                      alt="Attached media"
                      onClick={() => setPreviewModalImage(post.imageUrl!)}
                      className="w-full h-auto object-cover max-h-96 hover:scale-[1.01] transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => setPreviewModalImage(post.imageUrl!)}
                      className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg text-xs flex items-center gap-1 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Image</span>
                    </button>
                  </div>
                )}

                {/* Optional Attached File / Document Card */}
                {post.attachment && (
                  <div className="flex items-center justify-between p-3.5 bg-indigo-50/60 border border-indigo-200/80 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{post.attachment.name}</p>
                        <p className="text-xs text-slate-500">{post.attachment.size}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDownloadAttachment(post.attachment!)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-slate-500 text-xs font-medium">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => toggleLikePost(post.id)}
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isLiked ? 'text-red-600 font-bold' : 'hover:text-red-500'
                      }`}
                      title={isLiked ? 'ยกเลิกถูกใจ' : 'กดถูกใจ'}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-600 text-red-600' : ''}`} />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      onClick={() => setActiveCommentPostId(isCommentOpen ? null : post.id)}
                      className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="แสดงความคิดเห็น"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentsCount || (post.comments?.length ?? 0)}</span>
                    </button>

                    <button
                      onClick={() => handleShare(post)}
                      className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
                      title="แชร์โพสต์"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Comments Section */}
                {isCommentOpen && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                    {/* Existing comments */}
                    {post.comments && post.comments.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        {post.comments.map((comm) => (
                          <div key={comm.id} className="flex gap-2.5 bg-slate-50 p-3 rounded-xl">
                            <img
                              src={comm.authorAvatar}
                              alt={comm.authorName}
                              className="w-7 h-7 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{comm.authorName}</span>
                                {comm.authorRole && (
                                  <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1 rounded">
                                    {comm.authorRole}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400">{comm.createdAt}</span>
                              </div>
                              <p className="text-xs text-slate-700 mt-0.5">{comm.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No comments yet. Be the first to comment!</p>
                    )}

                    {/* New comment input */}
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInput[post.id] || ''}
                        onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shrink-0 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          }))}
        </div>
      </div>

      {/* Right Column: Trending Courses Widget */}
      <div className="w-80 flex flex-col gap-6 shrink-0">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Trending Courses</span>
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {courses.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No courses active yet. Create a course in the Courses tab.</p>
            ) : (
              courses.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => onNavigateToCourse(c.id)}
                  className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {c.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {c.instructor} • {c.enrolledCount} enrolled
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all self-center shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Study Buddy / Live Campus stats */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white shadow-lg shadow-indigo-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-200">Campus Activity</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div>
            <h4 className="text-lg font-bold">Fall Semester 2024</h4>
            <p className="text-xs text-indigo-200 mt-1">
              Midterms begin in 2 weeks. Check your weekly schedule and group study sessions.
            </p>
          </div>
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

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">ยืนยันการลบโพสต์?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                โพสต์นี้จะถูกลบออกจากฐานข้อมูล Firebase อย่างถาวร และไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'กำลังลบ...' : 'ลบโพสต์'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedProfileUser && (
        <UserProfileModal
          isOpen={!!selectedProfileUser}
          onClose={() => setSelectedProfileUser(null)}
          targetUser={selectedProfileUser}
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

