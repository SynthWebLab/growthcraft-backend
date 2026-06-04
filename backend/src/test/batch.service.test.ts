import mongoose from 'mongoose';
import { Batch, BatchStatus, BatchType, BatchMode, Notification, MentorProfile, Course } from '@/database/models';
import { batchService } from '@/modules/admin/services/batch.service';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';

describe('GC-S402-T4: Batch Service QA Tests', () => {
  let courseId: mongoose.Types.ObjectId;
  let mentorId: mongoose.Types.ObjectId;
  let batchId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft_test');
    
    // Clean up collections
    await Batch.deleteMany({});
    await Course.deleteMany({});
    await MentorProfile.deleteMany({});
    await Notification.deleteMany({});

    // Create a test course
    const course = await Course.create({
      title: 'Test Course for Batch QA',
      slug: 'test-course-batch-qa',
      description: 'Test course description',
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

    // Create a test mentor
    const mentor = await MentorProfile.create({
      userId: new mongoose.Types.ObjectId(),
      experienceYears: 5,
      areaOfExpertise: 'Web Development',
      currentOrganization: 'Test Organization',
      bio: 'Test mentor bio for QA testing',
      isVerified: true,
    });
    mentorId = mentor._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    // Clean up
    await Batch.deleteMany({});
    await Course.deleteMany({});
    await MentorProfile.deleteMany({});
    await Notification.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Status Transition Rules', () => {
    beforeEach(async () => {
      // Create a fresh batch for each test
      const batch = await batchService.createBatch({
        batchType: BatchType.COURSE,
        parentId: courseId.toString(),
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-08-01'),
        capacity: 30,
        fee: 1000,
        mode: BatchMode.ONLINE,
      });
      batchId = batch._id.toString();
    });

    afterEach(async () => {
      // Clean up after each test
      await Batch.deleteMany({});
    });

    it('should allow valid transition from Draft to Open', async () => {
      const updatedBatch = await batchService.updateBatch(batchId, {
        status: BatchStatus.OPEN,
      });

      expect(updatedBatch.status).toBe(BatchStatus.OPEN);
    });

    it('should allow valid transition from Open to Filling', async () => {
      await batchService.updateBatch(batchId, { status: BatchStatus.OPEN });
      
      const updatedBatch = await batchService.updateBatch(batchId, {
        status: BatchStatus.FILLING,
      });

      expect(updatedBatch.status).toBe(BatchStatus.FILLING);
    });

    it('should allow valid transition from Filling to Full', async () => {
      await batchService.updateBatch(batchId, { status: BatchStatus.OPEN });
      await batchService.updateBatch(batchId, { status: BatchStatus.FILLING });
      
      const updatedBatch = await batchService.updateBatch(batchId, {
        status: BatchStatus.FULL,
      });

      expect(updatedBatch.status).toBe(BatchStatus.FULL);
    });

    it('should allow valid transition from Full to InProgress', async () => {
      await batchService.updateBatch(batchId, { status: BatchStatus.OPEN });
      await batchService.updateBatch(batchId, { status: BatchStatus.FILLING });
      await batchService.updateBatch(batchId, { status: BatchStatus.FULL });
      
      const updatedBatch = await batchService.updateBatch(batchId, {
        status: BatchStatus.IN_PROGRESS,
      });

      expect(updatedBatch.status).toBe(BatchStatus.IN_PROGRESS);
    });

    it('should allow valid transition from InProgress to Completed', async () => {
      await batchService.updateBatch(batchId, { status: BatchStatus.OPEN });
      await batchService.updateBatch(batchId, { status: BatchStatus.FILLING });
      await batchService.updateBatch(batchId, { status: BatchStatus.FULL });
      await batchService.updateBatch(batchId, { status: BatchStatus.IN_PROGRESS });
      
      const updatedBatch = await batchService.updateBatch(batchId, {
        status: BatchStatus.COMPLETED,
      });

      expect(updatedBatch.status).toBe(BatchStatus.COMPLETED);
    });

    it('should reject invalid transition from Draft to Completed', async () => {
      await expect(
        batchService.updateBatch(batchId, {
          status: BatchStatus.COMPLETED,
        })
      ).rejects.toThrow(ValidationError);

      try {
        await batchService.updateBatch(batchId, {
          status: BatchStatus.COMPLETED,
        });
      } catch (error: any) {
        expect(error.message).toContain('Validation failed');
        expect(error.errors[0].message).toContain('Invalid status transition from Draft to Completed');
      }
    });

    it('should reject invalid transition from Draft to Filling', async () => {
      await expect(
        batchService.updateBatch(batchId, {
          status: BatchStatus.FILLING,
        })
      ).rejects.toThrow(ValidationError);

      try {
        await batchService.updateBatch(batchId, {
          status: BatchStatus.FILLING,
        });
      } catch (error: any) {
        expect(error.errors[0].message).toContain('Invalid status transition from Draft to Filling');
      }
    });

    it('should reject invalid transition from Open to Full', async () => {
      await batchService.updateBatch(batchId, { status: BatchStatus.OPEN });

      await expect(
        batchService.updateBatch(batchId, {
          status: BatchStatus.FULL,
        })
      ).rejects.toThrow(ValidationError);

      try {
        await batchService.updateBatch(batchId, {
          status: BatchStatus.FULL,
        });
      } catch (error: any) {
        expect(error.errors[0].message).toContain('Invalid status transition from Open to Full');
      }
    });

    it('should reject invalid transition from Filling to InProgress', async () => {
      await batchService.updateBatch(batchId, { status: BatchStatus.OPEN });
      await batchService.updateBatch(batchId, { status: BatchStatus.FILLING });

      await expect(
        batchService.updateBatch(batchId, {
          status: BatchStatus.IN_PROGRESS,
        })
      ).rejects.toThrow(ValidationError);

      try {
        await batchService.updateBatch(batchId, {
          status: BatchStatus.IN_PROGRESS,
        });
      } catch (error: any) {
        expect(error.errors[0].message).toContain('Invalid status transition from Filling to InProgress');
      }
    });

    it('should allow transition to Cancelled from any status except Cancelled', async () => {
      // From Draft
      let batch = await batchService.updateBatch(batchId, {
        status: BatchStatus.CANCELLED,
      });
      expect(batch.status).toBe(BatchStatus.CANCELLED);

      // Create new batch for next test
      batch = await batchService.createBatch({
        batchType: BatchType.COURSE,
        parentId: courseId.toString(),
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-08-01'),
        capacity: 30,
        fee: 1000,
        mode: BatchMode.ONLINE,
        code: 'TEST-BATCH-CANCEL-' + Date.now(), // Unique code
      });

      // From Open
      await batchService.updateBatch(batch._id.toString(), { status: BatchStatus.OPEN });
      batch = await batchService.updateBatch(batch._id.toString(), {
        status: BatchStatus.CANCELLED,
      });
      expect(batch.status).toBe(BatchStatus.CANCELLED);
    });

    it('should reject any transition from Cancelled status', async () => {
      await batchService.updateBatch(batchId, { status: BatchStatus.CANCELLED });

      await expect(
        batchService.updateBatch(batchId, {
          status: BatchStatus.OPEN,
        })
      ).rejects.toThrow(ValidationError);

      try {
        await batchService.updateBatch(batchId, {
          status: BatchStatus.OPEN,
        });
      } catch (error: any) {
        expect(error.errors[0].message).toContain('Invalid status transition from Cancelled to Open');
      }
    });
  });

  describe('Mentor Assignment Notification', () => {
    beforeEach(async () => {
      // Clean notifications before each test
      await Notification.deleteMany({});
      await Batch.deleteMany({});

      // Create a fresh batch
      const batch = await batchService.createBatch({
        batchType: BatchType.COURSE,
        parentId: courseId.toString(),
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-08-01'),
        capacity: 30,
        fee: 1000,
        mode: BatchMode.ONLINE,
      });
      batchId = batch._id.toString();
    });

    it('should create exactly ONE notification when mentor is assigned', async () => {
      const notificationCountBefore = await Notification.countDocuments({
        userId: mentorId,
        type: 'batch.assigned',
      });
      expect(notificationCountBefore).toBe(0);

      await batchService.assignMentor(batchId, mentorId.toString());

      const notificationCountAfter = await Notification.countDocuments({
        userId: mentorId,
        type: 'batch.assigned',
      });
      expect(notificationCountAfter).toBe(1);
    });

    it('should create notification with correct data structure', async () => {
      await batchService.assignMentor(batchId, mentorId.toString());

      const notification = await Notification.findOne({
        userId: mentorId,
        type: 'batch.assigned',
      });

      expect(notification).toBeDefined();
      expect(notification!.type).toBe('batch.assigned');
      expect(notification!.userId.toString()).toBe(mentorId.toString());
      expect(notification!.data).toBeDefined();
      expect(notification!.data!.batchId).toBeDefined();
      expect(notification!.data!.batchCode).toBeDefined();
      expect(notification!.data!.startDate).toBeDefined();
      expect(notification!.data!.endDate).toBeDefined();
      expect(notification!.data!.batchType).toBe(BatchType.COURSE);
    });

    it('should create new notification on reassignment to different mentor', async () => {
      // Create second mentor
      const mentor2 = await MentorProfile.create({
        userId: new mongoose.Types.ObjectId(),
        experienceYears: 3,
        areaOfExpertise: 'Data Science & AI',
        currentOrganization: 'Test Organization 2',
        bio: 'Test mentor 2 bio for QA testing',
        isVerified: true,
      });

      // Assign first mentor
      await batchService.assignMentor(batchId, mentorId.toString());
      
      const notifCountMentor1 = await Notification.countDocuments({
        userId: mentorId,
        type: 'batch.assigned',
      });
      expect(notifCountMentor1).toBe(1);

      // Reassign to second mentor
      await batchService.assignMentor(batchId, mentor2._id.toString());
      
      const notifCountMentor2 = await Notification.countDocuments({
        userId: mentor2._id,
        type: 'batch.assigned',
      });
      expect(notifCountMentor2).toBe(1);

      // First mentor should still have 1 notification (not incremented)
      const notifCountMentor1After = await Notification.countDocuments({
        userId: mentorId,
        type: 'batch.assigned',
      });
      expect(notifCountMentor1After).toBe(1);

      // Clean up
      await MentorProfile.deleteOne({ _id: mentor2._id });
    });

    it('should not create duplicate notifications when assigning same mentor twice', async () => {
      // Assign mentor first time
      await batchService.assignMentor(batchId, mentorId.toString());
      
      const notifCountAfterFirst = await Notification.countDocuments({
        userId: mentorId,
        type: 'batch.assigned',
      });
      expect(notifCountAfterFirst).toBe(1);

      // Assign same mentor again (reassignment)
      await batchService.assignMentor(batchId, mentorId.toString());
      
      // Should create a new notification (business logic: every assignment is notified)
      const notifCountAfterSecond = await Notification.countDocuments({
        userId: mentorId,
        type: 'batch.assigned',
      });
      expect(notifCountAfterSecond).toBe(2);
    });

    it('should reject assignment with invalid mentor ID', async () => {
      const invalidMentorId = new mongoose.Types.ObjectId().toString();

      await expect(
        batchService.assignMentor(batchId, invalidMentorId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should reject assignment with invalid batch ID', async () => {
      const invalidBatchId = new mongoose.Types.ObjectId().toString();

      await expect(
        batchService.assignMentor(invalidBatchId, mentorId.toString())
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Capacity Validation', () => {
    beforeEach(async () => {
      await Batch.deleteMany({});
    });

    it('should reject capacity update less than enrolled count', async () => {
      const batch = await batchService.createBatch({
        batchType: BatchType.COURSE,
        parentId: courseId.toString(),
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-08-01'),
        capacity: 30,
        fee: 1000,
        mode: BatchMode.ONLINE,
      });

      // Manually set enrolled count (simulating enrollments)
      await Batch.findByIdAndUpdate(batch._id, { enrolledCount: 10 });

      await expect(
        batchService.updateBatch(batch._id.toString(), {
          capacity: 5,
        })
      ).rejects.toThrow(ValidationError);

      try {
        await batchService.updateBatch(batch._id.toString(), {
          capacity: 5,
        });
      } catch (error: any) {
        expect(error.errors[0].message).toContain('Capacity cannot be less than enrolled count');
      }
    });

    it('should allow capacity update equal to enrolled count', async () => {
      const batch = await batchService.createBatch({
        batchType: BatchType.COURSE,
        parentId: courseId.toString(),
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-08-01'),
        capacity: 30,
        fee: 1000,
        mode: BatchMode.ONLINE,
      });

      await Batch.findByIdAndUpdate(batch._id, { enrolledCount: 10 });

      const updatedBatch = await batchService.updateBatch(batch._id.toString(), {
        capacity: 10,
      });

      expect(updatedBatch.capacity).toBe(10);
    });

    it('should allow capacity update greater than enrolled count', async () => {
      const batch = await batchService.createBatch({
        batchType: BatchType.COURSE,
        parentId: courseId.toString(),
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-08-01'),
        capacity: 30,
        fee: 1000,
        mode: BatchMode.ONLINE,
      });

      await Batch.findByIdAndUpdate(batch._id, { enrolledCount: 10 });

      const updatedBatch = await batchService.updateBatch(batch._id.toString(), {
        capacity: 50,
      });

      expect(updatedBatch.capacity).toBe(50);
    });
  });
});
