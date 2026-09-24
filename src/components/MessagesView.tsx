import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  Phone, 
  Video, 
  Info, 
  Plus, 
  Image as ImageIcon, 
  Paperclip, 
  Smile, 
  Send, 
  CheckCheck, 
  Users, 
  Edit3, 
  X,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  BookOpen,
  Layers,
  MessageCircle,
  Sparkles,
  School
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserProfile, ChatThread } from '../types';
import { UserProfileModal } from './profile/UserProfileModal';

export const MessagesView: React.FC = () => {
  const { user } = useAuth();
  const { 
    chatThreads, 
    currentChatId, 
    setCurrentChatId, 
    currentMessages, 
    sendMessage,
    joinStudyGroup,
    courses,
    allUsers
  } = useData();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [callModal, setCallModal] = useState<'voice' | 'video' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'sections' | 'direct'>('all');
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserProfile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate virtual section threads for courses if not already explicitly in chatThreads
  const allMergedThreads = useMemo(() => {
    const list: ChatThread[] = [...chatThreads];

    // For every course that the user is instructor or enrolled, ensure section chat rooms exist
    courses.forEach(course => {
      const isInstructor = user?.role === 'instructor' && (
        course.instructorId === user.uid || 
        course.instructor === user.name || 
        course.coInstructors?.includes(user.uid) ||
        course.coInstructors?.includes(user.name)
      );
      const isStudentEnrolled = course.enrolledStudents?.includes(user?.uid || '') || course.enrolledStudents?.includes(user?.name || '');
      const studentSec = course.enrolledStudentSections?.[user?.uid || ''] || course.enrolledStudentSections?.[user?.name || ''];

      if (isInstructor || isStudentEnrolled) {
        // Add course section threads
        if (course.sections && course.sections.length > 0) {
          course.sections.forEach(sec => {
            const secName = typeof sec === 'string' ? sec : (sec as any)?.sectionName || 'Section 1';
            
            // If student is enrolled in a specific SEC, only show thread for that SEC
            if (!isInstructor && studentSec && secName !== studentSec) {
              return;
            }

            const scheduleMatch = course.sectionSchedules?.find(s => s.sectionName === secName);
            const secThreadId = `course-sec-${course.id}-${(secName || 'sec').replace(/\s+/g, '-').toLowerCase()}`;
            if (!list.some(t => t.id === secThreadId)) {
              list.push({
                id: secThreadId,
                name: `${course.code || 'Course'} • ${secName}`,
                avatar: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&auto=format&fit=crop&q=80',
                isGroup: true,
                courseId: course.id,
                membersCount: course.enrolledCount || 1,
                activeNow: true,
                lastMessage: scheduleMatch 
                  ? `ห้องแชทประจำ ${secName} (${scheduleMatch.day} ${scheduleMatch.startTime}-${scheduleMatch.endTime})`
                  : `ห้องแชทประจำ ${secName}`,
                lastMessageTime: 'Active',
                unread: false
              });
            }
          });
        } else {
          const mainThreadId = `course-${course.id}`;
          if (!list.some(t => t.id === mainThreadId)) {
            list.push({
              id: mainThreadId,
              name: `${course.code || 'Course'} • Class Chat`,
              avatar: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&auto=format&fit=crop&q=80',
              isGroup: true,
              courseId: course.id,
              membersCount: course.enrolledCount || 1,
              activeNow: true,
              lastMessage: `ห้องแชทประจำวิชา ${course.title || ''}`,
              lastMessageTime: 'Active',
              unread: false
            });
          }
        }
      }
    });

    return list;
  }, [chatThreads, courses, user]);

  const activeThread = allMergedThreads.find(t => t.id === currentChatId) || allMergedThreads[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessage(messageText);
    setMessageText('');
  };

  const handleJoinGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await joinStudyGroup(newGroupName);
    setNewGroupName('');
    setShowJoinModal(false);
  };

  const filteredThreads = allMergedThreads.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeCategory === 'sections') {
      return Boolean(t.courseId || t.name.includes('Section') || t.name.includes('•'));
    }
    if (activeCategory === 'direct') {
      return !t.isGroup;
    }
    return true;
  });

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] bg-white flex overflow-hidden">
      {/* Left Chat Threads Sidebar matching Image 9 */}
      <div className="w-80 sm:w-96 border-r border-slate-100 flex flex-col justify-between bg-white shrink-0">
        <div className="flex flex-col p-5 gap-4 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Messages</h2>
            <button 
              onClick={() => setShowJoinModal(true)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              title="New Chat / Group"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหากลุ่มหรือแชท..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Category Filter Pills (Requirement 4: Section-based group chats) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                activeCategory === 'all' 
                  ? 'bg-white text-indigo-700 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({allMergedThreads.length})
            </button>
            <button
              onClick={() => setActiveCategory('sections')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                activeCategory === 'sections' 
                  ? 'bg-white text-indigo-700 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📚 Sections
            </button>
            <button
              onClick={() => setActiveCategory('direct')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                activeCategory === 'direct' 
                  ? 'bg-white text-indigo-700 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👤 Direct
            </button>
          </div>

          {/* Chat Threads List */}
          <div className="flex flex-col gap-1 mt-1">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                {activeCategory === 'sections' 
                  ? 'ยังไม่มีห้องประจำวิชาหรือ Section ที่เข้าร่วม' 
                  : 'ไม่พบการสนทนา'}
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.id === (activeThread?.id);
                return (
                  <div
                    key={thread.id}
                    onClick={() => setCurrentChatId(thread.id)}
                    className={`p-3 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer ${
                      isActive ? 'bg-indigo-50/70 border border-indigo-100 shadow-2xs' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={thread.avatar}
                        alt={thread.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      {thread.activeNow && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                          {thread.courseId && <span className="text-[10px] bg-indigo-100 text-indigo-800 font-black px-1.5 py-0.2 rounded">SEC</span>}
                          <span className="truncate">{thread.name}</span>
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {thread.lastMessageTime}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                        {thread.lastMessage || 'No messages yet'}
                      </p>
                    </div>

                    {thread.unread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Join Study Group Button at Bottom matching Image 9 */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            onClick={() => setShowJoinModal(true)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Create / Join Study Group</span>
          </button>
        </div>
      </div>

      {/* Right Chat Conversation Window */}
      {!activeThread ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] text-center p-8 text-slate-400">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Chat Channel Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Create or join a study group from the sidebar to begin exchanging messages and files in real-time.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between bg-[#F8FAFC]">
          {/* Chat Window Header */}
          <div className="h-16 px-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={activeThread.avatar}
                alt={activeThread.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">{activeThread.name}</h3>
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Active now • {activeThread.membersCount || 1} member(s)</span>
                </p>
              </div>
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCallModal('voice')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCallModal('video')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
              <button
                onClick={() => alert(`Group Info:\n${activeThread.name}\n${activeThread.membersCount || 1} members participating.`)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Group Details"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Message Stream */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
          {/* Time separator */}
          <div className="flex items-center justify-center my-2">
            <span className="bg-slate-200/60 text-slate-500 text-[10px] font-semibold px-3 py-1 rounded-full">
              Today, 10:42 AM
            </span>
          </div>

          {currentMessages.map((msg) => {
            const isUser = msg.isSelf || (user && msg.senderId === user.uid);

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-lg ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                {!isUser && (
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    onClick={() => {
                      const matched = allUsers.find(u => (msg.senderId && u.uid === msg.senderId) || (msg.senderName && u.name === msg.senderName));
                      if (matched) setSelectedProfileUser(matched);
                      else setSelectedProfileUser({
                        uid: msg.senderId || 'user-sender',
                        name: msg.senderName || 'Member',
                        role: 'student',
                        avatar: msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                        email: `${(msg.senderName || 'student').toLowerCase().replace(/\s+/g, '')}@student.edu`,
                        gradeLevel: 'Classmate',
                        bio: 'Member of this study group & course'
                      });
                    }}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 cursor-pointer hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                )}

                <div className="flex flex-col gap-1">
                  {!isUser && (
                    <span 
                      onClick={() => {
                        const matched = allUsers.find(u => (msg.senderId && u.uid === msg.senderId) || (msg.senderName && u.name === msg.senderName));
                        if (matched) setSelectedProfileUser(matched);
                        else setSelectedProfileUser({
                          uid: msg.senderId || 'user-sender',
                          name: msg.senderName || 'Member',
                          role: 'student',
                          avatar: msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                          email: `${(msg.senderName || 'student').toLowerCase().replace(/\s+/g, '')}@student.edu`,
                          gradeLevel: 'Classmate',
                          bio: 'Member of this study group & course'
                        });
                      }}
                      className="text-[11px] font-bold text-slate-600 ml-1 hover:text-indigo-600 cursor-pointer"
                    >
                      {msg.senderName}
                    </span>
                  )}

                  <div
                    className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        isUser ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isUser && <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Real-time Typing Bubble indicator */}
          <div className="flex gap-2 items-center self-start bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[11px] text-slate-400 font-medium">Jordan is typing</span>
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Chat Input Bar matching Image 9 */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={() => alert('Quick study invite created!')}
                className="p-2 hover:bg-slate-100 hover:text-indigo-600 rounded-full transition-colors"
                title="Add integration"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => alert('Select photo to send in chat')}
                className="p-2 hover:bg-slate-100 hover:text-indigo-600 rounded-full transition-colors"
                title="Send photo"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => alert('Select file to send in chat')}
                className="p-2 hover:bg-slate-100 hover:text-indigo-600 rounded-full transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-10 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setMessageText(prev => prev + ' 😊')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!messageText.trim()}
              className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center shadow-md shadow-indigo-100 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
      )}

      {/* Join Study Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Join or Create Study Group</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinGroupSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Study Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS101 Final Exam Study Squad"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-700">Popular Open Groups:</span>
                <button
                  type="button"
                  onClick={() => setNewGroupName('Design Thinking Sprint Team')}
                  className="text-left p-2.5 bg-slate-50 hover:bg-indigo-50 text-xs font-medium text-slate-800 rounded-xl border border-slate-200"
                >
                  🎨 Design Thinking Sprint Team (12 members)
                </button>
                <button
                  type="button"
                  onClick={() => setNewGroupName('Organic Chemistry Midterm Prep')}
                  className="text-left p-2.5 bg-slate-50 hover:bg-indigo-50 text-xs font-medium text-slate-800 rounded-xl border border-slate-200"
                >
                  🧪 Organic Chemistry Midterm Prep (8 members)
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100"
                >
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice / Video Call Simulation Modal */}
      {callModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-800 p-8 flex flex-col items-center gap-6 text-white text-center animate-in fade-in zoom-in-95">
            <div className="relative">
              <img
                src={activeThread.avatar}
                alt={activeThread.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/50"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-slate-900 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold">{activeThread.name}</h3>
              <p className="text-xs text-indigo-400 mt-1 font-semibold">
                {callModal === 'video' ? 'Interactive Video Meeting' : 'Group Voice Call'} • 00:34
              </p>
            </div>

            {callModal === 'video' && (
              <div className="w-full h-44 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 text-xs text-slate-400 relative overflow-hidden">
                {isVideoOff ? (
                  <span>Camera is turned off</span>
                ) : (
                  <div className="w-full h-full relative">
                    <img 
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80" 
                      alt="Call preview" 
                      className="w-full h-full object-cover opacity-80"
                    />
                    <span className="absolute bottom-2 left-3 bg-slate-900/80 text-[10px] px-2 py-1 rounded">Alex Mercer (You)</span>
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {callModal === 'video' && (
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={() => setCallModal(null)}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
                title="End Call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedProfileUser && (
        <UserProfileModal
          isOpen={Boolean(selectedProfileUser)}
          onClose={() => setSelectedProfileUser(null)}
          targetUser={selectedProfileUser}
        />
      )}
    </div>
  );
};
