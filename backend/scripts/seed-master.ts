import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import {
  User,
  StudentProfile,
  CollegeProfile,
  EmployerProfile,
  MentorProfile,
  Course,
  Batch,
  Enrollment,
  MentorCheckIn,
  MentorPayout,
  AuditLog,
  EnrollmentStatus,
  BatchType,
  BatchMode,
  BatchStatus,
} from '../src/database/models';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string, error?: any) => console.error(`[ERROR] ${msg}`, error || ''),
};

async function seedMaster() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft';
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // 1. Clear existing database collections related to this scope
    logger.info('Cleaning collections...');
    const collectionsToClear = [
      User,
      StudentProfile,
      CollegeProfile,
      EmployerProfile,
      MentorProfile,
      Course,
      Batch,
      Enrollment,
      MentorCheckIn,
      MentorPayout,
      AuditLog,
    ];
    for (const model of collectionsToClear) {
      await model.deleteMany({});
    }
    logger.info('✓ Collections cleaned');

    // 2. Default password for all seeded users
    const defaultPassword = 'GrowthCraft@123';

    // 3. Create Users & Profiles
    logger.info('Seeding administrative users...');
    
    // SuperAdmin
    const superAdmin = await User.create({
      fullName: 'Super Admin',
      phone: '1234567890',
      email: 'admin@growthcraft.com',
      password: defaultPassword,
      role: 'super_admin',
      isEmailVerified: true,
      isActive: true,
    });
    logger.info(`✓ Super Admin created: ${superAdmin.email}`);

    // Ops
    const ops = await User.create({
      fullName: 'Operations Manager',
      phone: '1234567891',
      email: 'ops@growthcraft.com',
      password: defaultPassword,
      role: 'ops',
      isEmailVerified: true,
      isActive: true,
    });
    logger.info(`✓ Ops Manager created: ${ops.email}`);

    // Mentor
    const mentorUser = await User.create({
      fullName: 'Siddharth Sharma',
      phone: '1234567892',
      email: 'mentor@growthcraft.com',
      password: defaultPassword,
      role: 'mentor',
      isEmailVerified: true,
      isActive: true,
    });
    const mentorProfile = await MentorProfile.create({
      userId: mentorUser._id,
      experienceYears: 8,
      areaOfExpertise: 'Web Development',
      currentOrganization: 'SynthWeb Technologies',
      bio: 'Ex-Google Full Stack Engineer specializing in Node.js, React, and MongoDB.',
      hourlyRate: 1500,
      isVerified: true,
      totalHoursMentored: 45,
      totalPayouts: 18000,
      pendingPayout: 12000,
      specializations: ['Web Development', 'DevOps & Cloud'],
      availabilityCalendar: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', isAvailable: true },
        { dayOfWeek: 3, startTime: '14:00', endTime: '18:00', isAvailable: true },
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true },
      ],
      rating: 4.8,
      totalSessions: 12,
    });
    logger.info(`✓ Mentor user and profile created: ${mentorUser.email}`);

    // College Manager
    const collegeUser = await User.create({
      fullName: 'College Coordinator',
      phone: '1234567893',
      email: 'college@growthcraft.com',
      password: defaultPassword,
      role: 'college',
      isEmailVerified: true,
      isActive: true,
    });
    const collegeProfile = await CollegeProfile.create({
      userId: collegeUser._id,
      collegeName: 'IIT Bombay',
      partnershipTier: 'Gold',
      partnershipActive: true,
      registeredStudents: [],
      address: {
        street: 'IIT Area, Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400076',
      },
      contactPerson: {
        name: 'IITB Placement Officer',
        designation: 'Placement Coordinator',
        email: 'placement@iitb.ac.in',
        phone: '1234567890',
      },
    });
    logger.info(`✓ College coordinator created: ${collegeUser.email}`);

    // Hiring Partner (Employer)
    const employerUser = await User.create({
      fullName: 'Hiring Partner',
      phone: '1234567894',
      email: 'employer@growthcraft.com',
      password: defaultPassword,
      role: 'employer',
      isEmailVerified: true,
      isActive: true,
    });
    const employerProfile = await EmployerProfile.create({
      userId: employerUser._id,
      companyName: 'SynthWeb',
      contactPerson: {
        name: 'HR Team',
        email: 'hr@synthweb.in',
        phone: '1234567894',
      },
      industry: 'IT/Software',
      companySize: '1-50',
      website: 'https://synthweb.com',
      isVerified: true,
    });
    logger.info(`✓ Employer created: ${employerUser.email}`);

    // 4. Seeding Courses
    logger.info('Seeding courses...');
    const webDevCourse = await Course.create({
      title: 'Full Stack Web Development',
      slug: 'full-stack-web-development',
      description: 'Master HTML, CSS, JavaScript, Node.js, Express, React, and MongoDB.',
      shortDescription: 'From basics to production deployments.',
      price: 49999,
      discountedPrice: 24999,
      level: 'Intermediate',
      category: 'Web Development',
      isPublished: true,
      isFeatured: true,
    });

    const dataScienceCourse = await Course.create({
      title: 'Data Science & Applied AI',
      slug: 'data-science-ai',
      description: 'Learn Python, NumPy, Pandas, Scikit-Learn, TensorFlow, and PyTorch.',
      shortDescription: 'Solve real-world business problems with machine learning.',
      price: 59999,
      discountedPrice: 29999,
      level: 'Advanced',
      category: 'Data Science',
      isPublished: true,
    });

    logger.info(`✓ Seeding courses finished`);

    // 5. Seeding Batches
    logger.info('Seeding batches...');
    
    // Batch 1 (Open for course Web Dev)
    const batchWebOpen = await Batch.create({
      batchType: BatchType.COURSE,
      courseId: webDevCourse._id,
      code: 'FSWD-2026-B1',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
      mode: BatchMode.OFFLINE,
      capacity: 50,
      enrolledCount: 0,
      status: BatchStatus.OPEN,
      assignedMentorId: mentorProfile._id,
      assignedMentorIds: [mentorProfile._id],
      fee: mongoose.Types.Decimal128.fromString('24999.00'),
    });

    // Batch 2 (InProgress/Full for Data Science)
    const batchDataInProgress = await Batch.create({
      batchType: BatchType.COURSE,
      courseId: dataScienceCourse._id,
      code: 'DSAI-2026-B1',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 2 months from now
      mode: BatchMode.HYBRID,
      capacity: 5,
      enrolledCount: 0,
      status: BatchStatus.IN_PROGRESS,
      assignedMentorId: mentorProfile._id,
      assignedMentorIds: [mentorProfile._id],
      fee: mongoose.Types.Decimal128.fromString('29999.00'),
    });

    logger.info(`✓ Seeding batches finished`);

    // 6. Seeding Students & Enrollments
    logger.info('Seeding students & enrollments...');
    
    const studentsData = [
      { first: 'Aarav', last: 'Mehta', email: 'aarav@student.com', phone: '1234567895' },
      { first: 'Ananya', last: 'Iyer', email: 'ananya@student.com', phone: '1234567896' },
      { first: 'Kabir', last: 'Singh', email: 'kabir@student.com', phone: '1234567897' },
      { first: 'Diya', last: 'Patel', email: 'diya@student.com', phone: '1234567898' },
      { first: 'Vihaan', last: 'Sharma', email: 'vihaan@student.com', phone: '1234567899' },
      { first: 'Sandipan', last: 'Goswami', email: 'sandipangoswami28@gmail.com', phone: '9999999999' },
    ];

    for (const student of studentsData) {
      const u = await User.create({
        fullName: `${student.first} ${student.last}`,
        phone: student.phone,
        email: student.email,
        password: defaultPasswordHash,
        role: 'student',
        isEmailVerified: true,
        isActive: true,
      });

      const sp = await StudentProfile.create({
        userId: u._id,
        collegeName: 'IIT Bombay',
        degree: 'B.Tech',
        branch: 'Computer Science',
        yearOfStudy: 3,
        enrolledCourses: [webDevCourse._id],
      });

      // Enroll in Batch 1 (Open for Web Dev)
      await Enrollment.create({
        studentUserId: u._id,
        batchId: batchWebOpen._id,
        status: EnrollmentStatus.CONFIRMED,
        feeQuoted: mongoose.Types.Decimal128.fromString('24999.00'),
        feeCollected: mongoose.Types.Decimal128.fromString('24999.00'),
        attendancePercent: 88,
        avgRubricScore: 90,
      });
      await Batch.findByIdAndUpdate(batchWebOpen._id, { $inc: { enrolledCount: 1 } });

      // Enroll in Batch 2 (InProgress)
      await Enrollment.create({
        studentUserId: u._id,
        batchId: batchDataInProgress._id,
        status: EnrollmentStatus.CONFIRMED,
        feeQuoted: mongoose.Types.Decimal128.fromString('29999.00'),
        feeCollected: mongoose.Types.Decimal128.fromString('29999.00'),
        attendancePercent: 95,
        avgRubricScore: 85,
      });
      await Batch.findByIdAndUpdate(batchDataInProgress._id, { $inc: { enrolledCount: 1 } });
    }

    logger.info(`✓ Seeding students & enrollments finished`);

    // 7. Seeding Mentor Check-ins
    logger.info('Seeding mentor check-ins...');
    
    // Check-in 1: Verified
    await MentorCheckIn.create({
      mentorId: mentorUser._id,
      batchId: batchWebOpen._id,
      sessionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      checkInTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000), // 4 hours session
      checkOutTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      hoursWorked: 4,
      status: 'checked-out',
      notes: 'Covered HTML forms and validation basics.',
      verifiedBy: superAdmin._id,
    });

    // Check-in 2: Unverified/Pending
    await MentorCheckIn.create({
      mentorId: mentorUser._id,
      batchId: batchWebOpen._id,
      sessionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      checkInTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000),
      checkOutTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      hoursWorked: 3,
      status: 'checked-out',
      notes: 'React hook form and Shadcn UI demo.',
      verifiedBy: null,
    });

    logger.info(`✓ Seeding mentor check-ins finished`);

    // 8. Seeding Payouts
    logger.info('Seeding payouts...');
    
    const payout1 = await MentorPayout.create({
      mentorId: mentorUser._id,
      amount: 18000,
      period: 'May 2026',
      hoursForPeriod: 15,
      hourlyRate: 1200,
      batchIds: [batchWebOpen._id],
      status: 'processed',
      processedBy: superAdmin._id,
      notes: 'Standard bank transfer.',
      processedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    });

    logger.info(`✓ Seeding payouts finished`);

    // 9. Seeding Audit Logs
    logger.info('Seeding audit logs...');
    
    const auditLogs = [
      { action: 'batch.create', target: batchWebOpen._id.toString(), changes: { code: 'FSWD-2026-B1' } },
      { action: 'batch.create', target: batchDataInProgress._id.toString(), changes: { code: 'DSAI-2026-B1' } },
      { action: 'course.publish', target: webDevCourse._id.toString(), changes: { title: 'Full Stack Web Development' } },
      { action: 'mentor.checkin.verify', target: 'MentorCheckInRec', changes: { mentorId: mentorUser._id, hours: 4 } },
      { action: 'mentor.payout.record', target: mentorUser._id.toString(), changes: { amount: 18000, period: 'May 2026' } },
    ];

    for (const log of auditLogs) {
      await AuditLog.create({
        performedBy: superAdmin._id,
        action: log.action,
        target: log.target,
        changes: log.changes,
        ip: '127.0.0.1',
        timestamp: new Date(),
      });
    }

    logger.info(`✓ Seeding audit logs finished`);

    logger.info('\n=== Master Database Seeding Complete ===');
    logger.info('\nAdmin Credentials:');
    logger.info('  Email: admin@growthcraft.com / Password: GrowthCraft@123');
    logger.info('\nOps Credentials:');
    logger.info('  Email: ops@growthcraft.com / Password: GrowthCraft@123');
    logger.info('\nMentor Credentials:');
    logger.info('  Email: mentor@growthcraft.com / Password: GrowthCraft@123');

  } catch (error) {
    logger.error('Error seeding master database:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

seedMaster()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
