import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { secStore } from '../src/server/secService';

describe('SEC Authorization & Data Isolation Tests', () => {
  const classId = 'course-programming';

  beforeEach(() => {
    secStore._resetForTest();
  });

  test('1. Join Class with SEC & Prevent Duplicate Membership', () => {
    // New student joins SEC 1
    const newStudentId = 'student_new_100';
    const joinResult1 = secStore.joinClass(
      newStudentId,
      classId,
      'SEC 1',
      'student',
      { name: 'สมปอง ยิ้มแย้ม', studentId: '65019999' }
    );

    assert.equal(joinResult1.alreadyJoined, false);
    assert.equal(joinResult1.membership.sec_id, 'SEC 1');
    assert.equal(joinResult1.membership.class_id, classId);
    assert.equal(joinResult1.membership.studentId, '65019999');

    // Attempt to join again with SEC 2 -> should return existing SEC 1 without duplicate
    const joinResult2 = secStore.joinClass(
      newStudentId,
      classId,
      'SEC 2',
      'student',
      { name: 'สมปอง ยิ้มแย้ม' }
    );

    assert.equal(joinResult2.alreadyJoined, true);
    assert.equal(joinResult2.membership.sec_id, 'SEC 1', 'Student must retain their existing SEC 1');
  });

  test('2. Member Isolation: Student 001 in SEC 1 sees only Teacher + SEC 1 students', () => {
    const result = secStore.getMembers('student_001', 'student', classId);

    assert.equal(result.currentSec, 'SEC 1');
    assert.equal(result.isInstructor, false);

    // Verify student 001 and 002 are present
    const memberIds = result.members.map(m => m.user_id);
    assert.ok(memberIds.includes('student_001'), 'Student 001 must see themselves');
    assert.ok(memberIds.includes('student_002'), 'Student 001 must see Student 002 from SEC 1');
    assert.ok(memberIds.includes('inst_teacher_a'), 'Student 001 must see Teacher A');

    // Verify students from SEC 2 are strictly excluded
    assert.ok(!memberIds.includes('student_003'), 'Student 001 must NOT see Student 003 from SEC 2');
    assert.ok(!memberIds.includes('student_004'), 'Student 001 must NOT see Student 004 from SEC 2');
  });

  test('3. Member Isolation: Student 003 in SEC 2 sees only Teacher + SEC 2 students', () => {
    const result = secStore.getMembers('student_003', 'student', classId);

    assert.equal(result.currentSec, 'SEC 2');
    const memberIds = result.members.map(m => m.user_id);

    assert.ok(memberIds.includes('student_003'), 'Student 003 must see themselves');
    assert.ok(memberIds.includes('student_004'), 'Student 003 must see Student 004 from SEC 2');
    assert.ok(memberIds.includes('inst_teacher_a'), 'Student 003 must see Teacher A');

    // SEC 1 students must not be visible
    assert.ok(!memberIds.includes('student_001'), 'Student 003 must NOT see Student 001 from SEC 1');
    assert.ok(!memberIds.includes('student_002'), 'Student 003 must NOT see Student 002 from SEC 1');
  });

  test('4. Security Tampering: Student in SEC 1 cannot peek at SEC 2 members via requestedSecId', () => {
    // Student 001 passes requestedSecId = 'SEC 2'
    const result = secStore.getMembers('student_001', 'student', classId, 'SEC 2');

    // Backend must lock to student's enrolled SEC (SEC 1) and NOT return SEC 2 members
    assert.equal(result.currentSec, 'SEC 1');
    const memberIds = result.members.map(m => m.user_id);
    assert.ok(!memberIds.includes('student_003'), 'SEC 2 students must NOT be leaked');
    assert.ok(!memberIds.includes('student_004'), 'SEC 2 students must NOT be leaked');
  });

  test('5. Announcement Scope: Student in SEC 1 sees SEC 1 & ALL_SEC, but NOT SEC 2', () => {
    const result = secStore.getAnnouncements('student_001', 'student', classId);

    const announcementIds = result.announcements.map(a => a.announcement_id);

    // Should see ALL_SEC announcement
    assert.ok(announcementIds.includes('ann_global_01'), 'Must see ALL_SEC announcement');
    // Should see SEC 1 announcement
    assert.ok(announcementIds.includes('ann_sec1_01'), 'Must see SEC 1 announcement');
    // Must NOT see SEC 2 announcement
    assert.ok(!announcementIds.includes('ann_sec2_01'), 'Must NOT see SEC 2 announcement');
  });

  test('6. Announcement Scope: Student in SEC 2 sees SEC 2 & ALL_SEC, but NOT SEC 1', () => {
    const result = secStore.getAnnouncements('student_003', 'student', classId);

    const announcementIds = result.announcements.map(a => a.announcement_id);

    // Should see ALL_SEC announcement
    assert.ok(announcementIds.includes('ann_global_01'), 'Must see ALL_SEC announcement');
    // Should see SEC 2 announcement
    assert.ok(announcementIds.includes('ann_sec2_01'), 'Must see SEC 2 announcement');
    // Must NOT see SEC 1 announcement
    assert.ok(!announcementIds.includes('ann_sec1_01'), 'Must NOT see SEC 1 announcement');
  });

  test('7. Post Isolation: Student sees only posts created in their SEC', () => {
    // SEC 1 Student
    const sec1Posts = secStore.getPosts('student_001', 'student', classId);
    const sec1PostIds = sec1Posts.posts.map(p => p.post_id);

    assert.ok(sec1PostIds.includes('post_sec1_01'), 'Student 001 must see post from SEC 1');
    assert.ok(!sec1PostIds.includes('post_sec2_01'), 'Student 001 must NOT see post from SEC 2');

    // SEC 2 Student
    const sec2Posts = secStore.getPosts('student_003', 'student', classId);
    const sec2PostIds = sec2Posts.posts.map(p => p.post_id);

    assert.ok(sec2PostIds.includes('post_sec2_01'), 'Student 003 must see post from SEC 2');
    assert.ok(!sec2PostIds.includes('post_sec1_01'), 'Student 003 must NOT see post from SEC 1');
  });

  test('8. Post Creation Security: Student in SEC 1 cannot post to SEC 2', () => {
    assert.throws(
      () => {
        secStore.createPost(
          'student_001',
          'student',
          classId,
          'SEC 2', // Attempting to post to foreign SEC 2
          'Hello SEC 2 from SEC 1 student'
        );
      },
      /Forbidden/,
      'Student must be forbidden from posting to a SEC they are not in'
    );
  });

  test('9. Instructor Privileges: Instructor can post ALL_SEC announcement and view all SECs', () => {
    // Instructor creates new ALL_SEC announcement
    const newAnn = secStore.createAnnouncement(
      'inst_teacher_a',
      'instructor',
      classId,
      'ALL_SEC',
      'ALL_SEC',
      'ประกาศด่วน ทุก SEC',
      'งดการเรียนการสอนในวันหยุดราชการ'
    );

    assert.equal(newAnn.scope, 'ALL_SEC');
    assert.equal(newAnn.sec_id, 'ALL_SEC');

    // Verify both SEC 1 and SEC 2 students receive it
    const sec1Ann = secStore.getAnnouncements('student_001', 'student', classId);
    assert.ok(sec1Ann.announcements.some(a => a.id === newAnn.id), 'SEC 1 student sees new ALL_SEC announcement');

    const sec2Ann = secStore.getAnnouncements('student_003', 'student', classId);
    assert.ok(sec2Ann.announcements.some(a => a.id === newAnn.id), 'SEC 2 student sees new ALL_SEC announcement');

    // Instructor can filter members by SEC 1 or view all
    const sec1Members = secStore.getMembers('inst_teacher_a', 'instructor', classId, 'SEC 1');
    assert.ok(sec1Members.members.some(m => m.user_id === 'student_001'));
    assert.ok(!sec1Members.members.some(m => m.user_id === 'student_003'));

    const allMembers = secStore.getMembers('inst_teacher_a', 'instructor', classId, 'ALL_SEC');
    assert.ok(allMembers.members.some(m => m.user_id === 'student_001'));
    assert.ok(allMembers.members.some(m => m.user_id === 'student_003'));
  });

  test('10. Member Data Format: Photo | ID | Full Name for both students and instructors', () => {
    const result = secStore.getMembers('inst_teacher_a', 'instructor', classId, 'ALL_SEC');

    for (const member of result.members) {
      assert.ok(member.userAvatar, `Member ${member.userName} must have avatar`);
      assert.ok(member.studentId, `Member ${member.userName} must have ID (${member.studentId})`);
      assert.ok(member.userName, `Member must have full name`);
    }

    // Check teacher format
    const teacher = result.members.find(m => m.role === 'instructor');
    assert.equal(teacher?.studentId, 'T001');

    // Check student format
    const student = result.members.find(m => m.user_id === 'student_001');
    assert.equal(student?.studentId, '65012345');
    assert.equal(student?.userName, 'สมชาย ใจดี (Student 001)');
  });
});
