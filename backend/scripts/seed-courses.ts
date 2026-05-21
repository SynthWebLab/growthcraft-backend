import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Simple logger for seed script
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string, error?: any) => console.error(`[ERROR] ${msg}`, error || ''),
};

// Define Course schema inline for seeding
const courseSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  description: String,
  category: String,
  difficultyLevel: String,
  duration: Number,
  lessonsCount: Number,
  price: Number,
  originalPrice: Number,
  rating: Number,
  instructor: {
    name: String,
    avatar: String,
  },
  tags: [String],
  enrollmentCount: Number,
  isActive: Boolean,
  isDraft: Boolean,
  publishedAt: Date,
  type: String,
  bootcampDetails: {
    totalSeats: Number,
    availableSeats: Number,
    startDate: Date,
    endDate: Date,
    registrationDeadline: Date,
  },
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

const sampleCourses = [
  {
    title: 'JavaScript Zero to Hero',
    slug: 'javascript-zero-to-hero',
    description: 'The only JS course you need. Closures, async, DOM, ES6+, and 30+ hands-on projects',
    category: 'MERN',
    difficultyLevel: 'Beginner',
    duration: 70,
    lessonsCount: 52,
    price: 4499,
    originalPrice: 7999,
    rating: 4.9,
    instructor: {
      name: 'Ananya Iyer',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    tags: ['JavaScript', 'ES6', 'DOM', 'Async'],
    enrollmentCount: 1250,
    isActive: true,
    isDraft: false,
    publishedAt: new Date('2024-01-01'), // Already published
    type: 'Course',
  },
  {
    title: 'Full-Stack MERN Development',
    slug: 'full-stack-mern',
    description: 'Build production-grade apps with MongoDB, Express, React & Node.js. From REST APIs to deployment',
    category: 'MERN',
    difficultyLevel: 'Intermediate',
    duration: 120,
    lessonsCount: 84,
    price: 8999,
    originalPrice: 14999,
    rating: 4.8,
    instructor: {
      name: 'Arjun Mehta',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
    tags: ['MongoDB', 'Express', 'React', 'Node.js', 'REST API'],
    enrollmentCount: 2340,
    isActive: true,
    isDraft: false,
    publishedAt: new Date('2024-01-10'),
    type: 'Course',
  },
  {
    title: 'React & Next.js Mastery',
    slug: 'react-nextjs-mastery',
    description: 'Master modern React patterns, server components, and build performant web apps with Next.js',
    category: 'MERN',
    difficultyLevel: 'Intermediate',
    duration: 90,
    lessonsCount: 68,
    price: 7499,
    originalPrice: 12999,
    rating: 4.9,
    instructor: {
      name: 'Priya Sharma',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    tags: ['React', 'Next.js', 'TypeScript', 'Server Components'],
    enrollmentCount: 1890,
    isActive: true,
    isDraft: false,
    publishedAt: new Date('2024-01-05'),
    type: 'Course',
  },
  {
    title: 'Data Science with Python',
    slug: 'data-science-python',
    description: 'From pandas to production ML models. Covers statistics, visualization, and real-world datasets',
    category: 'DataScience',
    difficultyLevel: 'Intermediate',
    duration: 100,
    lessonsCount: 72,
    price: 7999,
    originalPrice: 13999,
    rating: 4.5,
    instructor: {
      name: 'Vikram Singh',
      avatar: 'https://i.pravatar.cc/150?img=13',
    },
    tags: ['Python', 'Pandas', 'Machine Learning', 'Data Visualization'],
    enrollmentCount: 1560,
    isActive: true,
    isDraft: false,
    publishedAt: new Date('2024-01-08'),
    type: 'Course',
  },
  {
    title: 'Node.js Backend Engineering',
    slug: 'nodejs-backend',
    description: 'Design scalable APIs, implement auth, caching, queues, and deploy microservices on AWS',
    category: 'MERN',
    difficultyLevel: 'Advanced',
    duration: 85,
    lessonsCount: 56,
    price: 6999,
    originalPrice: 11999,
    rating: 4.7,
    instructor: {
      name: 'Rahul Verma',
      avatar: 'https://i.pravatar.cc/150?img=14',
    },
    tags: ['Node.js', 'Express', 'AWS', 'Microservices', 'Redis'],
    enrollmentCount: 980,
    isActive: true,
    isDraft: false,
    publishedAt: new Date('2024-01-12'),
    type: 'Course',
  },
  {
    title: 'UI/UX Design for Developers',
    slug: 'uiux-for-devs',
    description: 'Learn Figma, design systems, user research, and ship beautiful interfaces that convert',
    category: 'UI/UX',
    difficultyLevel: 'Beginner',
    duration: 65,
    lessonsCount: 52,
    price: 5999,
    originalPrice: 9999,
    rating: 4.6,
    instructor: {
      name: 'Sneha Patel',
      avatar: 'https://i.pravatar.cc/150?img=9',
    },
    tags: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
    enrollmentCount: 1420,
    isActive: true,
    isDraft: false,
    publishedAt: new Date('2024-03-01'), // Future date - Coming Soon
    type: 'Course',
  },
  {
    title: 'MongoDB and Database Design',
    slug: 'mongodb-database-design',
    description: 'Design scalable MongoDB schemas, indexes, aggregations, and data models for production applications',
    category: 'MERN',
    difficultyLevel: 'Intermediate',
    duration: 60,
    lessonsCount: 44,
    price: 6499,
    originalPrice: 10999,
    rating: 4.8,
    instructor: {
      name: 'Amit Kumar',
      avatar: 'https://i.pravatar.cc/150?img=15',
    },
    tags: ['MongoDB', 'Database Design', 'Schema Design', 'Indexes', 'Aggregation'],
    enrollmentCount: 920,
    isActive: true,
    isDraft: false,
    publishedAt: new Date('2024-01-18'),
    type: 'Course',
  },
  {
    title: 'DevOps and Cloud Engineering',
    slug: 'devops-cloud-engineering',
    description: 'Master Docker, Kubernetes, CI/CD, AWS fundamentals, infrastructure automation, and cloud deployment workflows',
    category: 'DevOps',
    difficultyLevel: 'Advanced',
    duration: 95,
    lessonsCount: 64,
    price: 8999,
    originalPrice: 14999,
    rating: 4.7,
    instructor: {
      name: 'Meera Nair',
      avatar: 'https://i.pravatar.cc/150?img=26',
    },
    tags: ['DevOps', 'Cloud Engineering', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    enrollmentCount: 1180,
    isActive: true,
    isDraft: false,
    publishedAt: new Date('2024-01-22'),
    type: 'Course',
  },
  {
    title: 'Advanced TypeScript & System Design',
    slug: 'advanced-typescript-system-design',
    description: 'Master advanced TypeScript patterns, generics, decorators, and learn to design scalable distributed systems',
    category: 'MERN',
    difficultyLevel: 'Advanced',
    duration: 110,
    lessonsCount: 78,
    price: 9999,
    originalPrice: 16999,
    rating: 0, // No ratings yet since it's coming soon
    instructor: {
      name: 'Karan Malhotra',
      avatar: 'https://i.pravatar.cc/150?img=33',
    },
    tags: ['TypeScript', 'System Design', 'Advanced Patterns', 'Distributed Systems'],
    enrollmentCount: 0, // No enrollments yet
    isActive: true,
    isDraft: false,
    publishedAt: new Date('2026-07-01'), // Future date - Coming Soon!
    type: 'Course',
  },
];

async function seedCourses() {
  try {
    // Get MongoDB URI from environment
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft';
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing courses
    await Course.deleteMany({});
    logger.info('Cleared existing courses');

    // Insert sample courses
    const insertedCourses = await Course.insertMany(sampleCourses);
    logger.info(`Successfully seeded ${insertedCourses.length} courses`);

    // Display summary
    console.log('\n=== Courses Seeded Successfully ===');
    console.log(`Total courses: ${insertedCourses.length}`);
    console.log('\nCourses by category:');
    const categoryCounts = insertedCourses.reduce((acc: any, course) => {
      acc[course.category] = (acc[course.category] || 0) + 1;
      return acc;
    }, {});
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    console.log('\nCourses by difficulty:');
    const difficultyCounts = insertedCourses.reduce((acc: any, course) => {
      acc[course.difficultyLevel] = (acc[course.difficultyLevel] || 0) + 1;
      return acc;
    }, {});
    Object.entries(difficultyCounts).forEach(([level, count]) => {
      console.log(`  ${level}: ${count}`);
    });

    console.log('\n===================================\n');

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding courses:', error);
    process.exit(1);
  }
}

// Run the seed function
seedCourses();
