import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  PostItem, 
  Course, 
  Assignment, 
  ScheduleEvent, 
  ChatThread, 
  ChatMessage, 
  DiscussionComment,
  PostComment,
  ClassCancellation,
  CourseSectionSchedule,
  UserProfile,
  CoInstructorInfo,
  SubmittedFile,
  AssignmentSubmission,
  PostAttachment,
  ClassAnnouncement,
  ClassMembership,
  ClassPost
} from '../types';
import { 
  INITIAL_POSTS, 
  INITIAL_COURSES, 
  INITIAL_ASSIGNMENTS, 
  INITIAL_SCHEDULE, 
  INITIAL_CHAT_THREADS, 
  INITIAL_MESSAGES_BIO 
} from '../data/initialData';
import { 
  db, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc, 
  query, 
  orderBy 
} from '../firebase';
import { useAuth } from './AuthContext';
import { sanitizeForFirestore } from '../utils/firestoreUtils';
import { secApi } from '../services/secApi';

interface DataContextType {
  posts: PostItem[];
  courses: Course[];
  assignments: Assignment[];
  scheduleEvents: ScheduleEvent[];
  chatThreads: ChatThread[];
  currentChatId: string;
  currentMessages: ChatMessage[];
  discussionComments: DiscussionComment[];
  activeCourseId: string;
  activeAssignmentId: string | null;
  allUsers: UserProfile[];
  allInstructors: UserProfile[];
  classAnnouncements: ClassAnnouncement[];
  
  // Post operations
  addPost: (content: string, courseTag?: string, imageUrl?: string, attachment?: PostItem['attachment'], courseId?: string, secId?: string, scope?: 'SEC' | 'ALL_SEC') => Promise<void>;
  editPost: (postId: string, content: string, courseTag?: string, imageUrl?: string, attachment?: PostItem['attachment'] | null) => Promise<{ success: boolean; message?: string }>;
  deletePost: (postId: string) => Promise<{ success: boolean; message?: string }>;
  toggleLikePost: (postId: string) => Promise<void>;
  addCommentToPost: (postId: string, text: string) => Promise<void>;
  
  // SEC Announcement Operations
  addClassAnnouncement: (classId: string, secId: string, scope: 'SEC' | 'ALL_SEC', title: string, content: string) => Promise<{ success: boolean; announcement?: ClassAnnouncement }>;
  deleteClassAnnouncement: (classId: string, announcementId: string) => Promise<{ success: boolean }>;
  getUserEnrolledSec: (courseId: string) => string | undefined;

  // Course CRUD & Instructor Management
  addCourse: (course: Omit<Course, 'id'>) => Promise<Course>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  addCoInstructor: (courseId: string, coInstructor: CoInstructorInfo) => Promise<{ success: boolean; message: string }>;
  removeCoInstructor: (courseId: string, coInstructorIdentifier: string) => Promise<void>;
  cancelCourseSession: (courseId: string, day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI', sectionName: string, reason: string, dateNote?: string) => Promise<void>;
  restoreCourseSession: (courseId: string, cancellationId: string) => Promise<void>;
  setCourseSection: (courseId: string, sectionName: string) => Promise<void>;
  joinCourse: (courseId: string, sectionName?: string) => Promise<{ success: boolean; message: string; alreadyJoined?: boolean; secId?: string }>;
  leaveCourse: (courseId: string) => Promise<void>;
  joinCourseByCode: (code: string, sectionName?: string) => Promise<{ success: boolean; message: string; course?: Course }>;
  removeStudentFromCourse: (courseId: string, studentIdentifier: string) => Promise<void>;
  
  // Assignment CRUD
  addAssignment: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  updateAssignment: (assignmentId: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (assignmentId: string) => Promise<void>;
  submitAssignment: (assignmentId: string, data: { fileNames?: string[]; files?: SubmittedFile[]; textEntry?: string; isDraft?: boolean }) => Promise<void>;
  gradeAssignmentSubmission: (
    assignmentId: string, 
    studentId: string, 
    grade: number, 
    feedback: string,
    studentInfo?: { studentName?: string; studentCode?: string; studentAvatar?: string; secId?: string }
  ) => Promise<{ success: boolean; submission?: any }>;
  
  // Schedule & Chat
  addScheduleEvent: (event: Omit<ScheduleEvent, 'id'>) => Promise<void>;
  addDiscussionComment: (text: string) => Promise<void>;
  sendMessage: (text: string, fileAttachment?: { name: string; size: string }) => Promise<void>;
  createChatThread: (name: string, isGroup?: boolean) => Promise<void>;
  setCurrentChatId: (id: string) => void;
  setActiveCourseId: (id: string) => void;
  setActiveAssignmentId: (id: string | null) => void;
  joinStudyGroup: (groupName: string) => Promise<void>;
  unreadMessagesCount: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DELETED_POSTS_KEY = 'sochool_deleted_post_ids';

const getDeletedPostIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_POSTS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
};

const addDeletedPostId = (postId: string) => {
  try {
    const set = getDeletedPostIds();
    set.add(postId);
    localStorage.setItem(DELETED_POSTS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>(() => {
    const deletedSet = getDeletedPostIds();
    try {
      const saved = localStorage.getItem('sochool_cached_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(p => !deletedSet.has(p.id) && !p.deleted_at);
        }
      }
    } catch {}
    return INITIAL_POSTS.filter(p => !deletedSet.has(p.id) && !p.deleted_at);
  });
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('sochool_cached_courses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_COURSES;
  });
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(INITIAL_SCHEDULE);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(INITIAL_CHAT_THREADS);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES_BIO);
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [discussionComments, setDiscussionComments] = useState<DiscussionComment[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // 1. Firestore Real-time Listener: Users
  useEffect(() => {
    try {
      const usersCol = collection(db, 'users');
      const unsub = onSnapshot(usersCol, (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
        });
        setAllUsers(list);
      }, (err) => console.warn('Firestore users snapshot note:', err));
      return () => unsub();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // 2. Firestore Real-time Listener: Posts
  useEffect(() => {
    try {
      const postsCol = collection(db, 'posts');
      const unsub = onSnapshot(postsCol, (snapshot) => {
        const deletedSet = getDeletedPostIds();
        const list: PostItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (data.deleted_at || deletedSet.has(docSnap.id)) {
            return;
          }
          list.push({ id: docSnap.id, ...data } as PostItem);
        });

        // Client-side robust sorting by newest first
        list.sort((a, b) => {
          const tA = typeof a.createdAt === 'number' ? a.createdAt : (a.updatedAt || 0);
          const tB = typeof b.createdAt === 'number' ? b.createdAt : (b.updatedAt || 0);
          if (tA && tB) return tB - tA;
          return b.id.localeCompare(a.id);
        });

        setPosts(list);
        try {
          localStorage.setItem('sochool_cached_posts', JSON.stringify(list));
        } catch {}
      }, (err) => {
        console.warn('Firestore posts snapshot note:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // 3. Firestore Real-time Listener: Courses
  useEffect(() => {
    try {
      const coursesCol = collection(db, 'courses');
      const unsub = onSnapshot(coursesCol, (snapshot) => {
        const list: Course[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Course);
        });

        if (list.length > 0) {
          setCourses(prev => {
            const map = new Map<string, Course>();
            list.forEach(c => map.set(c.id, c));
            prev.forEach(c => {
              if (!map.has(c.id)) {
                map.set(c.id, c);
              }
            });
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('sochool_cached_courses', JSON.stringify(merged));
            } catch {}
            return merged;
          });
          setActiveCourseId(prev => prev || list[0].id);
        } else {
          // If Firestore collection is empty, do NOT wipe local courses
          setCourses(prev => {
            if (prev.length > 0) return prev;
            try {
              const saved = localStorage.getItem('sochool_cached_courses');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
              }
            } catch {}
            return INITIAL_COURSES;
          });
        }
      }, (err) => console.warn('Firestore courses snapshot note:', err));
      return () => unsub();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // 4. Firestore Real-time Listener: Schedule
  useEffect(() => {
    try {
      const scheduleCol = collection(db, 'schedule');
      const unsub = onSnapshot(scheduleCol, (snapshot) => {
        const list: ScheduleEvent[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ScheduleEvent);
        });
        setScheduleEvents(list);
      }, (err) => console.warn('Firestore schedule snapshot note:', err));
      return () => unsub();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // 5. Firestore Real-time Listener: Assignments
  useEffect(() => {
    try {
      const assignCol = collection(db, 'assignments');
      const unsub = onSnapshot(assignCol, (snapshot) => {
        const list: Assignment[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Assignment);
        });
        setAssignments(list);
      }, (err) => console.warn('Firestore assignments snapshot note:', err));
      return () => unsub();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // 6. Firestore Real-time Listener: Threads
  useEffect(() => {
    try {
      const threadsCol = collection(db, 'threads');
      const unsub = onSnapshot(threadsCol, (snapshot) => {
        const list: ChatThread[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ChatThread);
        });
        setChatThreads(list);
        if (list.length > 0) {
          setCurrentChatId(prev => prev || list[0].id);
        }
      }, (err) => console.warn('Firestore threads snapshot note:', err));
      return () => unsub();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // 7. Firestore Real-time Listener: Chat Messages
  useEffect(() => {
    if (!currentChatId) {
      setCurrentMessages([]);
      return;
    }
    try {
      const messagesCol = collection(db, `chats_${currentChatId}`);
      const q = query(messagesCol, orderBy('timestampRaw', 'asc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            text: data.text,
            timestamp: data.timestamp || 'Now',
            isSelf: user ? data.senderId === user.uid : false,
            imageUrl: data.imageUrl,
            fileAttachment: data.fileAttachment
          });
        });
        setCurrentMessages(list);
      }, (err) => console.warn('Firestore chat snapshot note:', err));
      return () => unsub();
    } catch (e) {
      console.warn(e);
    }
  }, [currentChatId, user]);

  const allInstructors = allUsers.filter(u => u.role === 'instructor');

  // 8. Firestore Real-time Listener: Class Announcements
  const [classAnnouncements, setClassAnnouncements] = useState<ClassAnnouncement[]>(() => {
    try {
      const cached = localStorage.getItem('sochool_class_announcements');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [
      {
        id: 'ann-init-1',
        announcement_id: 'ann-init-1',
        class_id: 'course-1',
        sec_id: 'ALL_SEC',
        scope: 'ALL_SEC',
        author_id: 'inst-1',
        author_name: 'ดร. ธีรภัทร ชาญวิทย์',
        author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        author_role: 'instructor',
        title: '📢 [All SEC] ยินดีต้อนรับสู่รายวิชาและการเตรียมตัวสำหรับสอบกลางภาค',
        content: 'ขอให้นักศึกษาทุก SEC ตรวจสอบหัวข้อบรรยายสัปดาห์ที่ 1-6 และเตรียมเอกสารสรุปก่อนเริ่มสอบสัปดาห์หน้าครับ',
        created_at: Date.now() - 3600000 * 24
      },
      {
        id: 'ann-init-2',
        announcement_id: 'ann-init-2',
        class_id: 'course-1',
        sec_id: 'SEC 1',
        scope: 'SEC',
        author_id: 'inst-1',
        author_name: 'ดร. ธีรภัทร ชาญวิทย์',
        author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        author_role: 'instructor',
        title: '📌 [SEC 1 เท่านั้น] ย้ายห้องแล็บปฏิบัติการวันจันทร์นี้',
        content: 'สำหรับนักศึกษา SEC 1 วันจันทร์นี้เราจะย้ายไปเรียนที่ห้อง Lab 402 อาคารวิศวกรรมคอมพิวเตอร์ครับ',
        created_at: Date.now() - 3600000 * 12
      },
      {
        id: 'ann-init-3',
        announcement_id: 'ann-init-3',
        class_id: 'course-1',
        sec_id: 'SEC 2',
        scope: 'SEC',
        author_id: 'inst-1',
        author_name: 'ดร. ธีรภัทร ชาญวิทย์',
        author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        author_role: 'instructor',
        title: '📌 [SEC 2 เท่านั้น] กำหนดการส่งแบบฝึกหัดท้ายคาบวันพุธ',
        content: 'แจ้งนักศึกษา SEC 2 ให้ส่งการบ้านผ่านระบบก่อนเวลา 23:59 น. ของวันพุธนี้ครับ',
        created_at: Date.now() - 3600000 * 6
      }
    ];
  });

  useEffect(() => {
    try {
      const annCol = collection(db, 'class_announcements');
      const unsub = onSnapshot(annCol, (snapshot) => {
        const list: ClassAnnouncement[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ClassAnnouncement);
        });
        if (list.length > 0) {
          list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
          setClassAnnouncements(list);
          try {
            localStorage.setItem('sochool_class_announcements', JSON.stringify(list));
          } catch {}
        }
      }, (err) => console.warn('Firestore announcements note:', err));
      return () => unsub();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const getUserEnrolledSec = (courseId: string): string | undefined => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return undefined;
    const studentIdentifier = user?.uid || user?.name || 'student_guest';

    if (course.enrolledStudentSections && course.enrolledStudentSections[studentIdentifier]) {
      return course.enrolledStudentSections[studentIdentifier];
    }
    if (user?.uid && course.enrolledStudentSections && course.enrolledStudentSections[user.uid]) {
      return course.enrolledStudentSections[user.uid];
    }

    const isEnrolled = course.enrolledStudents && course.enrolledStudents.some(
      s => s === studentIdentifier || s === user?.uid || s === user?.name
    );
    if (isEnrolled) {
      return course.selectedSection || (course.sections && course.sections.length > 0 ? course.sections[0] : 'SEC 1');
    }
    return undefined;
  };

  const addClassAnnouncement = async (
    classId: string, 
    secId: string, 
    scope: 'SEC' | 'ALL_SEC', 
    title: string, 
    content: string
  ): Promise<{ success: boolean; announcement?: ClassAnnouncement }> => {
    const newAnn: ClassAnnouncement = {
      id: 'ann-' + Date.now(),
      announcement_id: 'ann-' + Date.now(),
      class_id: classId,
      sec_id: scope === 'ALL_SEC' ? 'ALL_SEC' : secId,
      scope,
      author_id: user?.uid || 'instructor',
      author_name: user?.name || 'Faculty Member',
      author_avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      author_role: user?.role || 'instructor',
      title: title.trim(),
      content: content.trim(),
      created_at: Date.now()
    };

    setClassAnnouncements(prev => {
      const updated = [newAnn, ...prev];
      try {
        localStorage.setItem('sochool_class_announcements', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await secApi.createAnnouncement(classId, secId, scope, title, content, user);
    } catch (e) {
      console.warn('Backend secApi announcement note:', e);
    }

    try {
      await setDoc(doc(db, 'class_announcements', newAnn.id), sanitizeForFirestore(newAnn));
    } catch (e) {
      console.warn('Firestore announcement sync note:', e);
    }

    return { success: true, announcement: newAnn };
  };

  const deleteClassAnnouncement = async (classId: string, announcementId: string): Promise<{ success: boolean }> => {
    setClassAnnouncements(prev => {
      const filtered = prev.filter(a => a.id !== announcementId && a.announcement_id !== announcementId);
      try {
        localStorage.setItem('sochool_class_announcements', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });

    try {
      await secApi.deleteAnnouncement(classId, announcementId, user);
    } catch (e) {
      console.warn('Backend delete announcement note:', e);
    }

    try {
      await deleteDoc(doc(db, 'class_announcements', announcementId));
    } catch (e) {
      console.warn('Firestore delete announcement note:', e);
    }

    return { success: true };
  };

  // ==========================================
  // POSTS CRUD (Firebase Firestore Persistence & Access Control)
  // ==========================================
  const addPost = async (
    content: string, 
    courseTag: string = 'General', 
    imageUrl?: string, 
    attachment?: PostItem['attachment'],
    courseId?: string,
    secId?: string,
    scope?: 'SEC' | 'ALL_SEC'
  ) => {
    const authorName = user?.name || 'Campus Member';
    const authorAvatar = user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    const authorId = user?.uid || 'user_' + Date.now();

    let targetSecId = secId;
    let targetScope = scope || (secId === 'ALL_SEC' ? 'ALL_SEC' : 'SEC');

    if (courseId && !targetSecId) {
      targetSecId = getUserEnrolledSec(courseId) || 'SEC 1';
    }

    const newPost: PostItem = {
      id: 'post-' + Date.now(),
      authorId,
      authorName,
      authorAvatar,
      ...(user?.role === 'instructor' ? { authorBadge: 'FACULTY' } : {}),
      timeAgo: 'Just now',
      courseTag,
      ...(courseId ? { courseId } : {}),
      ...(targetSecId ? { secId: targetSecId } : {}),
      scope: targetScope,
      content,
      ...(imageUrl ? { imageUrl } : {}),
      ...(attachment ? { attachment } : {}),
      likes: 0,
      likedBy: [],
      commentsCount: 0,
      createdAt: Date.now(),
      comments: []
    };

    setPosts(prev => {
      const next = [newPost, ...prev];
      try {
        localStorage.setItem('sochool_cached_posts', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to backend secApi
    if (courseId && targetSecId) {
      try {
        await secApi.createPost(courseId, targetSecId, content, user, { imageUrl, attachment });
      } catch (e) {
        console.warn('secApi createPost note:', e);
      }
    }

    try {
      await setDoc(doc(db, 'posts', newPost.id), sanitizeForFirestore(newPost));
    } catch (e) {
      console.warn('Post firestore sync note:', e);
    }
  };

  const editPost = async (
    postId: string, 
    content: string, 
    courseTag?: string, 
    imageUrl?: string, 
    attachment?: PostItem['attachment'] | null
  ): Promise<{ success: boolean; message?: string }> => {
    const postToEdit = posts.find(p => p.id === postId);
    if (!postToEdit) return { success: false, message: 'ไม่พบโพสต์ที่ต้องการแก้ไข' };

    const currentUid = user?.uid;
    const isOwner = Boolean(currentUid && (postToEdit.authorId === currentUid || postToEdit.authorName === user?.name));

    // Teacher in the same course can also edit
    let isTeacherOfCourse = false;
    if (user?.role === 'instructor') {
      const targetCourse = courses.find(c => 
        (postToEdit.courseId && c.id === postToEdit.courseId) ||
        (postToEdit.courseTag && (c.code === postToEdit.courseTag || c.title === postToEdit.courseTag))
      ) || (activeCourseId ? courses.find(c => c.id === activeCourseId) : null);

      if (targetCourse) {
        isTeacherOfCourse = Boolean(
          targetCourse.instructorId === currentUid || 
          targetCourse.instructor === user?.name ||
          (targetCourse.coInstructors && targetCourse.coInstructors.includes(currentUid)) ||
          (targetCourse.coInstructorDetails && targetCourse.coInstructorDetails.some(ci => ci.uid === currentUid || ci.name === user?.name))
        );
      }
    }

    if (!isOwner && !isTeacherOfCourse) {
      return { 
        success: false, 
        message: 'คุณไม่มีสิทธิ์แก้ไขโพสต์นี้ (อนุญาตเฉพาะเจ้าของโพสต์หรืออาจารย์ประจำวิชา)' 
      };
    }

    const updatedData: Partial<PostItem> = {
      content: content.trim(),
      courseTag: courseTag || postToEdit.courseTag || 'General',
      imageUrl: imageUrl !== undefined ? (imageUrl || '') : (postToEdit.imageUrl || ''),
      attachment: attachment !== undefined ? (attachment || null) : (postToEdit.attachment || null),
      isEdited: true,
      updatedAt: Date.now()
    };

    setPosts(prev => {
      const next = prev.map(p => p.id === postId ? { ...p, ...updatedData } : p);
      try {
        localStorage.setItem('sochool_cached_posts', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to backend secApi
    const classId = postToEdit.courseId || (activeCourseId ? activeCourseId : 'course-programming');
    try {
      await secApi.editPost(classId, postId, content, user, { imageUrl, attachment });
    } catch (apiErr) {
      console.warn('secApi editPost sync note:', apiErr);
    }

    try {
      await updateDoc(doc(db, 'posts', postId), sanitizeForFirestore(updatedData) as any);
      return { success: true, message: 'บันทึกการแก้ไขโพสต์เรียบร้อย' };
    } catch (e) {
      console.warn('Edit post firestore sync note:', e);
      try {
        await setDoc(doc(db, 'posts', postId), sanitizeForFirestore({ ...postToEdit, ...updatedData }), { merge: true });
      } catch (err2) {
        console.warn('setDoc fallback error:', err2);
      }
      return { success: true, message: 'บันทึกการแก้ไขโพสต์เรียบร้อย' };
    }
  };

  const deletePost = async (postId: string): Promise<{ success: boolean; message?: string }> => {
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete) return { success: false, message: 'ไม่พบโพสต์ที่ต้องการลบ' };

    const currentUid = user?.uid;
    const isOwner = Boolean(currentUid && (postToDelete.authorId === currentUid || postToDelete.authorName === user?.name));

    // Teacher in the same course can also delete
    let isTeacherOfCourse = false;
    if (user?.role === 'instructor') {
      const targetCourse = courses.find(c => 
        (postToDelete.courseId && c.id === postToDelete.courseId) ||
        (postToDelete.courseTag && (c.code === postToDelete.courseTag || c.title === postToDelete.courseTag))
      ) || (activeCourseId ? courses.find(c => c.id === activeCourseId) : null);

      if (targetCourse) {
        isTeacherOfCourse = Boolean(
          targetCourse.instructorId === currentUid || 
          targetCourse.instructor === user?.name ||
          (targetCourse.coInstructors && targetCourse.coInstructors.includes(currentUid)) ||
          (targetCourse.coInstructorDetails && targetCourse.coInstructorDetails.some(ci => ci.uid === currentUid || ci.name === user?.name))
        );
      }
    }

    if (!isOwner && !isTeacherOfCourse) {
      return { 
        success: false, 
        message: 'คุณไม่มีสิทธิ์ลบโพสต์นี้ (อนุญาตเฉพาะเจ้าของโพสต์หรืออาจารย์ประจำวิชา)' 
      };
    }

    // 1. Record in tombstone storage so refresh/navigation will NEVER resurrect it
    addDeletedPostId(postId);

    // 2. Remove immediately from React state and localStorage cache
    setPosts(prev => {
      const filtered = prev.filter(p => p.id !== postId);
      try {
        localStorage.setItem('sochool_cached_posts', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });

    // 3. Sync delete to backend secApi
    const classId = postToDelete.courseId || (activeCourseId ? activeCourseId : 'course-programming');
    try {
      await secApi.deletePost(classId, postId, user);
    } catch (apiErr) {
      console.warn('secApi deletePost sync note:', apiErr);
    }

    // 4. Soft-delete and deleteDoc in Firestore
    try {
      await updateDoc(doc(db, 'posts', postId), {
        deleted_at: Date.now(),
        deleted_by: currentUid || 'unknown'
      }).catch(() => {});
      await deleteDoc(doc(db, 'posts', postId)).catch(() => {});
      return { success: true, message: 'ลบโพสต์สำเร็จ' };
    } catch (e) {
      console.warn('Delete post firestore sync note:', e);
      return { success: true, message: 'ลบโพสต์สำเร็จ' };
    }
  };

  const toggleLikePost = async (postId: string) => {
    const currentUserId = user?.uid || 'guest_' + (user?.name || 'user');
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = p.likedBy?.includes(currentUserId) ?? false;
        const updatedLikedBy = isLiked 
          ? (p.likedBy || []).filter(id => id !== currentUserId)
          : [...(p.likedBy || []), currentUserId];
        const updatedLikes = isLiked ? Math.max(0, p.likes - 1) : p.likes + 1;
        
        try {
          updateDoc(doc(db, 'posts', postId), sanitizeForFirestore({
            likes: updatedLikes,
            likedBy: updatedLikedBy
          })).catch(() => {
            setDoc(doc(db, 'posts', postId), sanitizeForFirestore({
              ...p,
              likes: updatedLikes,
              likedBy: updatedLikedBy
            }), { merge: true }).catch(console.warn);
          });
        } catch (e) {
          console.warn(e);
        }

        return {
          ...p,
          likes: updatedLikes,
          likedBy: updatedLikedBy
        };
      }
      return p;
    }));
  };

  const addCommentToPost = async (postId: string, text: string) => {
    if (!text.trim()) return;
    const newComment: PostComment = {
      id: 'comm-' + Date.now(),
      authorId: user?.uid || 'guest_' + Date.now(),
      authorName: user?.name || 'Campus Member',
      authorAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ...(user?.role === 'instructor' ? { authorRole: 'FACULTY' } : {}),
      content: text.trim(),
      createdAt: 'Just now'
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const comments = p.comments ? [...p.comments, newComment] : [newComment];
        const updated = {
          ...p,
          commentsCount: comments.length,
          comments
        };
        try {
          setDoc(doc(db, 'posts', postId), sanitizeForFirestore(updated), { merge: true }).catch(console.warn);
        } catch (e) {
          console.warn(e);
        }
        return updated;
      }
      return p;
    }));
  };

  // ==========================================
  // COURSES & INSTRUCTOR/CO-INSTRUCTOR CRUD
  // ==========================================
  const addCourse = async (courseData: Omit<Course, 'id'>): Promise<Course> => {
    const currentUid = user?.uid || 'instructor_user';
    const currentName = user?.name || courseData.instructor || 'Faculty Instructor';

    const newCourse: Course = {
      ...courseData,
      id: 'course-' + Date.now(),
      instructorId: courseData.instructorId || currentUid,
      instructor: courseData.instructor || currentName,
      coInstructors: courseData.coInstructors || [],
      coInstructorDetails: courseData.coInstructorDetails || [],
      enrolledStudents: Array.from(new Set([
        ...(courseData.enrolledStudents || []),
        currentUid,
        ...(currentName ? [currentName] : [])
      ]))
    };

    setCourses(prev => {
      const next = [newCourse, ...prev.filter(c => c.id !== newCourse.id)];
      try {
        localStorage.setItem('sochool_cached_courses', JSON.stringify(next));
      } catch {}
      return next;
    });
    setActiveCourseId(newCourse.id);

    try {
      await setDoc(doc(db, 'courses', newCourse.id), sanitizeForFirestore(newCourse));

      // If it's a regular course with section schedules, automatically generate schedule events
      if (newCourse.type === 'regular' && newCourse.sectionSchedules && newCourse.sectionSchedules.length > 0) {
        for (const sec of newCourse.sectionSchedules) {
          const newEvent: ScheduleEvent = {
            id: 'sch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            title: newCourse.title,
            type: 'Lecture',
            code: newCourse.code,
            courseId: newCourse.id,
            section: sec.sectionName,
            createdBy: currentUid,
            day: sec.day,
            startTime: sec.startTime,
            endTime: sec.endTime,
            displayTime: sec.displayTime || `${sec.startTime} - ${sec.endTime}`,
            location: sec.location || 'Academic Building',
            colorTheme: 'blue'
          };
          setScheduleEvents(prev => [...prev, newEvent]);
          await setDoc(doc(db, 'schedule', newEvent.id), sanitizeForFirestore(newEvent));
        }
      }
    } catch (e) {
      console.warn('Course firestore sync note:', e);
    }

    return newCourse;
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    const oldCourse = courses.find(c => c.id === courseId);
    setCourses(prev => {
      const next = prev.map(c => c.id === courseId ? { ...c, ...updates } : c);
      try {
        localStorage.setItem('sochool_cached_courses', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to backend secApi decorateClass
    try {
      await secApi.decorateClass(courseId, updates, user);
    } catch (apiErr) {
      console.warn('secApi decorateClass sync note:', apiErr);
    }

    try {
      await setDoc(doc(db, 'courses', courseId), sanitizeForFirestore({ ...(oldCourse || {}), ...updates }), { merge: true });

      // If title or code updated, sync with schedule events and assignments
      if ((updates.title && updates.title !== oldCourse?.title) || (updates.code && updates.code !== oldCourse?.code)) {
        const newTitle = updates.title || oldCourse?.title || '';
        const newCode = updates.code || oldCourse?.code || '';

        setScheduleEvents(prev => prev.map(ev => {
          if (ev.courseId === courseId || (oldCourse && ev.code === oldCourse.code)) {
            const updatedEv = { ...ev, title: newTitle, code: newCode };
            updateDoc(doc(db, 'schedule', ev.id), sanitizeForFirestore({ title: newTitle, code: newCode })).catch(console.warn);
            return updatedEv;
          }
          return ev;
        }));

        setAssignments(prev => prev.map(a => {
          if (a.courseId === courseId) {
            const updatedAssign = { ...a, courseName: newTitle };
            updateDoc(doc(db, 'assignments', a.id), sanitizeForFirestore({ courseName: newTitle })).catch(console.warn);
            return updatedAssign;
          }
          return a;
        }));
      }

      // If sectionSchedules updated on regular course, update timetable
      if (updates.sectionSchedules && updates.type !== 'workshop') {
        // Remove old schedule events for this course
        const oldEvents = scheduleEvents.filter(ev => ev.courseId === courseId);
        for (const oev of oldEvents) {
          try {
            await deleteDoc(doc(db, 'schedule', oev.id));
          } catch (err) {
            console.warn(err);
          }
        }

        // Add new section schedule events
        const newEvents: ScheduleEvent[] = updates.sectionSchedules.map(sec => ({
          id: 'sch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          title: updates.title || oldCourse?.title || '',
          type: 'Lecture',
          code: updates.code || oldCourse?.code || '',
          courseId,
          section: sec.sectionName,
          createdBy: user?.uid || 'instructor',
          day: sec.day,
          startTime: sec.startTime,
          endTime: sec.endTime,
          displayTime: sec.displayTime || `${sec.startTime} - ${sec.endTime}`,
          location: sec.location || 'Academic Building',
          colorTheme: 'blue'
        }));

        setScheduleEvents(prev => [...prev.filter(ev => ev.courseId !== courseId), ...newEvents]);
        for (const nev of newEvents) {
          await setDoc(doc(db, 'schedule', nev.id), sanitizeForFirestore(nev));
        }
      }
    } catch (e) {
      console.warn('Update course firestore sync note:', e);
    }
  };

  const deleteCourse = async (courseId: string) => {
    const target = courses.find(c => c.id === courseId);
    if (!target) return;

    // 1. Remove course from state and update activeCourseId
    const remainingCourses = courses.filter(c => c.id !== courseId);
    setCourses(remainingCourses);
    try {
      localStorage.setItem('sochool_cached_courses', JSON.stringify(remainingCourses));
    } catch {}

    if (activeCourseId === courseId) {
      setActiveCourseId(remainingCourses.length > 0 ? remainingCourses[0].id : '');
    }

    // 2. Cascade delete POSTS in this course
    const isMatchingPost = (p: PostItem) => {
      if (p.courseId === courseId) return true;
      if (target.code && (p.courseId === target.code || p.courseTag === target.code)) return true;
      if (target.title && p.courseTag === target.title) return true;
      if (p.courseTag && target.code && p.courseTag.toLowerCase().includes(target.code.toLowerCase())) return true;
      return false;
    };

    const toDeletePosts = posts.filter(isMatchingPost);
    if (toDeletePosts.length > 0) {
      toDeletePosts.forEach(p => addDeletedPostId(p.id));
      const remainingPosts = posts.filter(p => !isMatchingPost(p));
      setPosts(remainingPosts);
      try {
        localStorage.setItem('sochool_cached_posts', JSON.stringify(remainingPosts));
      } catch {}

      // Delete from Firestore
      for (const p of toDeletePosts) {
        try {
          await updateDoc(doc(db, 'posts', p.id), {
            deleted_at: Date.now(),
            deleted_by: user?.uid || 'instructor'
          }).catch(() => {});
          await deleteDoc(doc(db, 'posts', p.id)).catch(() => {});
        } catch (err) {
          console.warn('Delete course post firestore error:', err);
        }
      }
    }

    // 3. Cascade delete ASSIGNMENTS and SUBMISSIONS
    const toDeleteAssign = assignments.filter(a => a.courseId === courseId || (target.code && a.courseId === target.code));
    setAssignments(prev => prev.filter(a => a.courseId !== courseId && (!target.code || a.courseId !== target.code)));
    if (activeAssignmentId && toDeleteAssign.some(a => a.id === activeAssignmentId)) {
      setActiveAssignmentId(null);
    }
    for (const a of toDeleteAssign) {
      try {
        await deleteDoc(doc(db, 'assignments', a.id)).catch(() => {});
      } catch (err) {
        console.warn('Delete course assignment firestore error:', err);
      }
    }

    // 4. Cascade delete CLASS ANNOUNCEMENTS
    const toDeleteAnn = classAnnouncements.filter(ann => ann.class_id === courseId || (target.code && ann.class_id === target.code));
    if (toDeleteAnn.length > 0) {
      const remainingAnn = classAnnouncements.filter(ann => ann.class_id !== courseId && (!target.code || ann.class_id !== target.code));
      setClassAnnouncements(remainingAnn);
      try {
        localStorage.setItem('sochool_class_announcements', JSON.stringify(remainingAnn));
      } catch {}
      for (const ann of toDeleteAnn) {
        try {
          await deleteDoc(doc(db, 'class_announcements', ann.id)).catch(() => {});
        } catch (err) {
          console.warn('Delete course announcement firestore error:', err);
        }
      }
    }

    // 5. Cascade delete SCHEDULE EVENTS
    const toDeleteSchedule = scheduleEvents.filter(ev => ev.courseId === courseId || (target.code && (ev.code === target.code || ev.courseId === target.code)));
    setScheduleEvents(prev => prev.filter(ev => ev.courseId !== courseId && (!target.code || (ev.code !== target.code && ev.courseId !== target.code))));
    for (const ev of toDeleteSchedule) {
      try {
        await deleteDoc(doc(db, 'schedule', ev.id)).catch(() => {});
      } catch (err) {
        console.warn('Delete course schedule firestore error:', err);
      }
    }

    // 6. Cascade delete CHAT THREADS
    const toDeleteThreads = chatThreads.filter(t => 
      t.courseId === courseId || 
      (target.code && (t.courseId === target.code || t.name.toLowerCase().includes(target.code.toLowerCase())))
    );
    if (toDeleteThreads.length > 0) {
      const remainingThreads = chatThreads.filter(t => !toDeleteThreads.some(dt => dt.id === t.id));
      setChatThreads(remainingThreads);
      if (toDeleteThreads.some(t => t.id === currentChatId)) {
        setCurrentChatId(remainingThreads.length > 0 ? remainingThreads[0].id : '');
      }
      for (const t of toDeleteThreads) {
        try {
          await deleteDoc(doc(db, 'threads', t.id)).catch(() => {});
        } catch (err) {
          console.warn('Delete course thread firestore error:', err);
        }
      }
    }

    // 7. Delete Course Document from Firestore
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      if (target.code && target.code !== courseId) {
        await deleteDoc(doc(db, 'courses', target.code)).catch(() => {});
      }
    } catch (e) {
      console.warn('Delete course firestore note:', e);
    }

    // 8. Delete in Backend (secService & API)
    try {
      await secApi.deleteClass(courseId, user);
      if (target.code && target.code !== courseId) {
        await secApi.deleteClass(target.code, user).catch(() => {});
      }
    } catch (apiErr) {
      console.warn('Backend secApi.deleteClass note:', apiErr);
    }
  };

  const addCoInstructor = async (courseId: string, coInstructor: CoInstructorInfo): Promise<{ success: boolean; message: string }> => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return { success: false, message: 'ไม่พบรายวิชา' };

    const currentCo = course.coInstructors || [];
    const currentDetails = course.coInstructorDetails || [];

    const idToSave = coInstructor.uid || coInstructor.name;
    if (currentCo.includes(idToSave) || currentCo.includes(coInstructor.name)) {
      return { success: false, message: `อาจารย์ ${coInstructor.name} เป็นอาจารย์ร่วมสอนของวิชานี้อยู่แล้ว` };
    }

    const updatedCo = [...currentCo, idToSave, coInstructor.name].filter((v, i, a) => a.indexOf(v) === i);
    const updatedDetails: CoInstructorInfo[] = [
      ...currentDetails.filter(d => d.name !== coInstructor.name && d.uid !== coInstructor.uid),
      {
        ...coInstructor,
        roleTitle: coInstructor.roleTitle || 'อาจารย์ร่วมสอน (Co-Instructor)',
        addedAt: new Date().toLocaleDateString('th-TH')
      }
    ];

    const updatedCourse: Course = {
      ...course,
      coInstructors: updatedCo,
      coInstructorDetails: updatedDetails
    };

    setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));

    try {
      await updateDoc(doc(db, 'courses', courseId), {
        coInstructors: updatedCo,
        coInstructorDetails: updatedDetails
      });
    } catch (e) {
      console.warn('Add co-instructor sync note:', e);
    }

    return { success: true, message: `เพิ่มอาจารย์ ${coInstructor.name} เป็นอาจารย์ร่วมสอนเรียบร้อยแล้ว` };
  };

  const removeCoInstructor = async (courseId: string, coInstructorIdentifier: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const updatedCo = (course.coInstructors || []).filter(
      id => id !== coInstructorIdentifier && !id.toLowerCase().includes(coInstructorIdentifier.toLowerCase())
    );
    const updatedDetails = (course.coInstructorDetails || []).filter(
      d => d.uid !== coInstructorIdentifier && d.name !== coInstructorIdentifier && d.email !== coInstructorIdentifier
    );

    const updatedCourse: Course = {
      ...course,
      coInstructors: updatedCo,
      coInstructorDetails: updatedDetails
    };

    setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));

    try {
      await updateDoc(doc(db, 'courses', courseId), {
        coInstructors: updatedCo,
        coInstructorDetails: updatedDetails
      });
    } catch (e) {
      console.warn('Remove co-instructor sync note:', e);
    }
  };

  const removeStudentFromCourse = async (courseId: string, studentIdentifier: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const updatedEnrolled = (course.enrolledStudents || []).filter(
      s => s !== studentIdentifier && !s.toLowerCase().includes(studentIdentifier.toLowerCase())
    );
    const newCount = Math.max(0, updatedEnrolled.length);

    const updatedCourse: Course = {
      ...course,
      enrolledCount: newCount,
      enrolledStudents: updatedEnrolled
    };

    setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));

    try {
      await updateDoc(doc(db, 'courses', courseId), {
        enrolledCount: newCount,
        enrolledStudents: updatedEnrolled
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const cancelCourseSession = async (
    courseId: string, 
    day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI', 
    sectionName: string, 
    reason: string, 
    dateNote: string = 'สัปดาห์นี้'
  ) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const cancellation: ClassCancellation = {
      id: 'canc-' + Date.now(),
      courseId,
      courseCode: course.code,
      courseTitle: course.title,
      sectionName,
      day,
      dateNote,
      reason: reason.trim() || 'อาจารย์ติดภารกิจ/ยกเลิกคลาส',
      cancelledBy: user?.name || course.instructor || 'Instructor',
      cancelledAt: new Date().toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    const updatedCancellations = [...(course.cancelledSessions || []), cancellation];

    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return { ...c, cancelledSessions: updatedCancellations };
      }
      return c;
    }));
    try {
      await updateDoc(doc(db, 'courses', courseId), { cancelledSessions: updatedCancellations });
    } catch (e) {
      console.warn(e);
    }

    setScheduleEvents(prev => prev.map(ev => {
      const matchCourse = ev.courseId === courseId || ev.code === course.code;
      const matchSec = !sectionName || sectionName === 'All Sections' || ev.section === sectionName;
      const matchDay = ev.day === day;
      if (matchCourse && matchSec && matchDay) {
        const updatedEv = {
          ...ev,
          isCancelled: true,
          cancellationReason: reason
        };
        try {
          updateDoc(doc(db, 'schedule', ev.id), { isCancelled: true, cancellationReason: reason }).catch(console.warn);
        } catch (err) {
          console.warn(err);
        }
        return updatedEv;
      }
      return ev;
    }));

    const postContent = `📢 [แจ้งยกคลาส / CLASS CANCELLED]\nวิชา ${course.code} - ${course.title} (${sectionName})\nวัน: ${day} (${dateNote})\nเหตุผล: ${reason}`;
    await addPost(postContent, course.code);
  };

  const restoreCourseSession = async (courseId: string, cancellationId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const targetCanc = (course.cancelledSessions || []).find(cn => cn.id === cancellationId);
    const updatedCancellations = (course.cancelledSessions || []).filter(cn => cn.id !== cancellationId);

    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return { ...c, cancelledSessions: updatedCancellations };
      }
      return c;
    }));
    try {
      await updateDoc(doc(db, 'courses', courseId), { cancelledSessions: updatedCancellations });
    } catch (e) {
      console.warn(e);
    }

    if (targetCanc) {
      setScheduleEvents(prev => prev.map(ev => {
        const matchCourse = ev.courseId === courseId || ev.code === course.code;
        const matchDay = ev.day === targetCanc.day;
        if (matchCourse && matchDay) {
          const restoredEv = {
            ...ev,
            isCancelled: false,
            cancellationReason: undefined
          };
          try {
            updateDoc(doc(db, 'schedule', ev.id), { isCancelled: false, cancellationReason: null }).catch(console.warn);
          } catch (err) {
            console.warn(err);
          }
          return restoredEv;
        }
        return ev;
      }));
    }
  };

  const setCourseSection = async (courseId: string, sectionName: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const updated = { ...c, selectedSection: sectionName };
        try {
          updateDoc(doc(db, 'courses', courseId), { selectedSection: sectionName }).catch(console.warn);
        } catch (e) {
          console.warn(e);
        }
        return updated;
      }
      return c;
    }));
  };

  const joinCourse = async (courseId: string, sectionName?: string): Promise<{ success: boolean; message: string; alreadyJoined?: boolean; secId?: string }> => {
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      return { success: false, message: 'ไม่พบรายวิชานี้ในระบบ' };
    }

    const studentIdentifier = user?.uid || user?.name || 'student_guest';
    const currentEnrolled = course.enrolledStudents || [];
    const existingSec = course.enrolledStudentSections?.[studentIdentifier] || (user?.uid ? course.enrolledStudentSections?.[user.uid] : undefined);
    
    // Check if already enrolled
    const isEnrolled = currentEnrolled.includes(studentIdentifier) || (user?.uid ? currentEnrolled.includes(user.uid) : false);
    if (isEnrolled) {
      const activeSec = existingSec || course.selectedSection || (course.sections && course.sections.length > 0 ? course.sections[0] : 'SEC 1');
      return { 
        success: true, 
        alreadyJoined: true, 
        secId: activeSec,
        message: `คุณได้ลงทะเบียนในกลุ่ม ${activeSec} ของวิชานี้เรียบร้อยแล้ว (ไม่สร้างสมาชิกซ้ำ)` 
      };
    }

    const rawSections = course.sections && course.sections.length > 0 
      ? course.sections.filter(s => s !== 'All Sections' && s !== 'All SEC')
      : ['SEC 1'];
    const defaultSec = rawSections[0] || 'SEC 1';
    const targetSection = sectionName || course.selectedSection || defaultSec;

    const updatedEnrolled = [...currentEnrolled, studentIdentifier];
    const updatedSectionsMap: Record<string, string> = {
      ...(course.enrolledStudentSections || {}),
      [studentIdentifier]: targetSection
    };
    if (user?.uid) {
      updatedSectionsMap[user.uid] = targetSection;
    }

    const updatedCourse: Course = {
      ...course,
      enrolledCount: (course.enrolledCount || 0) + 1,
      enrolledStudents: updatedEnrolled,
      enrolledStudentSections: updatedSectionsMap,
      selectedSection: targetSection
    };

    setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));

    // Sync to backend secApi
    try {
      await secApi.joinClass(courseId, targetSection, user);
    } catch (e) {
      console.warn('Backend secApi join note:', e);
    }

    try {
      await updateDoc(doc(db, 'courses', courseId), {
        enrolledCount: updatedCourse.enrolledCount,
        enrolledStudents: updatedEnrolled,
        enrolledStudentSections: updatedSectionsMap,
        selectedSection: targetSection
      });
    } catch (e) {
      console.warn('Enrollment firestore sync note:', e);
    }

    if (course.type === 'regular' && course.sectionSchedules) {
      const secSchedule = course.sectionSchedules.find(s => s.sectionName === targetSection) || course.sectionSchedules[0];
      if (secSchedule) {
        const exists = scheduleEvents.some(ev => (ev.courseId === course.id || ev.code === course.code) && ev.day === secSchedule.day);
        if (!exists) {
          const newEvent: ScheduleEvent = {
            id: 'sch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            title: course.title,
            type: 'Lecture',
            code: course.code,
            courseId: course.id,
            section: secSchedule.sectionName,
            createdBy: user?.uid || 'student',
            day: secSchedule.day,
            startTime: secSchedule.startTime,
            endTime: secSchedule.endTime,
            displayTime: secSchedule.displayTime || `${secSchedule.startTime} - ${secSchedule.endTime}`,
            location: secSchedule.location || 'Academic Building',
            colorTheme: 'blue'
          };
          setScheduleEvents(prev => [...prev, newEvent]);
          try {
            await setDoc(doc(db, 'schedule', newEvent.id), newEvent);
          } catch (e) {
            console.warn(e);
          }
        }
      }
    }

    return { 
      success: true, 
      alreadyJoined: false, 
      secId: targetSection,
      message: `เข้าร่วมวิชา ${course.code} - ${course.title} (${targetSection}) สำเร็จแล้ว!` 
    };
  };

  const leaveCourse = async (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const studentIdentifier = user?.uid || user?.name || 'student_guest';
    const updatedEnrolled = (course.enrolledStudents || []).filter(id => id !== studentIdentifier);
    const newCount = Math.max(0, (course.enrolledCount || 1) - 1);

    const updatedCourse: Course = {
      ...course,
      enrolledCount: newCount,
      enrolledStudents: updatedEnrolled
    };

    setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));

    try {
      await updateDoc(doc(db, 'courses', courseId), {
        enrolledCount: newCount,
        enrolledStudents: updatedEnrolled
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const joinCourseByCode = async (code: string, sectionName?: string): Promise<{ success: boolean; message: string; course?: Course }> => {
    if (!code || !code.trim()) {
      return { success: false, message: 'กรุณากรอกรหัสวิชาหรือรหัสคลาส' };
    }
    const clean = code.trim().toUpperCase();
    const matched = courses.find(c => 
      c.code.toUpperCase() === clean || 
      c.id === code.trim() || 
      c.title.toLowerCase().includes(code.trim().toLowerCase())
    );
    
    if (!matched) {
      return { success: false, message: `ไม่พบรายวิชารหัส "${clean}" ในระบบ กรุณาตรวจสอบรหัสวิชาอีกครั้ง` };
    }

    const res = await joinCourse(matched.id, sectionName);
    if (res.success) {
      setActiveCourseId(matched.id);
    }
    return { ...res, course: matched };
  };

  // ==========================================
  // ASSIGNMENTS CRUD
  // ==========================================
  const addAssignment = async (assignData: Omit<Assignment, 'id'>) => {
    const newAssign: Assignment = {
      ...assignData,
      id: 'assign-' + Date.now()
    };
    setAssignments(prev => [newAssign, ...prev]);

    try {
      await setDoc(doc(db, 'assignments', newAssign.id), sanitizeForFirestore(newAssign));
    } catch (e) {
      console.warn('Assignment firestore sync note:', e);
    }
  };

  const updateAssignment = async (assignmentId: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, ...updates } : a));
    try {
      await updateDoc(doc(db, 'assignments', assignmentId), sanitizeForFirestore(updates));
    } catch (e) {
      console.warn('Update assignment sync note:', e);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    try {
      await deleteDoc(doc(db, 'assignments', assignmentId));
    } catch (e) {
      console.warn('Delete assignment sync note:', e);
    }
  };

  const submitAssignment = async (assignmentId: string, data: { fileNames?: string[]; files?: SubmittedFile[]; textEntry?: string; isDraft?: boolean }) => {
    const studentUid = user?.uid || 'guest_student';
    const studentName = user?.name || 'Student';
    const studentAvatar = user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    const studentCode = user?.studentId || studentUid;
    const submittedTimestamp = new Date().toLocaleDateString('th-TH', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const targetAssignment = assignments.find(a => a.id === assignmentId);
    const targetCourseId = targetAssignment?.courseId || 'course-1';
    const studentSec = (targetCourseId && getUserEnrolledSec(targetCourseId)) || 'SEC 1';

    const fileNames = data.fileNames || (data.files ? data.files.map(f => f.name) : ['Submission_Attachment.pdf']);

    // Authoritative backend submit with isolation enforcement
    let backendSubmission: any = null;
    try {
      const res = await secApi.submitAssignment(assignmentId, {
        files: data.files || fileNames.map(name => ({ name, size: '1.2 MB' })),
        fileNames,
        textEntry: data.textEntry,
        isDraft: data.isDraft,
        secId: studentSec,
        courseId: targetCourseId
      } as any, user);
      backendSubmission = res.submission;
    } catch (e) {
      console.warn('secApi.submitAssignment sync note:', e);
    }

    const newSubmissionData: AssignmentSubmission = backendSubmission || {
      id: `sub_${assignmentId}_${studentUid}`,
      assignmentId,
      courseId: targetCourseId,
      secId: studentSec,
      studentId: studentUid,
      studentName,
      studentAvatar,
      studentCode,
      submittedAt: submittedTimestamp,
      updatedAt: submittedTimestamp,
      fileNames,
      files: data.files || fileNames.map(name => ({ name, size: '1.2 MB' })),
      status: data.isDraft ? 'draft' : 'submitted',
      version: 1,
      ...(data.textEntry ? { textEntry: data.textEntry } : {})
    };

    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        const existingSubmissions = a.submissions || {};
        const updated: Assignment = {
          ...a,
          // Only update status and submission for current user if viewing
          status: newSubmissionData.status === 'draft' ? a.status : 'Submitted',
          submission: newSubmissionData,
          submissions: {
            ...existingSubmissions,
            [studentUid]: newSubmissionData
          }
        };
        try {
          setDoc(doc(db, 'assignments', assignmentId), sanitizeForFirestore(updated), { merge: true }).catch(console.warn);
          setDoc(doc(db, 'submissions', `${assignmentId}_${studentUid}`), sanitizeForFirestore(newSubmissionData), { merge: true }).catch(console.warn);
        } catch (e) {
          console.warn(e);
        }
        return updated;
      }
      return a;
    }));
  };

  const gradeAssignmentSubmission = async (
    assignmentId: string, 
    studentId: string, 
    grade: number, 
    feedback: string,
    studentInfo?: { studentName?: string; studentCode?: string; studentAvatar?: string; secId?: string }
  ) => {
    let backendSubmission: any = null;
    try {
      const res = await secApi.gradeSubmission(assignmentId, studentId, grade, feedback, user, studentInfo);
      backendSubmission = res.submission;
    } catch (e) {
      console.warn('secApi.gradeSubmission sync note:', e);
    }

    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        const existingSubs = a.submissions || {};
        let foundSubKey = studentId;
        for (const [k, s] of Object.entries(existingSubs)) {
          const subObj = s as any;
          if (
            k === studentId || 
            subObj?.studentId === studentId || 
            subObj?.studentCode === studentId ||
            (studentInfo?.studentCode && (subObj?.studentCode === studentInfo.studentCode || k === studentInfo.studentCode)) ||
            (studentInfo?.studentName && (subObj?.studentName === studentInfo.studentName || k === studentInfo.studentName))
          ) {
            foundSubKey = k;
            break;
          }
        }
        const currentSub = existingSubs[foundSubKey] || existingSubs[studentId] || (a.submission?.studentId === studentId ? a.submission : undefined);
        const resolvedName = studentInfo?.studentName || currentSub?.studentName || backendSubmission?.studentName || 'Student';
        const resolvedCode = studentInfo?.studentCode || currentSub?.studentCode || backendSubmission?.studentCode || studentId;
        const resolvedSec = studentInfo?.secId || currentSub?.secId || backendSubmission?.secId || 'SEC 1';
        const resolvedAvatar = studentInfo?.studentAvatar || currentSub?.studentAvatar || backendSubmission?.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
        const nowStr = new Date().toLocaleString('th-TH');

        const gradedSub: AssignmentSubmission = {
          ...(currentSub || {}),
          ...(backendSubmission || {}),
          id: currentSub?.id || backendSubmission?.id || `sub_${assignmentId}_${studentId}`,
          assignmentId,
          studentId,
          studentCode: resolvedCode,
          studentName: resolvedName,
          studentAvatar: resolvedAvatar,
          secId: resolvedSec,
          submittedAt: currentSub?.submittedAt || backendSubmission?.submittedAt || nowStr,
          grade,
          feedback,
          status: 'graded',
          gradedBy: user?.name || 'Instructor',
          gradedAt: nowStr
        };

        const updatedSubmissionsMap: Record<string, AssignmentSubmission> = {
          ...existingSubs,
          [studentId]: gradedSub,
          [foundSubKey]: gradedSub
        };
        if (resolvedCode && resolvedCode !== studentId) {
          updatedSubmissionsMap[resolvedCode] = gradedSub;
        }
        if (resolvedName && resolvedName !== studentId) {
          updatedSubmissionsMap[resolvedName] = gradedSub;
        }

        const isViewingStudent = (
          a.submission?.studentId === studentId || 
          a.submission?.studentId === foundSubKey ||
          (resolvedCode && a.submission?.studentCode === resolvedCode)
        );

        const updated: Assignment = {
          ...a,
          // Only modify a.submission if the current user viewing happens to be that student
          submission: isViewingStudent ? gradedSub : a.submission,
          submissions: updatedSubmissionsMap
        };

        try {
          setDoc(doc(db, 'assignments', assignmentId), sanitizeForFirestore(updated), { merge: true }).catch(console.warn);
          setDoc(doc(db, 'submissions', `${assignmentId}_${studentId}`), sanitizeForFirestore(gradedSub), { merge: true }).catch(console.warn);
          if (resolvedCode && resolvedCode !== studentId) {
            setDoc(doc(db, 'submissions', `${assignmentId}_${resolvedCode}`), sanitizeForFirestore(gradedSub), { merge: true }).catch(console.warn);
          }
        } catch (e) {
          console.warn(e);
        }
        return updated;
      }
      return a;
    }));

    return { success: true, submission: backendSubmission };
  };

  // ==========================================
  // SCHEDULE & CHAT
  // ==========================================
  const addScheduleEvent = async (eventData: Omit<ScheduleEvent, 'id'>) => {
    const newEvent: ScheduleEvent = {
      ...eventData,
      id: 'sch-' + Date.now()
    };
    setScheduleEvents(prev => [...prev, newEvent]);

    try {
      await setDoc(doc(db, 'schedule', newEvent.id), sanitizeForFirestore(newEvent));
    } catch (e) {
      console.warn('Schedule firestore sync note:', e);
    }
  };

  const addDiscussionComment = async (text: string) => {
    if (!text.trim()) return;
    const newDoc: DiscussionComment = {
      id: 'disc-' + Date.now(),
      senderId: user?.uid || 'guest',
      senderName: user?.name || 'Student',
      senderAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isInstructor: user?.role === 'instructor',
      date: 'Today',
      text
    };
    setDiscussionComments(prev => [...prev, newDoc]);
  };

  const sendMessage = async (text: string, fileAttachment?: { name: string; size: string }) => {
    if (!text.trim() && !fileAttachment) return;
    if (!currentChatId) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: user?.uid || 'guest',
      senderName: user?.name ? user.name.split(' ')[0] : 'Me',
      senderAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text,
      timestamp: timeStr,
      isSelf: true,
      ...(fileAttachment ? { fileAttachment } : {})
    };

    setCurrentMessages(prev => [...prev, newMsg]);

    setChatThreads(prev => prev.map(t => {
      if (t.id === currentChatId) {
        return {
          ...t,
          lastMessage: `${user?.name ? user.name.split(' ')[0] : 'You'}: ${text || fileAttachment?.name}`,
          lastMessageTime: 'Now',
          unread: false
        };
      }
      return t;
    }));

    try {
      await addDoc(collection(db, `chats_${currentChatId}`), sanitizeForFirestore({
        ...newMsg,
        timestampRaw: Date.now()
      }));
    } catch (e) {
      console.warn('Chat firestore sync note:', e);
    }
  };

  const createChatThread = async (name: string, isGroup: boolean = false) => {
    const newThread: ChatThread = {
      id: 'thread-' + Date.now(),
      name,
      avatar: isGroup 
        ? 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&auto=format&fit=crop&q=80'
        : (user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
      isGroup,
      membersCount: isGroup ? 1 : 2,
      activeNow: true,
      lastMessage: 'Conversation created',
      lastMessageTime: 'Just now',
      unread: false,
      members: user ? [{ id: user.uid, name: user.name, avatar: user.avatar, online: true }] : []
    };
    setChatThreads(prev => [newThread, ...prev]);
    setCurrentChatId(newThread.id);

    try {
      await setDoc(doc(db, 'threads', newThread.id), sanitizeForFirestore(newThread));
    } catch (e) {
      console.warn('Thread firestore sync note:', e);
    }
  };

  const joinStudyGroup = async (groupName: string) => {
    await createChatThread(groupName, true);
  };

  const unreadMessagesCount = chatThreads.filter(t => t.unread).length;

  return (
    <DataContext.Provider value={{
      posts,
      courses,
      assignments,
      scheduleEvents,
      chatThreads,
      currentChatId,
      currentMessages,
      discussionComments,
      activeCourseId,
      activeAssignmentId,
      allUsers,
      allInstructors,
      classAnnouncements,
      addClassAnnouncement,
      deleteClassAnnouncement,
      getUserEnrolledSec,
      addPost,
      editPost,
      deletePost,
      toggleLikePost,
      addCommentToPost,
      addCourse,
      updateCourse,
      deleteCourse,
      addCoInstructor,
      removeCoInstructor,
      removeStudentFromCourse,
      cancelCourseSession,
      restoreCourseSession,
      setCourseSection,
      joinCourse,
      leaveCourse,
      joinCourseByCode,
      addAssignment,
      updateAssignment,
      deleteAssignment,
      addScheduleEvent,
      submitAssignment,
      gradeAssignmentSubmission,
      addDiscussionComment,
      sendMessage,
      createChatThread,
      setCurrentChatId,
      setActiveCourseId,
      setActiveAssignmentId,
      joinStudyGroup,
      unreadMessagesCount
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
