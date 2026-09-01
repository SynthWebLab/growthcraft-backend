import {
  User,
  Enrollment,
  CourseEnrollment,
  EventEnrollment,
  TrainingProgramEnrollment,
  Batch,
  Attendance,
  MentorCheckIn,
  Notification,
  Referral,
  StudentProfile,
  Course,
  Bootcamp,
  AuditLog,
  JobPosting,
} from '@/database/models';

describe('Database Schema Compound Indexes', () => {
  const hasIndex = (model: any, indexFields: Record<string, number | string>): boolean => {
    const indexes: any[] = model.schema.indexes();
    return indexes.some(([fields]) => {
      const keys = Object.keys(indexFields);
      const match = keys.every((k) => fields[k] === indexFields[k]);
      return match && Object.keys(fields).length === keys.length;
    });
  };

  describe('User Schema Indexes', () => {
    it('should have compound and operational indexes for user filtering and sorting', () => {
      expect(hasIndex(User, { role: 1, createdAt: -1 })).toBe(true);
      expect(hasIndex(User, { role: 1, isActive: 1 })).toBe(true);
      expect(hasIndex(User, { isActive: 1 })).toBe(true);
      expect(hasIndex(User, { emailVerificationOTP: 1 })).toBe(true);
      expect(hasIndex(User, { passwordResetToken: 1 })).toBe(true);
    });
  });

  describe('Enrollment Schemas Indexes', () => {
    it('should have compound indexes on Enrollment', () => {
      expect(hasIndex(Enrollment, { studentUserId: 1, status: 1 })).toBe(true);
      expect(hasIndex(Enrollment, { batchId: 1, status: 1 })).toBe(true);
      expect(hasIndex(Enrollment, { studentUserId: 1, enrolledAt: -1 })).toBe(true);
    });

    it('should have compound indexes on CourseEnrollment', () => {
      expect(hasIndex(CourseEnrollment, { userId: 1, status: 1 })).toBe(true);
      expect(hasIndex(CourseEnrollment, { userId: 1, enrollmentDate: -1 })).toBe(true);
    });

    it('should have compound indexes on EventEnrollment', () => {
      expect(hasIndex(EventEnrollment, { userId: 1, status: 1 })).toBe(true);
      expect(hasIndex(EventEnrollment, { userId: 1, enrollmentDate: -1 })).toBe(true);
    });

    it('should have compound indexes on TrainingProgramEnrollment', () => {
      expect(hasIndex(TrainingProgramEnrollment, { userId: 1, status: 1 })).toBe(true);
      expect(hasIndex(TrainingProgramEnrollment, { userId: 1, createdAt: -1 })).toBe(true);
    });
  });

  describe('Batch Schema Indexes', () => {
    it('should have compound indexes for batch type, parent entities, and status', () => {
      expect(hasIndex(Batch, { batchType: 1, status: 1 })).toBe(true);
      expect(hasIndex(Batch, { courseId: 1, status: 1 })).toBe(true);
      expect(hasIndex(Batch, { bootcampId: 1, status: 1 })).toBe(true);
      expect(hasIndex(Batch, { trainingProgramId: 1, status: 1 })).toBe(true);
      expect(hasIndex(Batch, { assignedMentorId: 1, status: 1 })).toBe(true);
    });
  });

  describe('Attendance and MentorCheckIn Indexes', () => {
    it('should have compound indexes on Attendance', () => {
      expect(hasIndex(Attendance, { batchId: 1, attendanceDate: 1 })).toBe(true);
      expect(hasIndex(Attendance, { batchId: 1, attendanceDate: -1, createdAt: -1 })).toBe(true);
      expect(hasIndex(Attendance, { studentUserId: 1, attendanceDate: -1 })).toBe(true);
    });

    it('should have compound indexes on MentorCheckIn', () => {
      expect(hasIndex(MentorCheckIn, { batchId: 1, sessionDate: -1 })).toBe(true);
      expect(hasIndex(MentorCheckIn, { mentorId: 1, batchId: 1, status: 1 })).toBe(true);
      expect(hasIndex(MentorCheckIn, { status: 1, sessionDate: -1 })).toBe(true);
    });
  });

  describe('Notification Schema Indexes', () => {
    it('should have compound indexes for userId and read status', () => {
      expect(hasIndex(Notification, { userId: 1, createdAt: -1 })).toBe(true);
      expect(hasIndex(Notification, { userId: 1, readAt: 1 })).toBe(true);
      expect(hasIndex(Notification, { userId: 1, isRead: 1 })).toBe(true);
      expect(hasIndex(Notification, { userId: 1, isRead: 1, createdAt: -1 })).toBe(true);
    });
  });

  describe('Referral Schema Indexes', () => {
    it('should have compound indexes for ambassador and status lookups', () => {
      expect(hasIndex(Referral, { ambassadorUserId: 1, status: 1 })).toBe(true);
      expect(hasIndex(Referral, { ambassadorUserId: 1, createdAt: -1 })).toBe(true);
      expect(hasIndex(Referral, { referredEmail: 1, status: 1 })).toBe(true);
      expect(hasIndex(Referral, { referredUserId: 1, status: 1 })).toBe(true);
    });
  });

  describe('Catalog and Profile Indexes', () => {
    it('should have compound indexes on StudentProfile', () => {
      expect(hasIndex(StudentProfile, { collegeName: 1, yearOfStudy: 1 })).toBe(true);
      expect(hasIndex(StudentProfile, { isAmbassador: 1, totalConversions: -1 })).toBe(true);
    });

    it('should have compound indexes on Course', () => {
      expect(hasIndex(Course, { isPublished: 1, type: 1 })).toBe(true);
      expect(hasIndex(Course, { category: 1, level: 1 })).toBe(true);
      expect(hasIndex(Course, { rating: -1, enrollmentCount: -1 })).toBe(true);
    });

    it('should have compound indexes on Bootcamp', () => {
      expect(hasIndex(Bootcamp, { status: 1, startDate: 1 })).toBe(true);
      expect(hasIndex(Bootcamp, { type: 1, status: 1 })).toBe(true);
    });

    it('should have compound indexes on AuditLog', () => {
      expect(hasIndex(AuditLog, { performedBy: 1, timestamp: -1 })).toBe(true);
      expect(hasIndex(AuditLog, { target: 1, timestamp: -1 })).toBe(true);
      expect(hasIndex(AuditLog, { action: 1, timestamp: -1 })).toBe(true);
    });

    it('should have compound index on JobPosting', () => {
      expect(hasIndex(JobPosting, { hiringPartnerId: 1, status: 1 })).toBe(true);
    });
  });
});
