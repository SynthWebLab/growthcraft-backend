import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI not found in environment');
  process.exit(1);
}

async function runTest() {
  console.log('Connecting to database:', mongoUri);
  await mongoose.connect(mongoUri);

  try {
    const { User } = await import('@/database/models/User.model');
    const { MentorProfile } = await import('@/database/models/MentorProfile.model');
    const { Course } = await import('@/database/models/Course.model');
    const { Batch } = await import('@/database/models/Batch.model');
    const { Enrollment } = await import('@/database/models/Enrollment.model');
    const { CourseEnrollment } = await import('@/database/models/CourseEnrollment.model');
    const { studentDashboardService } = await import('@/modules/students/services/student-dashboard.service');

    console.log('Cleaning up any existing test data...');
    await User.deleteMany({ email: /test-student|test-mentor/ });
    await Course.deleteMany({ title: /Test Course/ });
    await Batch.deleteMany({ code: /TEST-BATCH/ });

    console.log('Creating test student...');
    const studentUser = await User.create({
      firstName: 'Test',
      lastName: 'Student',
      fullName: 'Test Student',
      email: 'test-student@growthcraft.com',
      password: 'Password@123',
      phone: '1234567890',
      role: 'student',
      isEmailVerified: true
    });

    console.log('Creating Mentor A (Batch assigned)...');
    const mentorUserA = await User.create({
      firstName: 'Mentor',
      lastName: 'A',
      fullName: 'Mentor A',
      email: 'test-mentor-a@growthcraft.com',
      password: 'Password@123',
      phone: '1234567891',
      role: 'mentor',
      isEmailVerified: true
    });

    const mentorProfileA = await MentorProfile.create({
      userId: mentorUserA._id,
      experienceYears: 5,
      areaOfExpertise: 'Web Development',
      currentOrganization: 'Test Org A',
      bio: 'Bio A',
      rating: 4.5
    });

    console.log('Creating Mentor B (Course assigned)...');
    const mentorUserB = await User.create({
      firstName: 'Mentor',
      lastName: 'B',
      fullName: 'Mentor B',
      email: 'test-mentor-b@growthcraft.com',
      password: 'Password@123',
      phone: '1234567892',
      role: 'mentor',
      isEmailVerified: true
    });

    const mentorProfileB = await MentorProfile.create({
      userId: mentorUserB._id,
      experienceYears: 7,
      areaOfExpertise: 'Data Science & AI',
      currentOrganization: 'Test Org B',
      bio: 'Bio B',
      rating: 4.8
    });

    console.log('Creating Test Course...');
    const course = await Course.create({
      slug: 'test-course-mentors-api',
      title: 'Test Course Mentors API',
      description: 'A course for testing mentors api',
      category: 'Web Development',
      difficultyLevel: 'Beginner',
      duration: 10,
      lessonsCount: 5,
      price: 100,
      instructor: { name: 'Instructor' },
      isPublished: true,
      mentors: [
        {
          userId: mentorUserB._id,
          mentorProfileId: mentorProfileB._id,
          name: 'Mentor B',
          designation: 'Course Mentor'
        }
      ]
    });

    console.log('Enrolling student in Test Course...');
    await CourseEnrollment.create({
      userId: studentUser._id,
      courseId: course._id,
      fullName: studentUser.fullName,
      email: studentUser.email,
      phone: '1234567890',
      title: course.title,
      status: 'confirmed',
      paymentStatus: 'completed'
    });

    console.log('Creating Test Batch...');
    const batch = await Batch.create({
      batchType: 'Course',
      courseId: course._id,
      code: 'TEST-BATCH-123',
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      mode: 'Online',
      capacity: 10,
      status: 'Open',
      assignedMentorId: mentorProfileA._id,
      fee: mongoose.Types.Decimal128.fromString('100.00')
    });

    console.log('Enrolling student in Test Batch...');
    await Enrollment.create({
      studentUserId: studentUser._id,
      batchId: batch._id,
      status: 'Confirmed',
      feeQuoted: mongoose.Types.Decimal128.fromString('100.00'),
      feeCollected: mongoose.Types.Decimal128.fromString('100.00')
    });

    console.log('Calling studentDashboardService.getMentors...');
    const mentors = await studentDashboardService.getMentors(studentUser._id.toString());

    console.log('Retrieved mentors:', mentors.map((m: any) => ({
      id: m._id,
      name: (m.userId as any)?.fullName,
      email: (m.userId as any)?.email
    })));

    // Verify expectations
    const mentorIds = mentors.map((m: any) => m._id.toString());
    const hasA = mentorIds.includes(mentorProfileA._id.toString());
    const hasB = mentorIds.includes(mentorProfileB._id.toString());

    if (hasA && hasB && mentors.length === 2) {
      console.log('🎉 SUCCESS: Both batch-assigned (Mentor A) and course-assigned (Mentor B) mentors were returned, and no duplicates!');
    } else {
      console.error('❌ FAILURE: Incorrect mentors returned.', { hasA, hasB, length: mentors.length });
    }

    console.log('Calling studentDashboardService.getBatches...');
    const batches = await studentDashboardService.getBatches(studentUser._id.toString());
    console.log('Retrieved batches:', JSON.stringify(batches, null, 2));

    if (batches.length > 0 && batches[0].mentorName === 'Mentor A') {
      console.log('🎉 SUCCESS: Batch mentor name populated correctly as Mentor A!');
    } else {
      console.error('❌ FAILURE: Batch mentor name is not populated correctly.', batches[0]?.mentorName);
    }

    // Now test duplicate handling (Mentor A is also added to the course mentors)
    console.log('Adding Mentor A to course mentors to test duplicate elimination...');
    await Course.updateOne(
      { _id: course._id },
      {
        $push: {
          mentors: {
            userId: mentorUserA._id,
            mentorProfileId: mentorProfileA._id,
            name: 'Mentor A',
            designation: 'Course Mentor'
          }
        }
      }
    );

    const mentorsAfter = await studentDashboardService.getMentors(studentUser._id.toString());
    console.log('Mentors after adding Mentor A to course:', mentorsAfter.map((m: any) => ({
      id: m._id,
      name: (m.userId as any)?.fullName
    })));

    if (mentorsAfter.length === 2) {
      console.log('🎉 SUCCESS: Duplicate Mentor A was correctly eliminated, list size is still 2.');
    } else {
      console.error('❌ FAILURE: Duplicate elimination failed, list size is:', mentorsAfter.length);
    }

    // Clean up
    console.log('Cleaning up test data...');
    await User.deleteMany({ email: /test-student|test-mentor/ });
    await Course.deleteMany({ title: /Test Course/ });
    await Batch.deleteMany({ code: /TEST-BATCH/ });
    await Enrollment.deleteMany({ studentUserId: studentUser._id });
    await CourseEnrollment.deleteMany({ userId: studentUser._id });
    console.log('Done.');

  } catch (error) {
    console.error('Error during test execution:', error);
  } finally {
    await mongoose.connection.close();
  }
}

runTest();
