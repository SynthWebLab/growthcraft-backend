import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/app';
import { jwtConfig } from '@/config/jwt.config';
import {
  User,
  ChatMessage,
  MentorSession,
  MentorProfile,
  Batch,
  Enrollment,
  EnrollmentStatus,
  Course,
  BatchType,
  BatchMode,
} from '@/database/models';
import { UserRole } from '@/common/constants/user.constants';

describe('GC-317: Chat Authorization & RBAC Tests', () => {
  let student1Token: string;
  let student1Id: string;

  let student2Token: string;
  let student2Id: string;

  let mentor1Token: string;
  let mentor1Id: string;
  let mentorProfile1Id: string;

  let mentor2Token: string;
  let mentor2Id: string;

  let employerToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft_test'
      );
    }

    // Clean up collections
    await User.deleteMany({ email: /@test-chat\.com$/ });
    await ChatMessage.deleteMany({});
    await MentorSession.deleteMany({});
    await MentorProfile.deleteMany({});
    await Batch.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});

    // Create test student 1
    const student1 = await User.create({
      fullName: 'Student One',
      email: 'student1@test-chat.com',
      phone: '+1234567801',
      password: 'Password@123',
      role: UserRole.STUDENT,
      isEmailVerified: true,
      isActive: true,
    });
    student1Id = student1._id.toString();

    // Create test student 2
    const student2 = await User.create({
      fullName: 'Student Two',
      email: 'student2@test-chat.com',
      phone: '+1234567802',
      password: 'Password@123',
      role: UserRole.STUDENT,
      isEmailVerified: true,
      isActive: true,
    });
    student2Id = student2._id.toString();

    // Create test mentor 1
    const mentor1 = await User.create({
      fullName: 'Mentor One',
      email: 'mentor1@test-chat.com',
      phone: '+1234567811',
      password: 'Password@123',
      role: UserRole.MENTOR,
      isEmailVerified: true,
      isActive: true,
    });
    mentor1Id = mentor1._id.toString();

    const mentorProfile1 = await MentorProfile.create({
      userId: mentor1._id,
      bio: 'Senior Engineer & Mentor with extensive experience.',
      currentOrganization: 'GrowthCraft',
      experienceYears: 5,
      areaOfExpertise: 'Web Development',
      totalSessions: 0,
    });
    mentorProfile1Id = mentorProfile1._id.toString();

    // Create test mentor 2 (unconnected)
    const mentor2 = await User.create({
      fullName: 'Mentor Two',
      email: 'mentor2@test-chat.com',
      phone: '+1234567812',
      password: 'Password@123',
      role: UserRole.MENTOR,
      isEmailVerified: true,
      isActive: true,
    });
    mentor2Id = mentor2._id.toString();

    // Create test employer
    const employer = await User.create({
      fullName: 'Employer One',
      email: 'employer@test-chat.com',
      phone: '+1234567821',
      password: 'Password@123',
      role: UserRole.EMPLOYER,
      isEmailVerified: true,
      isActive: true,
    });

    // Create test super admin
    const superAdmin = await User.create({
      fullName: 'Super Admin',
      email: 'admin@test-chat.com',
      phone: '+1234567831',
      password: 'Password@123',
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    // Generate JWT tokens using jwtConfig
    student1Token = jwtConfig.generateAccessToken({
      userId: student1Id,
      email: student1.email,
      role: student1.role,
    });

    student2Token = jwtConfig.generateAccessToken({
      userId: student2Id,
      email: student2.email,
      role: student2.role,
    });

    mentor1Token = jwtConfig.generateAccessToken({
      userId: mentor1Id,
      email: mentor1.email,
      role: mentor1.role,
    });

    mentor2Token = jwtConfig.generateAccessToken({
      userId: mentor2Id,
      email: mentor2.email,
      role: mentor2.role,
    });

    employerToken = jwtConfig.generateAccessToken({
      userId: employer._id.toString(),
      email: employer.email,
      role: employer.role,
    });

    superAdminToken = jwtConfig.generateAccessToken({
      userId: superAdmin._id.toString(),
      email: superAdmin.email,
      role: superAdmin.role,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test-chat\.com$/ });
    await ChatMessage.deleteMany({});
    await MentorSession.deleteMany({});
    await MentorProfile.deleteMany({});
    await Batch.deleteMany({});
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Route-level Authentication & RBAC Authorization', () => {
    it('should reject unauthenticated request with 401', async () => {
      const response = await request(app).get(`/api/v1/chats/messages/${mentor1Id}`);
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthorized role (EMPLOYER) with 403 FORBIDDEN', async () => {
      const response = await request(app)
        .get(`/api/v1/chats/messages/${student1Id}`)
        .set('Authorization', `Bearer ${employerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Request Validation & Peer Role Verification', () => {
    it('should reject invalid receiver ID format with 400', async () => {
      const response = await request(app)
        .get('/api/v1/chats/messages/invalid-object-id')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid receiver ID format');
    });

    it('should reject attempt to chat with oneself with 400', async () => {
      const response = await request(app)
        .get(`/api/v1/chats/messages/${student1Id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('yourself');
    });

    it('should reject non-existent receiver with 404', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/v1/chats/messages/${nonExistentId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject student attempting to chat with another student with 403', async () => {
      const response = await request(app)
        .get(`/api/v1/chats/messages/${student2Id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN_PEER_ROLE');
    });

    it('should reject mentor attempting to chat with another mentor with 403', async () => {
      const response = await request(app)
        .get(`/api/v1/chats/messages/${mentor2Id}`)
        .set('Authorization', `Bearer ${mentor1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN_PEER_ROLE');
    });
  });

  describe('Conversation Participant Verification', () => {
    it('should reject student accessing messages with unconnected mentor (no session/batch/messages)', async () => {
      const response = await request(app)
        .get(`/api/v1/chats/messages/${mentor2Id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONVERSATION_ACCESS_DENIED');
    });

    it('should allow chat history and message sending when MentorSession is booked', async () => {
      // Create booked session between student1 and mentor1
      await MentorSession.create({
        studentUserId: new mongoose.Types.ObjectId(student1Id),
        mentorUserId: new mongoose.Types.ObjectId(mentor1Id),
        topic: 'System Design 1:1',
        scheduledDate: new Date(),
        timeSlot: '10:00 AM',
        status: 'scheduled',
      });

      // GET chat history should now succeed
      const getResponse = await request(app)
        .get(`/api/v1/chats/messages/${mentor1Id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(Array.isArray(getResponse.body.data.messages)).toBe(true);

      // POST message should also succeed
      const postResponse = await request(app)
        .post('/api/v1/chats/messages')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          receiverId: mentor1Id,
          message: 'Hello mentor, looking forward to our session!',
        });

      expect(postResponse.status).toBe(201);
      expect(postResponse.body.success).toBe(true);
      expect(postResponse.body.data.message.message).toBe(
        'Hello mentor, looking forward to our session!'
      );
    });

    it('should allow mentor to view chat history with student who has existing messages', async () => {
      const response = await request(app)
        .get(`/api/v1/chats/messages/${student1Id}`)
        .set('Authorization', `Bearer ${mentor1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messages.length).toBeGreaterThan(0);
    });

    it('should allow student and mentor connected via Cohort Batch enrollment', async () => {
      // Create test course and batch assigned to mentor2
      const course = await Course.create({
        title: 'Batch Linked Course',
        slug: 'batch-linked-course',
        description: 'Test course description',
        duration: 20,
        lessonsCount: 5,
        price: 0,
        category: 'Web Development',
        level: 'Beginner',
        instructor: { name: 'Mentor Two' },
        isPublished: true,
      });

      const mentorProfile2 = await MentorProfile.create({
        userId: new mongoose.Types.ObjectId(mentor2Id),
        bio: 'Lead Architect with cloud systems experience.',
        currentOrganization: 'GrowthCraft',
        experienceYears: 7,
        areaOfExpertise: 'DevOps & Cloud',
        totalSessions: 0,
      });

      const batch = await Batch.create({
        batchType: BatchType.COURSE,
        courseId: course._id,
        code: 'BATCH-M2-001',
        assignedMentorId: mentorProfile2._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 30),
        capacity: 25,
        fee: 0,
        mode: BatchMode.ONLINE,
      });

      // Enroll student2 in this batch
      await Enrollment.create({
        studentUserId: new mongoose.Types.ObjectId(student2Id),
        batchId: batch._id,
        status: EnrollmentStatus.CONFIRMED,
        feeQuoted: mongoose.Types.Decimal128.fromString('0.00'),
        feeCollected: mongoose.Types.Decimal128.fromString('0.00'),
      });

      // student2 should now be authorized to chat with mentor2
      const response = await request(app)
        .get(`/api/v1/chats/messages/${mentor2Id}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow Super Admin to access any chat history', async () => {
      const response = await request(app)
        .get(`/api/v1/chats/messages/${student1Id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
