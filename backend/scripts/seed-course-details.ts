/**
 * Seed script for Course Modules, FAQs, and Batches
 * 
 * This script populates sample data for:
 * - Course Modules (curriculum)
 * - Course FAQs
 * - Course Batches (upcoming cohorts)
 * 
 * Usage:
 *   npm run seed:course-details
 * 
 * Or with ts-node:
 *   npx ts-node scripts/seed-course-details.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from '../src/database/models/Course.model';
import { CourseModule } from '../src/database/models/CourseModule.model';
import { CourseFAQ } from '../src/database/models/CourseFAQ.model';
import { CourseBatch } from '../src/database/models/CourseBatch.model';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft';

async function seedCourseDetails() {
  try {
    console.log('🌱 Starting course details seeding...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a sample course (or use the first active course)
    const course = await Course.findOne({ isActive: true, isDraft: false }).exec();

    if (!course) {
      console.log('❌ No active published courses found. Please seed courses first.');
      console.log('   Run: npm run seed:courses\n');
      process.exit(1);
    }

    console.log(`📚 Found course: ${course.title} (${course.slug})\n`);

    // Clear existing data for this course
    await Promise.all([
      CourseModule.deleteMany({ courseId: course._id }),
      CourseFAQ.deleteMany({ courseId: course._id }),
      CourseBatch.deleteMany({ courseId: course._id }),
    ]);
    console.log('🗑️  Cleared existing modules, FAQs, and batches\n');

    // Seed Modules
    console.log('📖 Seeding course modules...');
    const modules = [
      {
        courseId: course._id,
        title: 'Introduction and Fundamentals',
        description: 'Get started with the basics and set up your development environment',
        order: 1,
        lessons: [
          {
            title: 'Welcome to the Course',
            duration: 10,
            isFree: true,
            order: 1,
          },
          {
            title: 'Setting Up Your Development Environment',
            duration: 20,
            isFree: true,
            order: 2,
          },
          {
            title: 'Understanding the Basics',
            duration: 30,
            isFree: false,
            order: 3,
          },
          {
            title: 'Your First Project',
            duration: 45,
            isFree: false,
            order: 4,
          },
        ],
        isActive: true,
      },
      {
        courseId: course._id,
        title: 'Core Concepts',
        description: 'Master the fundamental concepts and principles',
        order: 2,
        lessons: [
          {
            title: 'Data Structures Overview',
            duration: 35,
            isFree: false,
            order: 1,
          },
          {
            title: 'Working with Functions',
            duration: 40,
            isFree: false,
            order: 2,
          },
          {
            title: 'Object-Oriented Programming',
            duration: 50,
            isFree: false,
            order: 3,
          },
        ],
        isActive: true,
      },
      {
        courseId: course._id,
        title: 'Advanced Topics',
        description: 'Dive deep into advanced concepts and best practices',
        order: 3,
        lessons: [
          {
            title: 'Asynchronous Programming',
            duration: 45,
            isFree: false,
            order: 1,
          },
          {
            title: 'Design Patterns',
            duration: 55,
            isFree: false,
            order: 2,
          },
          {
            title: 'Performance Optimization',
            duration: 40,
            isFree: false,
            order: 3,
          },
        ],
        isActive: true,
      },
      {
        courseId: course._id,
        title: 'Real-World Projects',
        description: 'Build production-ready applications',
        order: 4,
        lessons: [
          {
            title: 'Project Planning and Architecture',
            duration: 30,
            isFree: false,
            order: 1,
          },
          {
            title: 'Building the Backend',
            duration: 90,
            isFree: false,
            order: 2,
          },
          {
            title: 'Creating the Frontend',
            duration: 90,
            isFree: false,
            order: 3,
          },
          {
            title: 'Testing and Deployment',
            duration: 60,
            isFree: false,
            order: 4,
          },
        ],
        isActive: true,
      },
    ];

    const createdModules = await CourseModule.insertMany(modules);
    console.log(`✅ Created ${createdModules.length} modules\n`);

    // Seed FAQs
    console.log('❓ Seeding course FAQs...');
    const faqs = [
      {
        courseId: course._id,
        question: 'Do I need prior programming experience?',
        answer: 'No, this course is designed for complete beginners. We start from the very basics and gradually build up to advanced concepts. However, basic computer literacy is recommended.',
        order: 1,
        isActive: true,
      },
      {
        courseId: course._id,
        question: 'How long do I have access to the course?',
        answer: 'You get lifetime access to all course materials, including future updates. Once you enroll, you can learn at your own pace without any time restrictions.',
        order: 2,
        isActive: true,
      },
      {
        courseId: course._id,
        question: 'Is there a certificate upon completion?',
        answer: 'Yes, you will receive a certificate of completion after finishing all modules and passing the final assessment. The certificate is recognized by industry partners.',
        order: 3,
        isActive: true,
      },
      {
        courseId: course._id,
        question: 'What if I miss a live session?',
        answer: 'All live sessions are recorded and made available within 24 hours. You can watch them at your convenience and ask questions in the discussion forum.',
        order: 4,
        isActive: true,
      },
      {
        courseId: course._id,
        question: 'Do you offer refunds?',
        answer: 'Yes, we offer a 30-day money-back guarantee. If you are not satisfied with the course for any reason, you can request a full refund within 30 days of enrollment.',
        order: 5,
        isActive: true,
      },
      {
        courseId: course._id,
        question: 'Will I get job placement assistance?',
        answer: 'Yes, we provide comprehensive job placement assistance including resume review, mock interviews, and connections with our hiring partners.',
        order: 6,
        isActive: true,
      },
    ];

    const createdFAQs = await CourseFAQ.insertMany(faqs);
    console.log(`✅ Created ${createdFAQs.length} FAQs\n`);

    // Seed Batches (upcoming cohorts)
    console.log('📅 Seeding course batches...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create dates for upcoming batches
    const batch1Start = new Date(today);
    batch1Start.setDate(today.getDate() + 15); // Starts in 15 days
    const batch1End = new Date(batch1Start);
    batch1End.setDate(batch1Start.getDate() + 90); // 90-day course
    const batch1Deadline = new Date(batch1Start);
    batch1Deadline.setDate(batch1Start.getDate() - 5); // Registration closes 5 days before

    const batch2Start = new Date(today);
    batch2Start.setDate(today.getDate() + 45); // Starts in 45 days
    const batch2End = new Date(batch2Start);
    batch2End.setDate(batch2Start.getDate() + 90);
    const batch2Deadline = new Date(batch2Start);
    batch2Deadline.setDate(batch2Start.getDate() - 5);

    const batch3Start = new Date(today);
    batch3Start.setDate(today.getDate() + 75); // Starts in 75 days
    const batch3End = new Date(batch3Start);
    batch3End.setDate(batch3Start.getDate() + 90);
    const batch3Deadline = new Date(batch3Start);
    batch3Deadline.setDate(batch3Start.getDate() - 5);

    const batches = [
      {
        courseId: course._id,
        batchName: `${getMonthName(batch1Start)} ${batch1Start.getFullYear()} Cohort`,
        startDate: batch1Start,
        endDate: batch1End,
        registrationDeadline: batch1Deadline,
        maxSeats: 50,
        enrolledCount: 32,
        status: 'Open',
        instructorName: course.instructor.name,
        schedule: 'Mon-Wed-Fri, 6 PM - 8 PM IST',
        isActive: true,
      },
      {
        courseId: course._id,
        batchName: `${getMonthName(batch2Start)} ${batch2Start.getFullYear()} Cohort`,
        startDate: batch2Start,
        endDate: batch2End,
        registrationDeadline: batch2Deadline,
        maxSeats: 50,
        enrolledCount: 15,
        status: 'Filling',
        instructorName: course.instructor.name,
        schedule: 'Tue-Thu-Sat, 7 PM - 9 PM IST',
        isActive: true,
      },
      {
        courseId: course._id,
        batchName: `${getMonthName(batch3Start)} ${batch3Start.getFullYear()} Cohort`,
        startDate: batch3Start,
        endDate: batch3End,
        registrationDeadline: batch3Deadline,
        maxSeats: 50,
        enrolledCount: 5,
        status: 'Open',
        instructorName: 'Guest Instructor',
        schedule: 'Mon-Wed-Fri, 8 PM - 10 PM IST',
        isActive: true,
      },
    ];

    const createdBatches = await CourseBatch.insertMany(batches);
    console.log(`✅ Created ${createdBatches.length} batches\n`);

    // Summary
    console.log('📊 Seeding Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Course: ${course.title}`);
    console.log(`Modules: ${createdModules.length}`);
    console.log(`FAQs: ${createdFAQs.length}`);
    console.log(`Batches: ${createdBatches.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Course details seeding completed successfully!\n');
    console.log('🧪 Test the endpoint:');
    console.log(`   curl http://localhost:5000/api/v1/courses/${course.slug}\n`);

  } catch (error) {
    console.error('❌ Error seeding course details:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

function getMonthName(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[date.getMonth()];
}

// Run the seeding function
seedCourseDetails();
