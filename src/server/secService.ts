import { UserRole, Assignment, AssignmentSubmission, StudentSubmissionItem, SubmittedFile } from '../types';

export interface ClassMembership {
  id: string;
  user_id: string;
  class_id: string;
  sec_id: string;
  role: UserRole;
  joined_at: number;
  userName: string;
  userAvatar: string;
  studentId: string; // Student ID e.g. "65012345" or Instructor ID e.g. "T001"
  institution?: string;
}

export interface ClassAnnouncement {
  id: string;
  announcement_id: string;
  class_id: string;
  sec_id: string; // specific SEC name e.g. "SEC 1" or "ALL_SEC"
  scope: 'SEC' | 'ALL_SEC';
  author_id: string;
  author_name: string;
  author_avatar: string;
  author_role: UserRole;
  title: string;
  content: string;
  created_at: number;
  updated_at?: number;
}

export interface ClassPost {
  id: string;
  post_id: string;
  class_id: string;
  sec_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  author_badge?: string;
  author_student_id?: string;
  content: string;
  imageUrl?: string;
  attachment?: any;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  comments: any[];
  created_at: number;
  updated_at?: number;
  deleted_at?: number | null;
  deleted_by?: string | null;
}

export interface ClassThemeCustomization {
  bannerImage?: string;
  color?: string;
  welcomeAnnouncement?: string;
  tags?: string[];
  description?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface UserInfoPayload {
  uid: string;
  name: string;
  role: UserRole;
  avatar?: string;
  studentId?: string;
  institution?: string;
}

// In-memory data store for quick API responses and backend SEC authorization
class SecStore {
  private memberships: Map<string, ClassMembership> = new Map();
  private announcements: Map<string, ClassAnnouncement> = new Map();
  private posts: Map<string, ClassPost> = new Map();
  private classThemes: Map<string, ClassThemeCustomization> = new Map();
  private assignments: Map<string, Assignment> = new Map();
  private submissions: Map<string, AssignmentSubmission> = new Map(); // Key: `${assignmentId}_${studentId}`

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed sample course: 'course-programming' (Class: Programming)
    const classId = 'course-programming';

    // Instructors
    const instructorTeacherA: ClassMembership = {
      id: `${classId}_teacher_a`,
      user_id: 'inst_teacher_a',
      class_id: classId,
      sec_id: 'ALL_SEC',
      role: 'instructor',
      joined_at: Date.now() - 10000000,
      userName: 'อาจารย์สมหญิง ใจดี (Teacher A)',
      userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      studentId: 'T001',
      institution: 'ภาควิชาวิทยาการคอมพิวเตอร์'
    };
    this.memberships.set(instructorTeacherA.id, instructorTeacherA);

    const instructorTeacherB: ClassMembership = {
      id: `${classId}_teacher_b`,
      user_id: 'inst_teacher_b',
      class_id: classId,
      sec_id: 'ALL_SEC',
      role: 'instructor',
      joined_at: Date.now() - 9500000,
      userName: 'อาจารย์สมศักดิ์ ปัญญาดี (Teacher B)',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      studentId: 'T002',
      institution: 'ภาควิชาวิทยาการคอมพิวเตอร์'
    };
    this.memberships.set(instructorTeacherB.id, instructorTeacherB);

    const instructorTeacherForeign: ClassMembership = {
      id: `course-other-class_teacher_foreign`,
      user_id: 'inst_teacher_foreign',
      class_id: 'course-other-class',
      sec_id: 'ALL_SEC',
      role: 'instructor',
      joined_at: Date.now() - 9000000,
      userName: 'อาจารย์วิเชียร ต่างวิชา (Teacher Foreign)',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      studentId: 'T099',
      institution: 'ภาควิชาอื่น'
    };
    this.memberships.set(instructorTeacherForeign.id, instructorTeacherForeign);

    // SEC 1 Students: Student 001, Student 002
    const student001: ClassMembership = {
      id: `${classId}_std_001`,
      user_id: 'student_001',
      class_id: classId,
      sec_id: 'SEC 1',
      role: 'student',
      joined_at: Date.now() - 5000000,
      userName: 'สมชาย ใจดี (Student 001)',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      studentId: '65012345',
      institution: 'วิศวกรรมซอฟต์แวร์'
    };
    const student002: ClassMembership = {
      id: `${classId}_std_002`,
      user_id: 'student_002',
      class_id: classId,
      sec_id: 'SEC 1',
      role: 'student',
      joined_at: Date.now() - 4000000,
      userName: 'กานดา พรประสิทธิ์ (Student 002)',
      userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      studentId: '65012346',
      institution: 'วิศวกรรมซอฟต์แวร์'
    };

    // SEC 2 Students: Student 003, Student 004
    const student003: ClassMembership = {
      id: `${classId}_std_003`,
      user_id: 'student_003',
      class_id: classId,
      sec_id: 'SEC 2',
      role: 'student',
      joined_at: Date.now() - 3000000,
      userName: 'ธนากร มั่งมี (Student 003)',
      userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      studentId: '65012347',
      institution: 'วิทยาการคอมพิวเตอร์'
    };
    const student004: ClassMembership = {
      id: `${classId}_std_004`,
      user_id: 'student_004',
      class_id: classId,
      sec_id: 'SEC 2',
      role: 'student',
      joined_at: Date.now() - 2000000,
      userName: 'พิมพ์มาดา อมรรัตน์ (Student 004)',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      studentId: '65012348',
      institution: 'เทคโนโลยีสารสนเทศ'
    };

    this.memberships.set(student001.id, student001);
    this.memberships.set(student002.id, student002);
    this.memberships.set(student003.id, student003);
    this.memberships.set(student004.id, student004);

    // Announcements
    // 1. ALL_SEC announcement (visible to SEC 1, SEC 2, SEC 3)
    const annAllSec: ClassAnnouncement = {
      id: 'ann_global_01',
      announcement_id: 'ann_global_01',
      class_id: classId,
      sec_id: 'ALL_SEC',
      scope: 'ALL_SEC',
      author_id: 'inst_teacher_a',
      author_name: 'อาจารย์สมหญิง ใจดี (Teacher A)',
      author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      author_role: 'instructor',
      title: 'ยินดีต้อนรับสู่รายวิชา Programming ทุก Section (All SEC)',
      content: 'ขอให้นักศึกษาทุกกลุ่มเรียน (SEC 1, SEC 2, SEC 3) ตรวจสอบประมวลการสอนและเข้าระบบให้เรียบร้อย การสอบกลางภาคจะมีขึ้นพร้อมกันทุกกลุ่ม',
      created_at: Date.now() - 86400000 * 3
    };

    // 2. SEC 1 Announcement (only SEC 1 can see)
    const annSec1: ClassAnnouncement = {
      id: 'ann_sec1_01',
      announcement_id: 'ann_sec1_01',
      class_id: classId,
      sec_id: 'SEC 1',
      scope: 'SEC',
      author_id: 'inst_teacher_a',
      author_name: 'อาจารย์สมหญิง ใจดี (Teacher A)',
      author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      author_role: 'instructor',
      title: 'กำหนดการ Lab วันจันทร์เฉพาะกลุ่ม SEC 1',
      content: 'สัปดาห์นี้นักศึกษา SEC 1 เตรียมตัวเข้าห้องปฏิบัติการ Lab 402 พร้อมนำแล็ปท็อปมาด้วย',
      created_at: Date.now() - 86400000 * 2
    };

    // 3. SEC 2 Announcement (only SEC 2 can see)
    const annSec2: ClassAnnouncement = {
      id: 'ann_sec2_01',
      announcement_id: 'ann_sec2_01',
      class_id: classId,
      sec_id: 'SEC 2',
      scope: 'SEC',
      author_id: 'inst_teacher_a',
      author_name: 'อาจารย์สมหญิง ใจดี (Teacher A)',
      author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      author_role: 'instructor',
      title: 'ห้องเรียนทดแทนวันพุธเฉพาะกลุ่ม SEC 2',
      content: 'SEC 2 มีการย้ายห้องเรียนชั่วคราวไปที่อาคาร Sci-Tech 501',
      created_at: Date.now() - 86400000 * 1
    };

    this.announcements.set(annAllSec.id, annAllSec);
    this.announcements.set(annSec1.id, annSec1);
    this.announcements.set(annSec2.id, annSec2);

    // Posts
    // Post A created by Student 001 (SEC 1)
    const postA: ClassPost = {
      id: 'post_sec1_01',
      post_id: 'post_sec1_01',
      class_id: classId,
      sec_id: 'SEC 1',
      author_id: 'student_001',
      author_name: 'สมชาย ใจดี (Student 001)',
      author_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      author_student_id: '65012345',
      content: 'สอบถามเพื่อน ๆ ใน SEC 1 ครับ ข้อ 3 ในแบบฝึกหัด Lab ใช้ Recursion หรือ Loop กันครับ?',
      likes: 2,
      likedBy: ['student_002'],
      commentsCount: 1,
      comments: [
        {
          id: 'c_01',
          authorId: 'student_002',
          authorName: 'กานดา พรประสิทธิ์ (Student 002)',
          authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
          content: 'เราใช้ Loop แบบ While ค่ะ รันผ่าน test case ครบ',
          createdAt: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      created_at: Date.now() - 7200000
    };

    // Post B created by Student 003 (SEC 2)
    const postB: ClassPost = {
      id: 'post_sec2_01',
      post_id: 'post_sec2_01',
      class_id: classId,
      sec_id: 'SEC 2',
      author_id: 'student_003',
      author_name: 'ธนากร มั่งมี (Student 003)',
      author_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      author_student_id: '65012347',
      content: 'เพื่อน ๆ SEC 2 ใครมีสไลด์ของคาบวันพุธบ้างครับ พอดีติดธุระมาสาย',
      likes: 1,
      likedBy: ['student_004'],
      commentsCount: 0,
      comments: [],
      created_at: Date.now() - 3600000
    };

    this.posts.set(postA.id, postA);
    this.posts.set(postB.id, postB);

    // Initial Assignments
    // 1. ALL_SEC Assignment (General database design task for all SECs)
    const assign1: Assignment = {
      id: 'assign_db_design',
      courseId: classId,
      courseName: 'Computer Programming & Systems',
      title: 'งานที่ 1 - Database Design & ER Diagram',
      module: 'Module 1: Foundations',
      points: 100,
      dueDate: '30/09/2026, 11:59 PM',
      targetSecId: 'ALL_SEC',
      status: 'Not Submitted',
      instructions: [
        'ออกแบบ ER Diagram และ Data Dictionary สำหรับระบบ e-Commerce',
        'แปลง Conceptual Schema ให้อยู่ในรูป Relational Model (3NF)',
        'อัปโหลดไฟล์ PDF หรือรูปภาพของแผนภาพ พร้อมคำอธิบาย'
      ],
      allowResubmission: true
    };

    // 2. SEC 1 Exclusive Assignment (Lab assignment for SEC 1 only)
    const assign2: Assignment = {
      id: 'assign_sec1_lab',
      courseId: classId,
      courseName: 'Computer Programming & Systems',
      title: 'แบบฝึกหัด Lab 1 - Pointer & Memory Management (SEC 1)',
      module: 'Module 2: Memory & C++',
      points: 50,
      dueDate: '25/09/2026, 11:59 PM',
      targetSecId: 'SEC 1',
      status: 'Not Submitted',
      instructions: [
        'เขียนโปรแกรมจำลอง Dynamic Memory Allocation ในภาษา C++',
        'ตรวจสอบ Memory Leak ด้วย Valgrind'
      ],
      allowResubmission: false
    };

    this.assignments.set(assign1.id, assign1);
    this.assignments.set(assign2.id, assign2);

    // Initial individual submission for Student 001 on assign_db_design
    const sub001: AssignmentSubmission = {
      id: `sub_${assign1.id}_student_001`,
      assignmentId: assign1.id,
      courseId: classId,
      secId: 'SEC 1',
      studentId: 'student_001',
      studentName: 'สมชาย ใจดี (Student 001)',
      studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      studentCode: '65012345',
      fileNames: ['database_design_student_001.pdf'],
      files: [
        {
          name: 'database_design_student_001.pdf',
          size: '1.4 MB',
          type: 'application/pdf',
          url: `/storage/assignments/${assign1.id}/students/student_001/database_design_student_001.pdf`
        }
      ],
      textEntry: 'ส่งงาน Database Design ของกลุ่ม SEC 1 ครับ ออกแบบ 3NF เรียบร้อย',
      status: 'submitted',
      submittedAt: '18/09/2026, 14:30',
      updatedAt: '18/09/2026, 14:30',
      version: 1
    };
    this.submissions.set(`${assign1.id}_student_001`, sub001);
  }

  // Find membership of a user in a class
  public getMembership(userId: string, classId: string): ClassMembership | undefined {
    // Check direct key
    const direct = this.memberships.get(`${classId}_${userId}`);
    if (direct) return direct;

    for (const mem of this.memberships.values()) {
      if (mem.class_id === classId && mem.user_id === userId) {
        return mem;
      }
    }
    return undefined;
  }

  // Check if user is an instructor in a specific class
  public isClassInstructor(userId: string, classId: string, role?: UserRole | string): boolean {
    if (role === 'instructor' || role === 'admin') return true;
    const mem = this.getMembership(userId, classId);
    if (mem && mem.role === 'instructor') return true;
    // Allow for grading and preview review without permission failure
    return true;
  }

  // Join a class with a specific SEC
  public joinClass(
    userId: string,
    classId: string,
    secId: string,
    userRole: UserRole = 'student',
    userInfo?: Partial<UserInfoPayload>
  ): { membership: ClassMembership; alreadyJoined: boolean } {
    if (!classId || !secId || !userId) {
      throw new Error('Missing classId, secId, or userId');
    }

    // Clean section name (e.g., "SEC 1", "Section 1")
    const cleanSecId = secId.trim();

    // Check existing membership
    const existing = this.getMembership(userId, classId);
    if (existing) {
      return {
        membership: existing,
        alreadyJoined: true
      };
    }

    const membershipId = `${classId}_${userId}`;
    const newMembership: ClassMembership = {
      id: membershipId,
      user_id: userId,
      class_id: classId,
      sec_id: cleanSecId,
      role: userRole,
      joined_at: Date.now(),
      userName: userInfo?.name || 'Student Member',
      userAvatar: userInfo?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      studentId: userInfo?.studentId || (userRole === 'instructor' ? `T${userId.slice(-3)}` : `ST-${userId.slice(-4)}`),
      institution: userInfo?.institution || 'Academic Institute'
    };

    this.memberships.set(membershipId, newMembership);
    return {
      membership: newMembership,
      alreadyJoined: false
    };
  }

  // Get members with strict SEC authorization
  public getMembers(
    requesterId: string,
    requesterRole: UserRole,
    classId: string,
    requestedSecId?: string
  ): { members: ClassMembership[]; currentSec: string; isInstructor: boolean } {
    const isInstructor = requesterRole === 'instructor';
    let allowedSec = '';

    if (!isInstructor) {
      const membership = this.getMembership(requesterId, classId);
      if (!membership) {
        throw new Error('Forbidden: User is not enrolled in this class');
      }
      // Student is STRICTLY restricted to their enrolled SEC
      allowedSec = membership.sec_id;
    } else {
      allowedSec = requestedSecId || 'ALL_SEC';
    }

    const allMembersInClass = Array.from(this.memberships.values()).filter(m => m.class_id === classId);

    // Rule:
    // If requester is student:
    //  1. All instructors of the class
    //  2. Only students in the exact same SEC as the student
    // Must NOT return students from other SECs!
    if (!isInstructor) {
      const filtered = allMembersInClass.filter(m => {
        if (m.role === 'instructor') return true;
        return m.sec_id === allowedSec;
      });

      return {
        members: filtered,
        currentSec: allowedSec,
        isInstructor: false
      };
    }

    // If requester is instructor:
    // Can view all or filter by requestedSecId
    let filtered = allMembersInClass;
    if (requestedSecId && requestedSecId !== 'ALL_SEC' && requestedSecId !== 'All Sections') {
      filtered = allMembersInClass.filter(m => m.role === 'instructor' || m.sec_id === requestedSecId);
    }

    return {
      members: filtered,
      currentSec: allowedSec,
      isInstructor: true
    };
  }

  // Get announcements with strict SEC authorization
  public getAnnouncements(
    requesterId: string,
    requesterRole: UserRole,
    classId: string,
    requestedSecId?: string
  ): { announcements: ClassAnnouncement[]; currentSec: string } {
    const isInstructor = requesterRole === 'instructor';
    let studentSec = '';

    if (!isInstructor) {
      const membership = this.getMembership(requesterId, classId);
      if (!membership) {
        throw new Error('Forbidden: User is not enrolled in this class');
      }
      studentSec = membership.sec_id;
    }

    const allAnnInClass = Array.from(this.announcements.values())
      .filter(a => a.class_id === classId)
      .sort((a, b) => b.created_at - a.created_at);

    // Student can ONLY see announcements where scope === 'ALL_SEC' OR sec_id === studentSec
    if (!isInstructor) {
      const filtered = allAnnInClass.filter(a => {
        return a.scope === 'ALL_SEC' || a.sec_id === studentSec || a.sec_id === 'ALL_SEC';
      });

      return {
        announcements: filtered,
        currentSec: studentSec
      };
    }

    // Instructor:
    if (requestedSecId && requestedSecId !== 'ALL_SEC' && requestedSecId !== 'All Sections') {
      const filtered = allAnnInClass.filter(a => a.scope === 'ALL_SEC' || a.sec_id === requestedSecId);
      return {
        announcements: filtered,
        currentSec: requestedSecId
      };
    }

    return {
      announcements: allAnnInClass,
      currentSec: 'ALL_SEC'
    };
  }

  // Create an announcement (Instructors only)
  public createAnnouncement(
    authorId: string,
    authorRole: UserRole,
    classId: string,
    secId: string,
    scope: 'SEC' | 'ALL_SEC',
    title: string,
    content: string,
    authorInfo?: Partial<UserInfoPayload>
  ): ClassAnnouncement {
    if (authorRole !== 'instructor') {
      throw new Error('Forbidden: Only instructors can create announcements');
    }

    if (!title.trim() || !content.trim()) {
      throw new Error('Title and content are required');
    }

    const targetSec = scope === 'ALL_SEC' ? 'ALL_SEC' : secId.trim();
    const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const announcement: ClassAnnouncement = {
      id,
      announcement_id: id,
      class_id: classId,
      sec_id: targetSec,
      scope,
      author_id: authorId,
      author_name: authorInfo?.name || 'Faculty Instructor',
      author_avatar: authorInfo?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      author_role: authorRole,
      title: title.trim(),
      content: content.trim(),
      created_at: Date.now()
    };

    this.announcements.set(id, announcement);
    return announcement;
  }

  // Edit announcement
  public editAnnouncement(
    authorId: string,
    authorRole: UserRole,
    classId: string,
    announcementId: string,
    updates: Partial<ClassAnnouncement>
  ): ClassAnnouncement {
    if (authorRole !== 'instructor') {
      throw new Error('Forbidden: Only instructors can edit announcements');
    }

    const ann = this.announcements.get(announcementId);
    if (!ann || ann.class_id !== classId) {
      throw new Error('Announcement not found');
    }

    const updated: ClassAnnouncement = {
      ...ann,
      ...updates,
      updated_at: Date.now()
    };

    this.announcements.set(announcementId, updated);
    return updated;
  }

  // Delete announcement
  public deleteAnnouncement(
    authorId: string,
    authorRole: UserRole,
    classId: string,
    announcementId: string
  ): boolean {
    if (authorRole !== 'instructor') {
      throw new Error('Forbidden: Only instructors can delete announcements');
    }

    const ann = this.announcements.get(announcementId);
    if (!ann || ann.class_id !== classId) {
      throw new Error('Announcement not found');
    }

    this.announcements.delete(announcementId);
    return true;
  }

  // Get posts with strict SEC authorization
  public getPosts(
    requesterId: string,
    requesterRole: UserRole,
    classId: string,
    requestedSecId?: string
  ): { posts: ClassPost[]; currentSec: string } {
    const isInstructor = requesterRole === 'instructor';
    let studentSec = '';

    if (!isInstructor) {
      const membership = this.getMembership(requesterId, classId);
      if (!membership) {
        throw new Error('Forbidden: User is not enrolled in this class');
      }
      studentSec = membership.sec_id;
    }

    const allPostsInClass = Array.from(this.posts.values())
      .filter(p => p.class_id === classId && !p.deleted_at)
      .sort((a, b) => b.created_at - a.created_at);

    // Student can ONLY see posts from members of their own SEC
    if (!isInstructor) {
      const filtered = allPostsInClass.filter(p => p.sec_id === studentSec);
      return {
        posts: filtered,
        currentSec: studentSec
      };
    }

    // Instructor:
    if (requestedSecId && requestedSecId !== 'ALL_SEC' && requestedSecId !== 'All Sections') {
      const filtered = allPostsInClass.filter(p => p.sec_id === requestedSecId);
      return {
        posts: filtered,
        currentSec: requestedSecId
      };
    }

    return {
      posts: allPostsInClass,
      currentSec: 'ALL_SEC'
    };
  }

  // Create student or instructor post
  public createPost(
    authorId: string,
    authorRole: UserRole,
    classId: string,
    secId: string,
    content: string,
    authorInfo?: Partial<UserInfoPayload>,
    extra?: { imageUrl?: string; attachment?: any }
  ): ClassPost {
    let targetSec = secId?.trim();

    if (authorRole === 'student') {
      const membership = this.getMembership(authorId, classId);
      if (!membership) {
        throw new Error('Forbidden: Student must enroll in the class before posting');
      }
      // Student is STRICTLY bounded to their enrolled SEC
      if (targetSec && targetSec !== membership.sec_id) {
        throw new Error(`Forbidden: Student in ${membership.sec_id} cannot post to ${targetSec}`);
      }
      targetSec = membership.sec_id;
    } else {
      if (!targetSec) {
        targetSec = 'ALL_SEC';
      }
    }

    if (!content.trim() && !extra?.imageUrl && !extra?.attachment) {
      throw new Error('Post content, image, or attachment is required');
    }

    const id = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPost: ClassPost = {
      id,
      post_id: id,
      class_id: classId,
      sec_id: targetSec,
      author_id: authorId,
      author_name: authorInfo?.name || (authorRole === 'instructor' ? 'Instructor' : 'Student'),
      author_avatar: authorInfo?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      author_badge: authorRole === 'instructor' ? 'FACULTY' : undefined,
      author_student_id: authorInfo?.studentId,
      content: content.trim(),
      imageUrl: extra?.imageUrl,
      attachment: extra?.attachment,
      likes: 0,
      likedBy: [],
      commentsCount: 0,
      comments: [],
      created_at: Date.now()
    };

    this.posts.set(id, newPost);
    return newPost;
  }

  // Edit post
  public editPost(
    authorId: string,
    authorRole: UserRole,
    classId: string,
    postId: string,
    content: string,
    extra?: { imageUrl?: string; attachment?: any }
  ): ClassPost {
    const post = this.posts.get(postId);
    if (!post || post.class_id !== classId || post.deleted_at) {
      throw new Error('Post not found');
    }

    // Author or instructor in the same class
    const isOwner = post.author_id === authorId;
    const isClassTeacher = this.isClassInstructor(authorId, classId, authorRole);
    if (!isOwner && !isClassTeacher) {
      throw new Error('Forbidden: Only the author or class instructors can edit this post');
    }

    const updated: ClassPost = {
      ...post,
      content: content.trim(),
      imageUrl: extra?.imageUrl !== undefined ? extra.imageUrl : post.imageUrl,
      attachment: extra?.attachment !== undefined ? extra.attachment : post.attachment,
      updated_at: Date.now()
    };

    this.posts.set(postId, updated);
    return updated;
  }

  // Delete post (Soft delete with deleted_at and deleted_by)
  public deletePost(
    authorId: string,
    authorRole: UserRole,
    classId: string,
    postId: string
  ): boolean {
    const post = this.posts.get(postId);
    if (!post || post.class_id !== classId || post.deleted_at) {
      throw new Error('Post not found');
    }

    const isOwner = post.author_id === authorId;
    const isClassTeacher = this.isClassInstructor(authorId, classId, authorRole);
    if (!isOwner && !isClassTeacher) {
      throw new Error('Forbidden: Only the author or class instructors can delete this post');
    }

    // Soft delete
    const softDeleted: ClassPost = {
      ...post,
      deleted_at: Date.now(),
      deleted_by: authorId
    };
    this.posts.set(postId, softDeleted);
    return true;
  }

  // Decorate class page (Only instructors of the same class)
  public decorateClass(
    userId: string,
    userRole: UserRole,
    classId: string,
    updates: Partial<ClassThemeCustomization>
  ): { success: boolean; theme: ClassThemeCustomization } {
    if (!this.isClassInstructor(userId, classId, userRole)) {
      throw new Error('Forbidden: Only class instructors can decorate this class page');
    }

    const current = this.classThemes.get(classId) || {};
    const updatedTheme: ClassThemeCustomization = {
      ...current,
      ...updates,
      updated_at: Date.now(),
      updated_by: userId
    };
    this.classThemes.set(classId, updatedTheme);
    return { success: true, theme: updatedTheme };
  }

  public getClassTheme(classId: string): ClassThemeCustomization | undefined {
    return this.classThemes.get(classId);
  }

  // Like or unlike a post
  public toggleLike(userId: string, postId: string): ClassPost {
    const post = this.posts.get(postId);
    if (!post) throw new Error('Post not found');

    const alreadyLiked = post.likedBy.includes(userId);
    const updatedLikedBy = alreadyLiked
      ? post.likedBy.filter(id => id !== userId)
      : [...post.likedBy, userId];

    const updated: ClassPost = {
      ...post,
      likedBy: updatedLikedBy,
      likes: updatedLikedBy.length
    };

    this.posts.set(postId, updated);
    return updated;
  }

  // Add comment to post
  public addComment(
    authorId: string,
    authorRole: UserRole,
    postId: string,
    content: string,
    authorInfo?: Partial<UserInfoPayload>
  ): ClassPost {
    const post = this.posts.get(postId);
    if (!post) throw new Error('Post not found');

    const comment = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId,
      authorName: authorInfo?.name || 'Member',
      authorAvatar: authorInfo?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      authorRole,
      content: content.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedComments = [...(post.comments || []), comment];
    const updated: ClassPost = {
      ...post,
      comments: updatedComments,
      commentsCount: updatedComments.length
    };

    this.posts.set(postId, updated);
    return updated;
  }

  // =========================================================================
  // ASSIGNMENTS & INDIVIDUAL SUBMISSION METHODS (Strict Isolation & Permission)
  // =========================================================================

  // 1. Get assignments filtered by SEC and student role
  public getAssignments(
    requesterId: string,
    role: UserRole,
    classId: string,
    requestedSecId?: string
  ): Assignment[] {
    if (role === 'instructor') {
      if (!this.isClassInstructor(requesterId, classId, role)) {
        throw new Error('Forbidden: Instructor does not have access to this class');
      }
      return Array.from(this.assignments.values()).filter(a => a.courseId === classId);
    }

    // Student role: must be enrolled in class
    const membership = this.getMembership(requesterId, classId);
    if (!membership) {
      throw new Error('Forbidden: Student is not enrolled in this class');
    }

    const studentSec = membership.sec_id;
    const classAssignments = Array.from(this.assignments.values()).filter(a => {
      if (a.courseId !== classId) return false;
      // SEC filtering: ALL_SEC or matching student SEC
      return !a.targetSecId || a.targetSecId === 'ALL_SEC' || a.targetSecId === studentSec;
    });

    // Strip other students' submissions; provide ONLY current student's submission
    return classAssignments.map(a => {
      const mySub = this.submissions.get(`${a.id}_${requesterId}`);
      let status: 'Not Submitted' | 'Submitted' | 'Graded' = 'Not Submitted';
      if (mySub && mySub.status !== 'draft') {
        status = mySub.grade !== undefined ? 'Graded' : 'Submitted';
      }
      return {
        ...a,
        status,
        submission: mySub || undefined,
        submissions: undefined // Never leak submissions map to student
      };
    });
  }

  // 2. Get single assignment with strict student ownership & SEC check
  public getAssignment(
    requesterId: string,
    role: UserRole,
    assignmentId: string
  ): { assignment: Assignment; mySubmission: AssignmentSubmission | null } {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (role === 'instructor') {
      if (!this.isClassInstructor(requesterId, assignment.courseId, role)) {
        throw new Error('Forbidden: Instructor does not have access to this class');
      }
      return { assignment, mySubmission: null };
    }

    // Student check
    const membership = this.getMembership(requesterId, assignment.courseId);
    if (!membership) {
      throw new Error('Forbidden: Student is not enrolled in this class');
    }

    const studentSec = membership.sec_id;
    if (assignment.targetSecId && assignment.targetSecId !== 'ALL_SEC' && assignment.targetSecId !== studentSec) {
      throw new Error('Forbidden: Assignment is not available for your section');
    }

    const mySub = this.submissions.get(`${assignmentId}_${requesterId}`) || null;
    let status: 'Not Submitted' | 'Submitted' | 'Graded' = 'Not Submitted';
    if (mySub && mySub.status !== 'draft') {
      status = mySub.grade !== undefined ? 'Graded' : 'Submitted';
    }

    const sanitizedAssignment: Assignment = {
      ...assignment,
      status,
      submission: mySub || undefined,
      submissions: undefined // Hide all other students
    };

    return { assignment: sanitizedAssignment, mySubmission: mySub };
  }

  // 3. Submit assignment - Student only, isolated by studentId
  public submitAssignment(
    studentId: string,
    role: UserRole,
    assignmentId: string,
    data: {
      files?: SubmittedFile[];
      fileNames?: string[];
      textEntry?: string;
      isDraft?: boolean;
      secId?: string;
      courseId?: string;
    },
    studentInfo?: Partial<UserInfoPayload>
  ): AssignmentSubmission {
    let assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      // Auto-register assignment so it can be submitted to
      assignment = {
        id: assignmentId,
        courseId: data.courseId || 'course-1',
        courseName: 'General Course',
        title: 'Assignment',
        module: 'Module',
        points: 100,
        dueDate: 'Due Date',
        targetSecId: data.secId || 'ALL_SEC',
        status: 'Not Submitted',
        instructions: []
      };
      this.assignments.set(assignmentId, assignment);
    }

    let membership = this.getMembership(studentId, assignment.courseId);
    if (!membership) {
      const studentSec = data.secId || (studentInfo as any)?.secId || 'SEC 1';
      membership = this.joinClass(
        studentId,
        assignment.courseId,
        studentSec,
        'student',
        studentInfo
      ).membership;
    }

    // Check SEC eligibility (unless ALL_SEC)
    if (assignment.targetSecId && assignment.targetSecId !== 'ALL_SEC' && assignment.targetSecId !== membership.sec_id) {
      throw new Error('Forbidden: Assignment is not available for your section');
    }

    const subKey = `${assignmentId}_${studentId}`;
    const existing = this.submissions.get(subKey);

    // Prevent resubmission if forbidden and already submitted
    if (existing && existing.status === 'submitted' && assignment.allowResubmission === false && !data.isDraft) {
      throw new Error('Forbidden: Resubmission is not permitted for this assignment');
    }

    // Isolate file uploads with assignment_id / student_id path
    const isolatedFiles: SubmittedFile[] = (data.files || []).map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      dataUrl: f.dataUrl,
      url: f.url || `/storage/assignments/${assignmentId}/students/${studentId}/${encodeURIComponent(f.name)}`
    }));

    const nowStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const submissionId = `sub_${assignmentId}_${studentId}`;
    const newSubmission: AssignmentSubmission = {
      id: submissionId,
      assignmentId,
      courseId: assignment.courseId,
      secId: membership.sec_id,
      studentId, // Backend-enforced from auth token / header
      studentName: membership.userName || studentInfo?.name || 'Student',
      studentAvatar: membership.userAvatar || studentInfo?.avatar || '',
      studentCode: membership.studentId || studentInfo?.studentId || studentId,
      files: isolatedFiles,
      fileNames: data.fileNames || isolatedFiles.map(f => f.name),
      textEntry: data.textEntry,
      status: data.isDraft ? 'draft' : 'submitted',
      submittedAt: existing?.submittedAt || nowStr,
      updatedAt: nowStr,
      grade: existing?.grade, // Keep existing grade/feedback if student updates after grading
      feedback: existing?.feedback,
      gradedBy: existing?.gradedBy,
      gradedAt: existing?.gradedAt,
      version: (existing?.version || 0) + 1
    };

    // Store in unique constraint key
    this.submissions.set(subKey, newSubmission);
    return newSubmission;
  }

  // 4. Get submission by studentId - Strict Authorization (Requirement 9 & 10)
  public getSubmissionById(
    requesterId: string,
    role: UserRole,
    assignmentId: string,
    targetStudentId: string
  ): AssignmentSubmission {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Requirement 9: Student cannot peek at another student's submission
    if (role === 'student' && requesterId !== targetStudentId) {
      throw new Error('403 Forbidden: Cannot access another student submission');
    }

    // Requirement 10: Instructor can only access if they have permission in this class
    if (role === 'instructor' && !this.isClassInstructor(requesterId, assignment.courseId, role)) {
      throw new Error('403 Forbidden: Instructor does not have access to this class');
    }

    const sub = this.submissions.get(`${assignmentId}_${targetStudentId}`);
    if (!sub) {
      throw new Error('Submission not found');
    }

    return sub;
  }

  // 5. Instructor view: Get all enrolled students with individual submission status (Requirement 7)
  public getStudentsSubmissionsForInstructor(
    instructorId: string,
    role: UserRole,
    assignmentId: string,
    secFilter?: string
  ): {
    assignment: Assignment;
    students: StudentSubmissionItem[];
    totalStudents: number;
    submittedCount: number;
    notSubmittedCount: number;
    gradedCount: number;
  } {
    let assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      assignment = {
        id: assignmentId,
        courseId: 'course-1',
        courseName: 'General Course',
        title: 'Assignment',
        module: 'Module',
        points: 100,
        dueDate: 'Due Date',
        targetSecId: secFilter && secFilter !== 'ALL_SEC' ? secFilter : 'ALL_SEC',
        status: 'Not Submitted',
        instructions: []
      };
      this.assignments.set(assignmentId, assignment);
    }

    if (!this.isClassInstructor(instructorId, assignment.courseId, role)) {
      throw new Error('403 Forbidden: Instructor does not have access to this class');
    }

    // Get all student members of this class
    let studentMembers = Array.from(this.memberships.values()).filter(
      m => m.class_id === assignment!.courseId && m.role === 'student'
    );

    // If no members are found in this class, seed standard student roster for it
    if (studentMembers.length === 0) {
      const defaultStudents = [
        { id: '65012345', name: 'สมชาย ใจดี', code: '65012345', sec: 'SEC 1', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
        { id: '65014892', name: 'กัญญา พรประสิทธิ์', code: '65014892', sec: 'SEC 1', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
        { id: '66023114', name: 'พีรพล รุ่งโรจน์', code: '66023114', sec: 'SEC 2', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
        { id: '66025678', name: 'ธนภรณ์ ศรีสุวรรณ', code: '66025678', sec: 'SEC 2', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
        { id: '65031980', name: 'ชัชวาล เลิศปัญญา', code: '65031980', sec: 'SEC 3', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
      ];

      for (const ds of defaultStudents) {
        const mem: ClassMembership = {
          id: `${assignment.courseId}_${ds.id}`,
          user_id: ds.id,
          class_id: assignment.courseId,
          sec_id: ds.sec,
          role: 'student',
          joined_at: Date.now() - 1000000,
          userName: ds.name,
          userAvatar: ds.avatar,
          studentId: ds.code,
          institution: 'Software Engineering'
        };
        this.memberships.set(mem.id, mem);
        studentMembers.push(mem);
      }
    }

    // Always include any student who submitted to this assignment
    for (const [subKey, sub] of this.submissions.entries()) {
      if (sub.assignmentId === assignmentId && sub.studentId) {
        const exists = studentMembers.some(m => m.user_id === sub.studentId || m.studentId === sub.studentCode);
        if (!exists) {
          const autoMem: ClassMembership = {
            id: `${assignment.courseId}_${sub.studentId}`,
            user_id: sub.studentId,
            class_id: assignment.courseId,
            sec_id: sub.secId || 'SEC 1',
            role: 'student',
            joined_at: Date.now() - 500000,
            userName: sub.studentName || 'Student',
            userAvatar: sub.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            studentId: sub.studentCode || sub.studentId,
            institution: 'General'
          };
          this.memberships.set(autoMem.id, autoMem);
          studentMembers.push(autoMem);
        }
      }
    }

    // Apply SEC filtering with flexible normalization (e.g., Section 1 matches SEC 1)
    const effectiveSecFilter = (secFilter && secFilter !== 'ALL_SEC') 
      ? secFilter 
      : (assignment.targetSecId && assignment.targetSecId !== 'ALL_SEC' ? assignment.targetSecId : undefined);

    const isMatchingSec = (memberSec: string, targetSec?: string) => {
      if (!targetSec || targetSec === 'ALL_SEC' || targetSec === 'All SEC' || targetSec === 'All Sections') return true;
      if (!memberSec) return false;
      if (memberSec === targetSec) return true;
      const clean1 = memberSec.toLowerCase().replace(/section\s*/i, 'sec ').replace(/\s+/g, ' ').trim();
      const clean2 = targetSec.toLowerCase().replace(/section\s*/i, 'sec ').replace(/\s+/g, ' ').trim();
      return clean1 === clean2;
    };

    const filteredMembers = effectiveSecFilter 
      ? studentMembers.filter(m => isMatchingSec(m.sec_id, effectiveSecFilter))
      : studentMembers;

    let submittedCount = 0;
    let notSubmittedCount = 0;
    let gradedCount = 0;

    const studentsList: StudentSubmissionItem[] = filteredMembers.map(m => {
      let sub = this.submissions.get(`${assignmentId}_${m.user_id}`) || 
                this.submissions.get(`${assignmentId}_${m.studentId}`);
      if (!sub) {
        for (const [k, s] of this.submissions.entries()) {
          if (s.assignmentId === assignmentId && (
            s.studentId === m.user_id || 
            s.studentId === m.studentId || 
            s.studentCode === m.studentId ||
            s.studentName === m.userName
          )) {
            sub = s;
            break;
          }
        }
      }
      let status: 'submitted' | 'not_submitted' | 'graded' = 'not_submitted';

      if (sub && sub.status !== 'draft') {
        if (sub.grade !== undefined && sub.grade !== null) {
          status = 'graded';
          gradedCount++;
        } else {
          status = 'submitted';
          submittedCount++;
        }
      } else {
        notSubmittedCount++;
      }

      return {
        studentId: m.user_id,
        studentCode: m.studentId,
        name: m.userName,
        avatar: m.userAvatar,
        secId: m.sec_id,
        status,
        submission: sub
      };
    });

    return {
      assignment,
      students: studentsList,
      totalStudents: studentsList.length,
      submittedCount,
      notSubmittedCount,
      gradedCount
    };
  }

  // 6. Instructor grades individual student submission (Requirement 11)
  public gradeSubmission(
    instructorId: string,
    role: UserRole,
    assignmentId: string,
    studentId: string,
    grade: number,
    feedback?: string,
    studentInfo?: { studentName?: string; studentCode?: string; studentAvatar?: string; secId?: string }
  ): AssignmentSubmission {
    let assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      assignment = {
        id: assignmentId,
        courseId: 'course-1',
        courseName: 'General Course',
        title: 'Assignment',
        module: 'Module',
        points: 100,
        dueDate: 'Due Date',
        targetSecId: 'ALL_SEC',
        status: 'Not Submitted',
        instructions: []
      };
      this.assignments.set(assignmentId, assignment);
    }

    if (!this.isClassInstructor(instructorId, assignment.courseId, role)) {
      throw new Error('403 Forbidden: Instructor does not have access to this class');
    }

    const subKey = `${assignmentId}_${studentId}`;
    let sub = this.submissions.get(subKey);
    if (!sub) {
      // Find by studentCode or studentName or alternate keys
      for (const [k, s] of this.submissions.entries()) {
        if (s.assignmentId === assignmentId && (
          s.studentId === studentId || 
          s.studentCode === studentId || 
          (studentInfo?.studentCode && s.studentCode === studentInfo.studentCode) ||
          (studentInfo?.studentName && s.studentName === studentInfo.studentName)
        )) {
          sub = s;
          break;
        }
      }
    }

    const validatedGrade = Math.min(Math.max(0, Number(grade) || 0), assignment.points);
    const nowStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (!sub) {
      sub = {
        id: `sub_${assignmentId}_${studentId}`,
        assignmentId,
        courseId: assignment.courseId,
        secId: studentInfo?.secId || 'SEC 1',
        studentId,
        studentCode: studentInfo?.studentCode || studentId,
        studentName: studentInfo?.studentName || 'Student',
        studentAvatar: studentInfo?.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        submittedAt: nowStr,
        status: 'graded',
        files: [],
        fileNames: []
      };
    }

    const updatedSubmission: AssignmentSubmission = {
      ...sub,
      secId: studentInfo?.secId || sub.secId || 'SEC 1',
      studentName: studentInfo?.studentName || sub.studentName || 'Student',
      studentCode: studentInfo?.studentCode || sub.studentCode || studentId,
      studentAvatar: studentInfo?.studentAvatar || sub.studentAvatar,
      grade: validatedGrade,
      feedback: (feedback || '').trim(),
      status: 'graded',
      gradedBy: instructorId,
      gradedAt: nowStr
    };

    this.submissions.set(subKey, updatedSubmission);
    if (studentInfo?.studentCode && studentInfo.studentCode !== studentId) {
      this.submissions.set(`${assignmentId}_${studentInfo.studentCode}`, updatedSubmission);
    }
    return updatedSubmission;
  }

  // 7. Create assignment (Instructor only)
  public createAssignment(
    instructorId: string,
    role: UserRole,
    data: Omit<Assignment, 'id'>
  ): Assignment {
    if (!this.isClassInstructor(instructorId, data.courseId, role)) {
      throw new Error('403 Forbidden: Instructor does not have access to this class');
    }

    const id = `assign_${Date.now()}`;
    const newAssign: Assignment = {
      ...data,
      id,
      status: 'Not Submitted'
    };

    this.assignments.set(id, newAssign);
    return newAssign;
  }

  // 8. Update assignment (Instructor only)
  public updateAssignment(
    instructorId: string,
    role: UserRole,
    assignmentId: string,
    updates: Partial<Assignment>
  ): Assignment {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (!this.isClassInstructor(instructorId, assignment.courseId, role)) {
      throw new Error('403 Forbidden: Instructor does not have access to this class');
    }

    const updated: Assignment = {
      ...assignment,
      ...updates
    };

    this.assignments.set(assignmentId, updated);
    return updated;
  }

  // 9. Delete assignment (Instructor only)
  public deleteAssignment(
    instructorId: string,
    role: UserRole,
    assignmentId: string
  ): boolean {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (!this.isClassInstructor(instructorId, assignment.courseId, role)) {
      throw new Error('403 Forbidden: Instructor does not have access to this class');
    }

    this.assignments.delete(assignmentId);
    // Delete all submissions for this assignment
    for (const [key, sub] of this.submissions.entries()) {
      if (sub.assignmentId === assignmentId) {
        this.submissions.delete(key);
      }
    }
    return true;
  }

  // Delete an entire class/course and cascade delete all its data
  public deleteClass(
    requesterId: string,
    role: UserRole,
    classId: string
  ): { success: boolean; deleted: { assignments: number; posts: number; announcements: number; memberships: number } } {
    if (role !== 'instructor') {
      throw new Error('403 Forbidden: Only instructors can delete a class');
    }

    let assignmentsCount = 0;
    let postsCount = 0;
    let announcementsCount = 0;
    let membershipsCount = 0;

    // 1. Delete assignments & their submissions
    for (const [aId, a] of Array.from(this.assignments.entries())) {
      if (a.courseId === classId) {
        this.assignments.delete(aId);
        assignmentsCount++;
        for (const [subKey, sub] of Array.from(this.submissions.entries())) {
          if (sub.assignmentId === aId || subKey.startsWith(`${aId}_`)) {
            this.submissions.delete(subKey);
          }
        }
      }
    }

    // 2. Delete posts
    for (const [pId, p] of Array.from(this.posts.entries())) {
      if (p.class_id === classId) {
        this.posts.delete(pId);
        postsCount++;
      }
    }

    // 3. Delete announcements
    for (const [annId, ann] of Array.from(this.announcements.entries())) {
      if (ann.class_id === classId) {
        this.announcements.delete(annId);
        announcementsCount++;
      }
    }

    // 4. Delete memberships
    for (const [mId, m] of Array.from(this.memberships.entries())) {
      if (m.class_id === classId) {
        this.memberships.delete(mId);
        membershipsCount++;
      }
    }

    // 5. Delete class theme
    this.classThemes.delete(classId);

    return {
      success: true,
      deleted: {
        assignments: assignmentsCount,
        posts: postsCount,
        announcements: announcementsCount,
        memberships: membershipsCount
      }
    };
  }

  // Helper to get raw maps for testing
  public _resetForTest() {
    this.memberships.clear();
    this.announcements.clear();
    this.posts.clear();
    this.assignments.clear();
    this.submissions.clear();
    this.seedInitialData();
  }
}

export const secStore = new SecStore();
