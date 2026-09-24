import { Router, Request, Response } from 'express';
import { secStore, UserInfoPayload } from './secService';
import { UserRole } from '../types';

export const apiRouter = Router();

// Helper to extract authenticated user credentials from request headers/body
function getRequester(req: Request): { uid: string; role: UserRole; name?: string; avatar?: string; studentId?: string; institution?: string } {
  const uid = (req.headers['x-user-uid'] as string) || (req.body?.requesterUid as string) || (req.query.requesterUid as string) || 'student_guest';
  const role = ((req.headers['x-user-role'] as string) || (req.body?.requesterRole as string) || (req.query.requesterRole as string) || 'student') as UserRole;
  const name = (req.headers['x-user-name'] as string) || (req.body?.requesterName as string) || (req.query.requesterName as string);
  const avatar = (req.headers['x-user-avatar'] as string) || (req.body?.requesterAvatar as string);
  const studentId = (req.headers['x-user-studentid'] as string) || (req.body?.requesterStudentId as string);
  const institution = (req.headers['x-user-institution'] as string) || (req.body?.requesterInstitution as string);

  return { uid, role, name, avatar, studentId, institution };
}

// 1. Check user membership & current SEC in a class
apiRouter.get('/classes/:classId/membership', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { uid } = getRequester(req);
    const membership = secStore.getMembership(uid, classId);

    if (!membership) {
      return res.json({ enrolled: false, membership: null });
    }

    return res.json({
      enrolled: true,
      membership,
      secId: membership.sec_id
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Join a class with SEC selection
apiRouter.post('/classes/:classId/join', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { secId, userInfo } = req.body;
    const requester = getRequester(req);

    if (!secId) {
      return res.status(400).json({ error: 'secId is required to join class' });
    }

    const payloadInfo: Partial<UserInfoPayload> = {
      name: userInfo?.name || requester.name,
      avatar: userInfo?.avatar || requester.avatar,
      studentId: userInfo?.studentId || requester.studentId,
      institution: userInfo?.institution || requester.institution
    };

    const result = secStore.joinClass(requester.uid, classId, secId, requester.role, payloadInfo);

    return res.status(result.alreadyJoined ? 200 : 201).json({
      success: true,
      alreadyJoined: result.alreadyJoined,
      membership: result.membership,
      message: result.alreadyJoined
        ? `คุณเป็นสมาชิกของวิชานี้อยู่แล้วในกลุ่ม ${result.membership.sec_id}`
        : `เข้าร่วมกลุ่มเรียน ${result.membership.sec_id} เรียบร้อยแล้ว`
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 3. Get Class Members with strict SEC separation
apiRouter.get('/classes/:classId/members', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { secId } = req.query;
    const requester = getRequester(req);

    const result = secStore.getMembers(
      requester.uid,
      requester.role,
      classId,
      typeof secId === 'string' ? secId : undefined
    );

    return res.json({
      success: true,
      classId,
      currentSec: result.currentSec,
      isInstructor: result.isInstructor,
      members: result.members
    });
  } catch (err: any) {
    if (err.message.includes('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

// 4. Get Class Announcements (SEC + ALL_SEC)
apiRouter.get('/classes/:classId/announcements', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { secId } = req.query;
    const requester = getRequester(req);

    const result = secStore.getAnnouncements(
      requester.uid,
      requester.role,
      classId,
      typeof secId === 'string' ? secId : undefined
    );

    return res.json({
      success: true,
      classId,
      currentSec: result.currentSec,
      announcements: result.announcements
    });
  } catch (err: any) {
    if (err.message.includes('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

// 5. Create Announcement (Instructor Only)
apiRouter.post('/classes/:classId/announcements', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { secId, scope, title, content, authorInfo } = req.body;
    const requester = getRequester(req);

    if (requester.role !== 'instructor') {
      return res.status(403).json({ error: 'Forbidden: Only instructors can create announcements' });
    }

    const targetScope = scope === 'ALL_SEC' ? 'ALL_SEC' : 'SEC';
    const targetSec = targetScope === 'ALL_SEC' ? 'ALL_SEC' : (secId || 'SEC 1');

    const created = secStore.createAnnouncement(
      requester.uid,
      requester.role,
      classId,
      targetSec,
      targetScope,
      title,
      content,
      {
        name: authorInfo?.name || requester.name,
        avatar: authorInfo?.avatar || requester.avatar
      }
    );

    return res.status(201).json({
      success: true,
      announcement: created
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 6. Edit Announcement
apiRouter.put('/classes/:classId/announcements/:announcementId', (req: Request, res: Response) => {
  try {
    const { classId, announcementId } = req.params;
    const updates = req.body;
    const requester = getRequester(req);

    const updated = secStore.editAnnouncement(
      requester.uid,
      requester.role,
      classId,
      announcementId,
      updates
    );

    return res.json({
      success: true,
      announcement: updated
    });
  } catch (err: any) {
    if (err.message.includes('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
});

// 7. Delete Announcement
apiRouter.delete('/classes/:classId/announcements/:announcementId', (req: Request, res: Response) => {
  try {
    const { classId, announcementId } = req.params;
    const requester = getRequester(req);

    secStore.deleteAnnouncement(
      requester.uid,
      requester.role,
      classId,
      announcementId
    );

    return res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (err: any) {
    if (err.message.includes('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
});

// 8. Get Class Posts (Strictly separated by SEC for students)
apiRouter.get('/classes/:classId/posts', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { secId } = req.query;
    const requester = getRequester(req);

    const result = secStore.getPosts(
      requester.uid,
      requester.role,
      classId,
      typeof secId === 'string' ? secId : undefined
    );

    return res.json({
      success: true,
      classId,
      currentSec: result.currentSec,
      posts: result.posts
    });
  } catch (err: any) {
    if (err.message.includes('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

// 9. Create Post (Student bounded to enrolled SEC; Instructor can post to SEC or All SEC)
apiRouter.post('/classes/:classId/posts', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { secId, content, imageUrl, attachment, authorInfo } = req.body;
    const requester = getRequester(req);

    const created = secStore.createPost(
      requester.uid,
      requester.role,
      classId,
      secId,
      content,
      {
        name: authorInfo?.name || requester.name,
        avatar: authorInfo?.avatar || requester.avatar,
        studentId: authorInfo?.studentId || requester.studentId
      },
      { imageUrl, attachment }
    );

    return res.status(201).json({
      success: true,
      post: created
    });
  } catch (err: any) {
    if (err.message.includes('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
});

// 10. Edit Post
apiRouter.put('/classes/:classId/posts/:postId', (req: Request, res: Response) => {
  try {
    const { classId, postId } = req.params;
    const { content, imageUrl, attachment } = req.body;
    const requester = getRequester(req);

    const updated = secStore.editPost(
      requester.uid,
      requester.role,
      classId,
      postId,
      content,
      { imageUrl, attachment }
    );

    return res.json({
      success: true,
      post: updated
    });
  } catch (err: any) {
    if (err.message.includes('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
});

// 11. Delete Post
apiRouter.delete('/classes/:classId/posts/:postId', (req: Request, res: Response) => {
  try {
    const { classId, postId } = req.params;
    const requester = getRequester(req);

    secStore.deletePost(requester.uid, requester.role, classId, postId);

    return res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (err: any) {
    if (err.message.includes('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
});

// 12. Like / Unlike Post
apiRouter.post('/posts/:postId/like', (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const requester = getRequester(req);

    const updated = secStore.toggleLike(requester.uid, postId);
    return res.json({ success: true, post: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 13. Comment on Post
apiRouter.post('/posts/:postId/comments', (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { content, authorInfo } = req.body;
    const requester = getRequester(req);

    const updated = secStore.addComment(
      requester.uid,
      requester.role,
      postId,
      content,
      {
        name: authorInfo?.name || requester.name,
        avatar: authorInfo?.avatar || requester.avatar
      }
    );

    return res.json({ success: true, post: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 14. Decorate Class Page (Instructor only)
apiRouter.put('/classes/:classId/decorate', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const requester = getRequester(req);
    const result = secStore.decorateClass(requester.uid, requester.role, classId, req.body);
    return res.json(result);
  } catch (err: any) {
    if (err.message.includes('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
});

// 15. Get Class Theme Customization
apiRouter.get('/classes/:classId/theme', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const theme = secStore.getClassTheme(classId);
    return res.json({ success: true, theme: theme || null });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 15b. Delete Class and Cascade Delete All Associated Data
apiRouter.delete('/classes/:classId', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const requester = getRequester(req);
    const result = secStore.deleteClass(requester.uid, requester.role, classId);
    return res.json(result);
  } catch (err: any) {
    if (err.message.includes('Forbidden')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
});

// =========================================================================
// ASSIGNMENTS & INDIVIDUAL SUBMISSIONS API ROUTES
// =========================================================================

// 16. Get assignments for a class (SEC-filtered for students)
apiRouter.get('/classes/:classId/assignments', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const requester = getRequester(req);
    const secId = req.query.secId as string | undefined;

    const assignments = secStore.getAssignments(requester.uid, requester.role, classId, secId);
    return res.json({ success: true, assignments });
  } catch (err: any) {
    const status = err.message.includes('Forbidden') ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
});

// 17. Create assignment (Instructor only)
apiRouter.post('/classes/:classId/assignments', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const requester = getRequester(req);
    const newAssignment = secStore.createAssignment(requester.uid, requester.role, {
      ...req.body,
      courseId: classId
    });
    return res.status(201).json({ success: true, assignment: newAssignment });
  } catch (err: any) {
    const status = err.message.includes('Forbidden') ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
});

// 18. Get single assignment details & student's own submission
apiRouter.get('/assignments/:assignmentId', (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const requester = getRequester(req);
    const result = secStore.getAssignment(requester.uid, requester.role, assignmentId);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.message.includes('Forbidden') ? 403 : (err.message.includes('not found') ? 404 : 400);
    return res.status(status).json({ error: err.message });
  }
});

// 19. Update assignment (Instructor only)
apiRouter.put('/assignments/:assignmentId', (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const requester = getRequester(req);
    const updated = secStore.updateAssignment(requester.uid, requester.role, assignmentId, req.body);
    return res.json({ success: true, assignment: updated });
  } catch (err: any) {
    const status = err.message.includes('Forbidden') ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
});

// 20. Delete assignment (Instructor only)
apiRouter.delete('/assignments/:assignmentId', (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const requester = getRequester(req);
    secStore.deleteAssignment(requester.uid, requester.role, assignmentId);
    return res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err: any) {
    const status = err.message.includes('Forbidden') ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
});

// 21. Get my submission (Student only)
apiRouter.get('/assignments/:assignmentId/my-submission', (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const requester = getRequester(req);
    const result = secStore.getAssignment(requester.uid, requester.role, assignmentId);
    return res.json({ success: true, submission: result.mySubmission });
  } catch (err: any) {
    const status = err.message.includes('Forbidden') ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
});

// 22. Submit assignment (Student only - strictly bound to requester.uid)
apiRouter.post('/assignments/:assignmentId/submit', (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const requester = getRequester(req);
    const submission = secStore.submitAssignment(
      requester.uid,
      requester.role,
      assignmentId,
      req.body,
      {
        name: requester.name,
        avatar: requester.avatar,
        studentId: requester.studentId,
        institution: requester.institution
      }
    );
    return res.status(201).json({ success: true, submission });
  } catch (err: any) {
    const status = err.message.includes('Forbidden') ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
});

// 23. Get submission by studentId - Strict Authorization (Requirement 9 & 10)
apiRouter.get('/assignments/:assignmentId/submissions/:targetStudentId', (req: Request, res: Response) => {
  try {
    const { assignmentId, targetStudentId } = req.params;
    const requester = getRequester(req);
    const submission = secStore.getSubmissionById(
      requester.uid,
      requester.role,
      assignmentId,
      targetStudentId
    );
    return res.json({ success: true, submission });
  } catch (err: any) {
    const status = err.message.includes('403') || err.message.includes('Forbidden') ? 403 : 404;
    return res.status(status).json({ error: err.message });
  }
});

// 24. Instructor view: Get all students and submissions in class / SEC (Requirement 7)
apiRouter.get('/assignments/:assignmentId/instructor-summary', (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const requester = getRequester(req);
    const secFilter = req.query.secId as string | undefined;

    const summary = secStore.getStudentsSubmissionsForInstructor(
      requester.uid,
      requester.role,
      assignmentId,
      secFilter
    );
    return res.json({ success: true, ...summary });
  } catch (err: any) {
    const status = err.message.includes('403') || err.message.includes('Forbidden') ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
});

// 25. Instructor grades a student submission (Requirement 11)
apiRouter.post('/assignments/:assignmentId/grade', (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { studentId, grade, feedback, studentName, studentCode, studentAvatar, secId } = req.body;
    const requester = getRequester(req);

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    const updated = secStore.gradeSubmission(
      requester.uid,
      requester.role,
      assignmentId,
      studentId,
      grade,
      feedback,
      { studentName, studentCode, studentAvatar, secId }
    );

    return res.json({ success: true, submission: updated });
  } catch (err: any) {
    const status = err.message.includes('403') || err.message.includes('Forbidden') ? 403 : 400;
    return res.status(status).json({ error: err.message });
  }
});
