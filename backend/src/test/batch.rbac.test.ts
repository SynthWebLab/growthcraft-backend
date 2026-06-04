import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '@/app';
import { User, Batch, BatchType, BatchMode, Course } from '@/database/models';
import { UserRole } from '@/common/constants/user.constants';

describe('GC-S402-T4: Batch RBAC Tests', () => {
  let studentToken: string;
  let mentorToken: string;
  let opsToken: string;
  let superAdminToken: string;
  let courseId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft_test');

    // Clean up collections
    await User.deleteMany({});
    await Batch.deleteMany({});
    await Course.deleteMany({});

    // Create test course
    const course = await Course.create({
      title: 'RBAC Test Course',
      slug: 'rbac-test-course',
      description: 'Test course for RBAC',
      duration: 30,
      lessonsCount: 10,
      price: 0,
      category: 'Programming',
      level: 'Beginner',
      instructor: {
        name: 'Test Instructor',
        avatar: 'test-avatar.png',
      },
      isPublished: true,
    });
    courseId = course._id as mongoose.Types.ObjectId;

    // Create test users with different roles
    const studentUser = await User.create({
      fullName: 'Student User',
      email: 'student@test.com',
      phone: '+1234567890',
      password: 'Password@123',
      role: UserRole.STUDENT,
      isEmailVerified: true,
      isActive: true,
    });

    const mentorUser = await User.create({
      fullName: 'Mentor User',
      email: 'mentor@test.com',
      phone: '+1234567891',
      password: 'Password@123',
      role: UserRole.MENTOR,
      isEmailVerified: true,
      isActive: true,
    });

    const opsUser = await User.create({
      fullName: 'Ops User',
      email: 'ops@test.com',
      phone: '+1234567892',
      password: 'Password@123',
      role: UserRole.OPS,
      isEmailVerified: true,
      isActive: true,
    });

    const superAdminUser = await User.create({
      fullName: 'SuperAdmin User',
      email: 'superadmin@test.com',
      phone: '+1234567893',
      password: 'Password@123',
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    // Generate JWT tokens
    const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

    studentToken = jwt.sign(
      {
        userId: studentUser._id.toString(),
        email: studentUser.email,
        role: studentUser.role,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    mentorToken = jwt.sign(
      {
        userId: mentorUser._id.toString(),
        email: mentorUser.email,
        role: mentorUser.role,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    opsToken = jwt.sign(
      {
        userId: opsUser._id.toString(),
        email: opsUser.email,
        role: opsUser.role,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    superAdminToken = jwt.sign(
      {
        userId: superAdminUser._id.toString(),
        email: superAdminUser.email,
        role: superAdminUser.role,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Batch.deleteMany({});
    await Course.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/v1/admin/batches - Create Batch', () => {
    const validBatchData = {
      batchType: BatchType.COURSE,
      parentId: '',
      startDate: '2026-07-01',
      endDate: '2026-08-01',
      capacity: 30,
      fee: 1000,
      mode: BatchMode.ONLINE,
      venue: 'Online Platform',
    };

    beforeAll(() => {
      validBatchData.parentId = courseId.toString();
    });

    it('should allow OPS user to create batch', async () => {
      const response = await request(app)
        .post('/api/v1/admin/batches')
        .set('Authorization', `Bearer ${opsToken}`)
        .send(validBatchData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batch).toBeDefined();
    });

    it('should allow SUPER_ADMIN user to create batch', async () => {
      const response = await request(app)
        .post('/api/v1/admin/batches')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validBatchData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batch).toBeDefined();
    });

    it('should reject STUDENT user from creating batch', async () => {
      const response = await request(app)
        .post('/api/v1/admin/batches')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(validBatchData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toContain('permission');
    });

    it('should reject MENTOR user from creating batch', async () => {
      const response = await request(app)
        .post('/api/v1/admin/batches')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send(validBatchData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toContain('permission');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/v1/admin/batches')
        .send(validBatchData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/admin/batches')
        .set('Authorization', 'Bearer invalid-token-xyz')
        .send(validBatchData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/admin/batches/:id - Update Batch', () => {
    let batchId: string;

    beforeEach(async () => {
      // Create a batch for testing
      const batch = await Batch.create({
        batchType: BatchType.COURSE,
        courseId: courseId,
        code: 'TEST-BATCH-' + Date.now(),
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-08-01'),
        capacity: 30,
        fee: 1000,
        mode: BatchMode.ONLINE,
      });
      batchId = batch._id.toString();
    });

    afterEach(async () => {
      await Batch.deleteMany({});
    });

    it('should allow OPS user to update batch', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/batches/${batchId}`)
        .set('Authorization', `Bearer ${opsToken}`)
        .send({ venue: 'Updated Venue' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batch.venue).toBe('Updated Venue');
    });

    it('should allow SUPER_ADMIN user to update batch', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/batches/${batchId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ capacity: 50 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batch.capacity).toBe(50);
    });

    it('should reject STUDENT user from updating batch', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/batches/${batchId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ venue: 'Hacked Venue' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject MENTOR user from updating batch', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/batches/${batchId}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ venue: 'Hacked Venue' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('PATCH /api/v1/admin/batches/:id/mentor - Assign Mentor', () => {
    let batchId: string;
    let mentorProfileId: string;

    beforeEach(async () => {
      // Import MentorProfile at runtime to avoid circular dependencies
      const { MentorProfile } = await import('@/database/models');
      
      // Create a batch for testing
      const batch = await Batch.create({
        batchType: BatchType.COURSE,
        courseId: courseId,
        code: 'TEST-BATCH-' + Date.now(),
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-08-01'),
        capacity: 30,
        fee: 1000,
        mode: BatchMode.ONLINE,
      });
      batchId = batch._id.toString();

      // Create mentor profile
      const mentorProfile = await MentorProfile.create({
        userId: new mongoose.Types.ObjectId(),
        experienceYears: 5,
        areaOfExpertise: 'Web Development',
        currentOrganization: 'Test Organization',
        bio: 'Test mentor for RBAC testing',
        isVerified: true,
      });
      mentorProfileId = mentorProfile._id.toString();
    });

    afterEach(async () => {
      const { MentorProfile } = await import('@/database/models');
      await Batch.deleteMany({});
      await MentorProfile.deleteMany({});
    });

    it('should allow OPS user to assign mentor', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/batches/${batchId}/mentor`)
        .set('Authorization', `Bearer ${opsToken}`)
        .send({ mentorId: mentorProfileId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batch.assignedMentorId).toBe(mentorProfileId);
    });

    it('should allow SUPER_ADMIN user to assign mentor', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/batches/${batchId}/mentor`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ mentorId: mentorProfileId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batch.assignedMentorId).toBe(mentorProfileId);
    });

    it('should reject STUDENT user from assigning mentor', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/batches/${batchId}/mentor`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ mentorId: mentorProfileId });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject MENTOR user from assigning mentor', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/batches/${batchId}/mentor`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ mentorId: mentorProfileId });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/admin/batches - List Batches', () => {
    it('should allow OPS user to list batches', async () => {
      const response = await request(app)
        .get('/api/v1/admin/batches')
        .set('Authorization', `Bearer ${opsToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should allow SUPER_ADMIN user to list batches', async () => {
      const response = await request(app)
        .get('/api/v1/admin/batches')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should reject STUDENT user from listing batches', async () => {
      const response = await request(app)
        .get('/api/v1/admin/batches')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject MENTOR user from listing batches', async () => {
      const response = await request(app)
        .get('/api/v1/admin/batches')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/admin/batches/:id - Get Batch by ID', () => {
    let batchId: string;

    beforeAll(async () => {
      const batch = await Batch.create({
        batchType: BatchType.COURSE,
        courseId: courseId,
        code: 'TEST-BATCH-GET-' + Date.now(),
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-08-01'),
        capacity: 30,
        fee: 1000,
        mode: BatchMode.ONLINE,
      });
      batchId = batch._id.toString();
    });

    it('should allow OPS user to get batch by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/batches/${batchId}`)
        .set('Authorization', `Bearer ${opsToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batch).toBeDefined();
    });

    it('should allow SUPER_ADMIN user to get batch by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/batches/${batchId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batch).toBeDefined();
    });

    it('should reject STUDENT user from getting batch by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/batches/${batchId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject MENTOR user from getting batch by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/batches/${batchId}`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});
