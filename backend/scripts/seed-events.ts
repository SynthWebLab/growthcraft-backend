/**
 * Seed script for Events (Bootcamps, Workshops, Hackathons)
 * 
 * This script populates the database with sample events matching the frontend mock data.
 * It creates events in the Bootcamp collection with different types.
 * 
 * Usage: npx ts-node scripts/seed-events.ts
 */

import mongoose from 'mongoose';
import { Bootcamp, EventType } from '../src/database/models/Bootcamp.model';
import { config } from '../src/config';
import { logger } from '../src/common/utils/logger.util';

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Workshop seed data (matching frontend mocks)
const workshopSeeds = [
  {
    title: 'React Performance Optimization',
    slug: 'react-performance-optimization',
    type: EventType.WORKSHOP,
    description: 'Master React performance patterns, profiling tools, and optimization techniques to build lightning-fast applications.',
    domain: 'Web Development',
    durationDays: 1,
    keyTopics: ['React', 'Chrome DevTools', 'Lighthouse', 'React Profiler'],
    startDate: new Date('2026-06-15T10:00:00Z'),
    endDate: new Date('2026-06-15T16:00:00Z'),
    maxSeats: 50,
    enrolledCount: 32,
    price: 2999,
    originalPrice: 3999,
    mode: 'Online' as const,
    status: 'Open' as const,
    isPublished: true,
    isActive: true,
    publishedAt: new Date('2026-05-01'),
    skillsCovered: ['React', 'Chrome DevTools', 'Lighthouse', 'React Profiler'],
    mentorNames: ['Arjun Mehta', 'Priya Sharma'],
    category: 'Web Development',
    tags: ['React', 'Performance', 'Optimization', 'Web Development'],
    rating: 4.7,
    banner: '/images/workshops/react-performance.jpg',
  },
  {
    title: 'Git Mastery Workshop',
    slug: 'git-mastery-workshop',
    type: EventType.WORKSHOP,
    description: 'From basics to advanced Git workflows, branching strategies, and collaboration best practices.',
    domain: 'Developer Tools',
    durationDays: 1,
    keyTopics: ['Git', 'GitHub', 'GitLab', 'Terminal'],
    startDate: new Date('2026-06-20T14:00:00Z'),
    endDate: new Date('2026-06-20T18:00:00Z'),
    maxSeats: 100,
    enrolledCount: 100,
    price: 1999,
    originalPrice: 2499,
    mode: 'Online' as const,
    status: 'Open' as const,
    isPublished: true,
    isActive: true,
    publishedAt: new Date('2026-05-10'),
    skillsCovered: ['Git', 'GitHub', 'GitLab', 'Terminal'],
    mentorNames: ['Vikram Singh'],
    category: 'Developer Tools',
    tags: ['Git', 'Version Control', 'GitHub', 'Developer Tools'],
    rating: 4.8,
    banner: '/images/workshops/git-mastery.jpg',
  },
  {
    title: 'Docker Fundamentals',
    slug: 'docker-fundamentals',
    type: EventType.WORKSHOP,
    description: 'Learn containerization, Docker Compose, and deployment strategies for modern applications.',
    domain: 'DevOps',
    durationDays: 1,
    keyTopics: ['Docker', 'Docker Compose', 'Kubernetes', 'Linux'],
    startDate: new Date('2026-07-05T09:00:00Z'),
    endDate: new Date('2026-07-05T17:00:00Z'),
    maxSeats: 30,
    enrolledCount: 30,
    price: 3499,
    originalPrice: 4499,
    mode: 'Offline' as const,
    status: 'Closed' as const,
    isPublished: true,
    isActive: true,
    publishedAt: new Date('2026-05-15'),
    skillsCovered: ['Docker', 'Docker Compose', 'Kubernetes', 'Linux'],
    mentorNames: ['Karan Gupta', 'Deepak Sharma'],
    category: 'DevOps',
    tags: ['Docker', 'Containerization', 'DevOps', 'Kubernetes'],
    rating: 4.9,
    banner: '/images/workshops/docker-fundamentals.jpg',
  },
  {
    title: 'TypeScript Deep Dive',
    slug: 'typescript-deep-dive',
    type: EventType.WORKSHOP,
    description: 'Advanced TypeScript patterns, generics, utility types, and best practices for enterprise applications.',
    domain: 'Programming Languages',
    durationDays: 1,
    keyTopics: ['TypeScript', 'VS Code', 'TSConfig', 'Type Guards'],
    startDate: new Date('2026-07-10T13:00:00Z'),
    endDate: new Date('2026-07-10T18:00:00Z'),
    maxSeats: 75,
    enrolledCount: 45,
    price: 2499,
    originalPrice: 3299,
    mode: 'Online' as const,
    status: 'Open' as const,
    isPublished: true,
    isActive: true,
    publishedAt: new Date('2026-05-20'),
    skillsCovered: ['TypeScript', 'VS Code', 'TSConfig', 'Type Guards'],
    mentorNames: ['Rohit Verma', 'Ananya Iyer'],
    category: 'Programming Languages',
    tags: ['TypeScript', 'JavaScript', 'Programming', 'Web Development'],
    rating: 4.6,
    banner: '/images/workshops/typescript-deep-dive.jpg',
  },
  {
    title: 'SQL Query Optimization',
    slug: 'sql-query-optimization',
    type: EventType.WORKSHOP,
    description: 'Learn indexing, query planning, and performance tuning for PostgreSQL and MySQL databases.',
    domain: 'Database Management',
    durationDays: 1,
    keyTopics: ['PostgreSQL', 'MySQL', 'EXPLAIN', 'Indexing'],
    startDate: new Date('2026-05-18T09:00:00Z'),
    endDate: new Date('2026-05-18T13:00:00Z'),
    maxSeats: 40,
    enrolledCount: 38,
    price: 2799,
    originalPrice: 3499,
    mode: 'Hybrid' as const,
    status: 'Completed' as const,
    isPublished: true,
    isActive: true,
    publishedAt: new Date('2026-04-01'),
    skillsCovered: ['PostgreSQL', 'MySQL', 'EXPLAIN', 'Indexing'],
    mentorNames: ['Rajesh Kumar', 'Lakshmi Iyer'],
    category: 'Database Management',
    tags: ['SQL', 'Database', 'PostgreSQL', 'MySQL', 'Performance'],
    rating: 4.8,
    banner: '/images/workshops/sql-optimization.jpg',
  },
];

// Hackathon seed data (matching frontend mocks)
const hackathonSeeds = [
  {
    title: 'Build-a-thon 2026',
    slug: 'build-a-thon-2026',
    type: EventType.HACKATHON,
    description: '48-hour coding marathon to build innovative solutions. Team up, code, and win exciting prizes!',
    domain: 'Full Stack Development',
    durationDays: 2,
    keyTopics: ['React', 'Node.js', 'MongoDB', 'Docker', 'AWS'],
    startDate: new Date('2026-08-10T18:00:00Z'),
    endDate: new Date('2026-08-12T18:00:00Z'),
    maxSeats: 200,
    enrolledCount: 145,
    price: 0, // Free
    mode: 'Online' as const,
    status: 'Open' as const,
    isPublished: true,
    isActive: true,
    publishedAt: new Date('2026-06-01'),
    skillsCovered: ['React', 'Node.js', 'MongoDB', 'Docker', 'AWS'],
    mentorNames: ['Arjun Mehta', 'Vikram Singh', 'Priya Sharma'],
    category: 'Full Stack Development',
    tags: ['Hackathon', 'Full Stack', 'React', 'Node.js', 'Competition'],
    rating: 4.9,
    banner: '/images/hackathons/build-a-thon-2026.jpg',
  },
  {
    title: 'AI Innovation Challenge',
    slug: 'ai-innovation-challenge',
    type: EventType.HACKATHON,
    description: '24-hour AI/ML hackathon focused on solving real-world problems with artificial intelligence.',
    domain: 'AI & Machine Learning',
    durationDays: 1,
    keyTopics: ['Python', 'TensorFlow', 'PyTorch', 'OpenAI', 'Hugging Face'],
    startDate: new Date('2026-09-05T09:00:00Z'),
    endDate: new Date('2026-09-06T09:00:00Z'),
    maxSeats: 150,
    enrolledCount: 150,
    price: 0, // Free
    mode: 'Online' as const,
    status: 'Open' as const,
    isPublished: true,
    isActive: true,
    publishedAt: new Date('2026-06-15'),
    skillsCovered: ['Python', 'TensorFlow', 'PyTorch', 'OpenAI', 'Hugging Face'],
    mentorNames: ['Dr. Suresh Reddy', 'Anita Joshi', 'Vikram Singh'],
    category: 'AI & Machine Learning',
    tags: ['Hackathon', 'AI', 'Machine Learning', 'Python', 'Competition'],
    rating: 4.8,
    banner: '/images/hackathons/ai-innovation-challenge.jpg',
  },
  {
    title: 'Web3 Hack Fest',
    slug: 'web3-hack-fest',
    type: EventType.HACKATHON,
    description: '72-hour blockchain hackathon to build decentralized applications and smart contracts.',
    domain: 'Blockchain & Web3',
    durationDays: 3,
    keyTopics: ['Solidity', 'Ethereum', 'React', 'Web3.js', 'Hardhat'],
    startDate: new Date('2026-09-20T12:00:00Z'),
    endDate: new Date('2026-09-23T12:00:00Z'),
    maxSeats: 100,
    enrolledCount: 100,
    price: 0, // Free
    mode: 'Offline' as const,
    status: 'Closed' as const,
    isPublished: true,
    isActive: true,
    publishedAt: new Date('2026-07-01'),
    skillsCovered: ['Solidity', 'Ethereum', 'React', 'Web3.js', 'Hardhat'],
    mentorNames: ['Manish Agarwal', 'Priyanka Singh'],
    category: 'Blockchain & Web3',
    tags: ['Hackathon', 'Blockchain', 'Web3', 'Ethereum', 'Solidity'],
    rating: 4.7,
    banner: '/images/hackathons/web3-hack-fest.jpg',
  },
  {
    title: 'Code for Good Marathon',
    slug: 'code-for-good-marathon',
    type: EventType.HACKATHON,
    description: '48-hour social impact hackathon to build tech solutions for NGOs and social causes.',
    domain: 'Social Impact Tech',
    durationDays: 2,
    keyTopics: ['React', 'Node.js', 'PostgreSQL', 'Flutter', 'Firebase'],
    startDate: new Date('2026-10-10T08:00:00Z'),
    endDate: new Date('2026-10-12T08:00:00Z'),
    maxSeats: 120,
    enrolledCount: 78,
    price: 0, // Free
    mode: 'Hybrid' as const,
    status: 'Open' as const,
    isPublished: true,
    isFeatured: true,
    isActive: true,
    publishedAt: new Date('2026-07-15'),
    skillsCovered: ['React', 'Node.js', 'PostgreSQL', 'Flutter', 'Firebase'],
    mentorNames: ['Sneha Patel', 'Rahul Jain', 'Neha Kapoor'],
    category: 'Social Impact Tech',
    tags: ['Hackathon', 'Social Impact', 'NGO', 'Full Stack', 'Mobile'],
    rating: 4.9,
    banner: '/images/hackathons/code-for-good.jpg',
  },
  {
    title: 'Mobile App Hackfest',
    slug: 'mobile-app-hackfest',
    type: EventType.HACKATHON,
    description: '36-hour mobile app development competition. Build the next big app and win big!',
    domain: 'Mobile Development',
    durationDays: 2,
    keyTopics: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase'],
    startDate: new Date('2026-04-25T10:00:00Z'),
    endDate: new Date('2026-04-27T22:00:00Z'),
    maxSeats: 180,
    enrolledCount: 165,
    price: 0, // Free
    mode: 'Online' as const,
    status: 'Completed' as const,
    isPublished: true,
    isActive: true,
    publishedAt: new Date('2026-03-01'),
    skillsCovered: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase'],
    mentorNames: ['Sanjay Verma', 'Pooja Desai', 'Vikrant Mehta'],
    category: 'Mobile Development',
    tags: ['Hackathon', 'Mobile', 'React Native', 'Flutter', 'Competition'],
    rating: 4.8,
    banner: '/images/hackathons/mobile-app-hackfest.jpg',
  },
];

// Main seed function
const seedEvents = async () => {
  try {
    logger.info('Starting event seeding...');

    // Clear existing workshops and hackathons (optional - comment out if you want to keep existing data)
    const deleteResult = await Bootcamp.deleteMany({
      type: { $in: [EventType.WORKSHOP, EventType.HACKATHON] },
    });
    logger.info(`Deleted ${deleteResult.deletedCount} existing workshops and hackathons`);

    // Insert workshops
    logger.info('Seeding workshops...');
    const workshops = await Bootcamp.insertMany(workshopSeeds);
    logger.info(`✓ Created ${workshops.length} workshops`);

    // Insert hackathons
    logger.info('Seeding hackathons...');
    const hackathons = await Bootcamp.insertMany(hackathonSeeds);
    logger.info(`✓ Created ${hackathons.length} hackathons`);

    // Summary
    logger.info('\n=== Seeding Summary ===');
    logger.info(`Workshops created: ${workshops.length}`);
    logger.info(`Hackathons created: ${hackathons.length}`);
    logger.info(`Total events created: ${workshops.length + hackathons.length}`);
    logger.info('======================\n');

    // Display sample IDs for testing
    logger.info('Sample Event IDs for testing:');
    if (workshops.length > 0) {
      logger.info(`Workshop (Open): ${workshops[0]._id} - ${workshops[0].title}`);
    }
    if (hackathons.length > 0) {
      logger.info(`Hackathon (Open): ${hackathons[0]._id} - ${hackathons[0].title}`);
    }

    logger.info('\n✓ Event seeding completed successfully!');
  } catch (error) {
    logger.error('Event seeding failed:', error);
    throw error;
  }
};

// Run the seed script
const run = async () => {
  try {
    await connectDB();
    await seedEvents();
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Seed script failed:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (require.main === module) {
  run();
}

export { seedEvents };
