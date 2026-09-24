export type UserRole = 'student' | 'instructor';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  studentId?: string;
  institution?: string;
  gradeLevel?: string; // e.g. "Sophomore", "Faculty"
  bio?: string;
  coverImage?: string;
  statusMessage?: string;
  interests?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    website?: string;
    instagram?: string;
  };
  friends?: string[]; // Array of friend user IDs
  friendRequestsSent?: string[]; // Array of user IDs where friend request was sent
  friendRequestsReceived?: string[]; // Array of user IDs from whom friend request was received
  profileThemeColor?: string;
}

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole?: string;
  content: string;
  createdAt: string;
}

export interface SubmittedFile {
  name: string;
  size: string;
  type?: string;
  dataUrl?: string; // base64 / data URL for device uploaded files & photos
  url?: string;
}

export interface AssignmentSubmission {
  id?: string;
  assignmentId?: string;
  courseId?: string;
  secId?: string;
  studentId?: string;
  studentName?: string;
  studentAvatar?: string;
  studentCode?: string;
  fileNames?: string[];
  files?: SubmittedFile[];
  textEntry?: string;
  status?: 'draft' | 'submitted' | 'graded';
  submittedAt: string;
  updatedAt?: string;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  version?: number;
}

export interface StudentSubmissionItem {
  studentId: string;
  studentCode?: string;
  name: string;
  avatar?: string;
  secId: string;
  status: 'submitted' | 'not_submitted' | 'graded';
  submission?: AssignmentSubmission;
}

export interface PostAttachment {
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'zip' | 'image' | 'other';
  url?: string;
  dataUrl?: string;
}

export interface PostItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorBadge?: string; // e.g. "FACULTY"
  timeAgo: string;
  courseTag?: string; // e.g. "CompSci 401", "All Sections"
  courseId?: string;
  secId?: string; // e.g. "SEC 1", "SEC 2"
  scope?: 'SEC' | 'ALL_SEC';
  content: string;
  imageUrl?: string;
  attachment?: PostAttachment;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  comments?: PostComment[];
  createdAt: number;
  updatedAt?: number;
  isEdited?: boolean;
  deleted_at?: number | null;
  deleted_by?: string;
}

export interface ClassMembership {
  id: string;
  user_id: string;
  class_id: string;
  sec_id: string;
  role: UserRole;
  joined_at: number;
  userName: string;
  userAvatar: string;
  studentId: string; // e.g. "65012345" or "T001"
  institution?: string;
}

export interface ClassAnnouncement {
  id: string;
  announcement_id: string;
  class_id: string;
  sec_id: string;
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
  attachment?: PostAttachment;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  comments?: PostComment[];
  created_at: number;
  updated_at?: number;
}

export type CourseType = 'regular' | 'workshop';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface CourseSectionSchedule {
  sectionName: string; // e.g. "Section 1", "Section 2", "Section A"
  day: DayOfWeek;
  startTime: string;   // e.g. "09:00"
  endTime: string;     // e.g. "10:30"
  displayTime?: string; // e.g. "09:00 - 10:30 AM"
  location: string;    // e.g. "Sci-Tech 402"
}

export interface ClassCancellation {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  sectionName?: string;
  day: DayOfWeek;
  dateNote: string; // e.g. "2024-10-25 (Week 4)" or "25 ต.ค. 2024"
  specificDate?: string; // e.g. "2024-10-25"
  reason: string;
  cancelledBy: string;
  cancelledAt: string;
}

export interface CoInstructorInfo {
  uid?: string;
  name: string;
  email?: string;
  avatar?: string;
  roleTitle?: string; // e.g. "Co-Instructor", "Teaching Assistant"
  addedAt?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  type: CourseType; // 'regular' vs 'workshop'
  instructor: string;
  instructorId?: string;
  coInstructors?: string[]; // Array of co-instructor IDs or names or emails
  coInstructorDetails?: CoInstructorInfo[];
  instructorAvatar: string;
  location?: string;
  enrolledCount: number;
  enrolledStudents?: string[]; // Array of student user IDs or names who joined
  enrolledStudentSections?: Record<string, string>; // studentUid -> sectionName
  sections?: string[]; // list of section names
  sectionSchedules?: CourseSectionSchedule[];
  selectedSection?: string;
  hasAssignments?: boolean;
  color: string;
  bannerImage?: string;
  welcomeAnnouncement?: string;
  tags?: string[];
  description: string;
  cancelledSessions?: ClassCancellation[];
}

export interface Assignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  module: string;
  points: number;
  dueDate: string;
  targetSecId?: string; // 'ALL_SEC' or specific SEC e.g. 'SEC 1'
  status: 'Not Submitted' | 'Submitted' | 'Graded';
  instructions: string[];
  templateFileName?: string;
  templateFileUrl?: string;
  allowResubmission?: boolean; // If false, students can only submit once
  submission?: AssignmentSubmission;
  submissions?: Record<string, AssignmentSubmission>;
}

export interface DiscussionComment {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  isInstructor?: boolean;
  date: string;
  text: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  type: 'Lecture' | 'Seminar' | 'Lab' | 'Study Session' | 'Exam' | 'Personal Reminder' | 'Task' | 'Personal' | 'Workshop';
  code: string;
  courseId?: string;
  section?: string;
  createdBy?: string;
  isPersonal?: boolean;
  visibility?: 'private' | 'shared_users' | 'shared_course' | 'shared_friends';
  sharedWithUserIds?: string[]; // List of user IDs that this personal schedule is shared with
  day: DayOfWeek;
  specificDate?: string; // YYYY-MM-DD
  startTime: string; // "08:30"
  endTime: string;   // "10:00"
  displayTime: string; // "08:30 - 10:00 AM"
  location: string;
  description?: string;
  warningNote?: string; // e.g. "Midterm Next Week"
  colorTheme: 'teal' | 'purple' | 'peach' | 'blue' | 'emerald' | 'rose' | 'amber';
  isCancelled?: boolean;
  cancellationReason?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
  imageUrl?: string;
  fileAttachment?: {
    name: string;
    size: string;
  };
}

export interface ChatThread {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  courseId?: string;
  sectionName?: string;
  isCourseChat?: boolean;
  membersCount?: number;
  activeNow?: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unread?: boolean;
  members?: {
    id: string;
    name: string;
    avatar: string;
    online: boolean;
  }[];
}
