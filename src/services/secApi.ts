import { ClassMembership, ClassAnnouncement, ClassPost, UserProfile, UserRole } from '../types';

function getAuthHeaders(currentUser: UserProfile | null): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-user-uid': currentUser?.uid || 'student_guest',
    'x-user-role': currentUser?.role || 'student',
    'x-user-name': encodeURIComponent(currentUser?.name || 'Student'),
    'x-user-avatar': currentUser?.avatar || '',
    'x-user-studentid': currentUser?.studentId || currentUser?.uid || '',
    'x-user-institution': encodeURIComponent(currentUser?.institution || '')
  };
}

export const secApi = {
  // Check membership in a class
  async getMembership(classId: string, currentUser: UserProfile | null): Promise<{ enrolled: boolean; membership: ClassMembership | null; secId?: string }> {
    try {
      const res = await fetch(`/api/classes/${classId}/membership`, {
        headers: getAuthHeaders(currentUser)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API getMembership error, using local fallback:', err);
      return { enrolled: false, membership: null };
    }
  },

  // Join a class with a specific SEC
  async joinClass(
    classId: string,
    secId: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; alreadyJoined: boolean; membership: ClassMembership; message?: string }> {
    const res = await fetch(`/api/classes/${classId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify({
        secId,
        userInfo: {
          name: currentUser?.name,
          avatar: currentUser?.avatar,
          studentId: currentUser?.studentId || (currentUser?.role === 'instructor' ? `T001` : '65012345'),
          institution: currentUser?.institution
        }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to join class');
    }
    return data;
  },

  // Get members with strict SEC filtering
  async getMembers(
    classId: string,
    currentUser: UserProfile | null,
    secId?: string
  ): Promise<{ success: boolean; currentSec: string; isInstructor: boolean; members: ClassMembership[] }> {
    const query = secId ? `?secId=${encodeURIComponent(secId)}` : '';
    const res = await fetch(`/api/classes/${classId}/members${query}`, {
      headers: getAuthHeaders(currentUser)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load class members');
    }
    return data;
  },

  // Get announcements with strict SEC filtering
  async getAnnouncements(
    classId: string,
    currentUser: UserProfile | null,
    secId?: string
  ): Promise<{ success: boolean; currentSec: string; announcements: ClassAnnouncement[] }> {
    const query = secId ? `?secId=${encodeURIComponent(secId)}` : '';
    const res = await fetch(`/api/classes/${classId}/announcements${query}`, {
      headers: getAuthHeaders(currentUser)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load class announcements');
    }
    return data;
  },

  // Create announcement (Instructor only)
  async createAnnouncement(
    classId: string,
    secId: string,
    scope: 'SEC' | 'ALL_SEC',
    title: string,
    content: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; announcement: ClassAnnouncement }> {
    const res = await fetch(`/api/classes/${classId}/announcements`, {
      method: 'POST',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify({
        secId,
        scope,
        title,
        content,
        authorInfo: {
          name: currentUser?.name,
          avatar: currentUser?.avatar
        }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create announcement');
    }
    return data;
  },

  // Delete announcement
  async deleteAnnouncement(
    classId: string,
    announcementId: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean }> {
    const res = await fetch(`/api/classes/${classId}/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(currentUser)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete announcement');
    }
    return data;
  },

  // Get posts with strict SEC filtering
  async getPosts(
    classId: string,
    currentUser: UserProfile | null,
    secId?: string
  ): Promise<{ success: boolean; currentSec: string; posts: ClassPost[] }> {
    const query = secId ? `?secId=${encodeURIComponent(secId)}` : '';
    const res = await fetch(`/api/classes/${classId}/posts${query}`, {
      headers: getAuthHeaders(currentUser)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load class posts');
    }
    return data;
  },

  // Create post (Student strictly into enrolled SEC; Instructor into SEC or ALL_SEC)
  async createPost(
    classId: string,
    secId: string,
    content: string,
    currentUser: UserProfile | null,
    extras?: { imageUrl?: string; attachment?: any }
  ): Promise<{ success: boolean; post: ClassPost }> {
    const res = await fetch(`/api/classes/${classId}/posts`, {
      method: 'POST',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify({
        secId,
        content,
        imageUrl: extras?.imageUrl,
        attachment: extras?.attachment,
        authorInfo: {
          name: currentUser?.name,
          avatar: currentUser?.avatar,
          studentId: currentUser?.studentId
        }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create post');
    }
    return data;
  },

  // Delete post
  async deletePost(
    classId: string,
    postId: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean }> {
    const res = await fetch(`/api/classes/${classId}/posts/${postId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(currentUser)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete post');
    }
    return data;
  },

  // Toggle like
  async toggleLike(
    postId: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; post: ClassPost }> {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: getAuthHeaders(currentUser)
    });
    return await res.json();
  },

  // Add comment
  async addComment(
    postId: string,
    content: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; post: ClassPost }> {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify({
        content,
        authorInfo: {
          name: currentUser?.name,
          avatar: currentUser?.avatar
        }
      })
    });
    return await res.json();
  },

  // Edit post
  async editPost(
    classId: string,
    postId: string,
    content: string,
    currentUser: UserProfile | null,
    extra?: { imageUrl?: string; attachment?: any }
  ): Promise<{ success: boolean; post: ClassPost }> {
    const res = await fetch(`/api/classes/${classId}/posts/${postId}`, {
      method: 'PUT',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify({
        content,
        imageUrl: extra?.imageUrl,
        attachment: extra?.attachment
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to edit post');
    }
    return data;
  },

  // Decorate Class Page
  async decorateClass(
    classId: string,
    updates: any,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; theme: any }> {
    const res = await fetch(`/api/classes/${classId}/decorate`, {
      method: 'PUT',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save class decoration');
    }
    return data;
  },

  // Get Class Theme
  async getClassTheme(
    classId: string
  ): Promise<{ success: boolean; theme: any }> {
    const res = await fetch(`/api/classes/${classId}/theme`);
    return await res.json();
  },

  // ==========================================
  // ASSIGNMENTS & INDIVIDUAL SUBMISSIONS
  // ==========================================

  // Get assignments for class (SEC-filtered for students)
  async getAssignments(
    classId: string,
    currentUser: UserProfile | null,
    secId?: string
  ): Promise<{ success: boolean; assignments: any[] }> {
    const query = secId ? `?secId=${encodeURIComponent(secId)}` : '';
    const res = await fetch(`/api/classes/${classId}/assignments${query}`, {
      headers: getAuthHeaders(currentUser)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  },

  // Get single assignment with student's own submission
  async getAssignment(
    assignmentId: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; assignment: any; mySubmission: any }> {
    const res = await fetch(`/api/assignments/${assignmentId}`, {
      headers: getAuthHeaders(currentUser)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  },

  // Submit assignment (Student only)
  async submitAssignment(
    assignmentId: string,
    payload: { files?: any[]; fileNames?: string[]; textEntry?: string; isDraft?: boolean },
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; submission: any }> {
    const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Failed to submit assignment (HTTP ${res.status})`);
    }
    return data;
  },

  // Get specific student's submission (Enforces Student-isolation & Instructor class authorization)
  async getStudentSubmission(
    assignmentId: string,
    targetStudentId: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; submission: any }> {
    const res = await fetch(`/api/assignments/${assignmentId}/submissions/${targetStudentId}`, {
      headers: getAuthHeaders(currentUser)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  },

  // Instructor view: get all students and their submission status
  async getInstructorSummary(
    assignmentId: string,
    currentUser: UserProfile | null,
    secId?: string
  ): Promise<{
    success: boolean;
    assignment: any;
    students: any[];
    totalStudents: number;
    submittedCount: number;
    notSubmittedCount: number;
    gradedCount: number;
  }> {
    const query = secId ? `?secId=${encodeURIComponent(secId)}` : '';
    const res = await fetch(`/api/assignments/${assignmentId}/instructor-summary${query}`, {
      headers: getAuthHeaders(currentUser)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  },

  // Grade individual submission (Instructor only)
  async gradeSubmission(
    assignmentId: string,
    studentId: string,
    grade: number,
    feedback: string,
    currentUser: UserProfile | null,
    studentInfo?: { studentName?: string; studentCode?: string; studentAvatar?: string; secId?: string }
  ): Promise<{ success: boolean; submission: any }> {
    const res = await fetch(`/api/assignments/${assignmentId}/grade`, {
      method: 'POST',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify({ 
        studentId, 
        grade, 
        feedback,
        studentName: studentInfo?.studentName,
        studentCode: studentInfo?.studentCode,
        studentAvatar: studentInfo?.studentAvatar,
        secId: studentInfo?.secId
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  },

  // Create assignment (Instructor only)
  async createAssignment(
    classId: string,
    assignmentData: any,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; assignment: any }> {
    const res = await fetch(`/api/classes/${classId}/assignments`, {
      method: 'POST',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify(assignmentData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  },

  // Update assignment (Instructor only)
  async updateAssignment(
    assignmentId: string,
    updates: any,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; assignment: any }> {
    const res = await fetch(`/api/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  },

  // Delete assignment (Instructor only)
  async deleteAssignment(
    assignmentId: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(currentUser)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  },

  // Delete an entire class/course and cascade delete all associated data
  async deleteClass(
    classId: string,
    currentUser: UserProfile | null
  ): Promise<{ success: boolean; deleted?: any }> {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(currentUser)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      console.warn('secApi.deleteClass error:', err);
      return { success: false };
    }
  }
};
