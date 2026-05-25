/**
 * Seed script for bootcamps
 * Populates the database with sample bootcamp data
 * 
 * Usage:
 *   npm run seed:bootcamps
 */

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

// Import Bootcamp model (will use existing connection)
import { Bootcamp } from '../src/database/models/Bootcamp.model';

const bootcampsData = [
  {
    title: 'Full-Stack MERN Bootcamp — Batch 7',
    slug: 'mern-bootcamp-batch-7',
    description: 'Master the MERN stack with hands-on projects. Build production-ready web applications using MongoDB, Express, React, and Node.js. Includes deployment on AWS and real-world capstone projects.',
    banner: '/placeholder.svg',
    category: 'MERN',
    startDate: new Date('2026-05-15'),
    endDate: new Date('2026-08-15'),
    registrationDeadline: new Date('2026-05-10'),
    maxSeats: 40,
    enrolledCount: 31,
    price: 24999,
    originalPrice: 34999,
    mode: 'Hybrid',
    skillsCovered: ['React', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'AWS'],
    mentorNames: ['Arjun Mehta', 'Priya Sharma', 'Rohit Verma'],
    status: 'Open',
    rating: 4.9,
    tags: ['MERN', 'Full-Stack', 'JavaScript', 'React', 'Node.js'],
    isActive: true,
    publishedAt: new Date('2026-03-01'),
  },
  {
    title: 'Data Science Immersive — Batch 3',
    slug: 'data-science-batch-3',
    description: 'Comprehensive data science bootcamp covering Python, machine learning, deep learning, and data visualization. Work on real datasets and build a portfolio of data science projects.',
    banner: '/placeholder.svg',
    category: 'DataScience',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-09-01'),
    registrationDeadline: new Date('2026-05-25'),
    maxSeats: 30,
    enrolledCount: 22,
    price: 29999,
    originalPrice: 39999,
    mode: 'Online',
    skillsCovered: ['Python', 'Pandas', 'Scikit-learn', 'TensorFlow', 'SQL', 'Tableau'],
    mentorNames: ['Vikram Singh', 'Sneha Patel'],
    status: 'Open',
    rating: 4.8,
    tags: ['Data Science', 'Python', 'Machine Learning', 'AI'],
    isActive: true,
    publishedAt: new Date('2026-03-15'),
  },
  {
    title: 'DevOps Engineering Bootcamp',
    slug: 'devops-bootcamp',
    description: 'Learn modern DevOps practices including CI/CD, containerization, orchestration, and cloud infrastructure. Hands-on experience with Docker, Kubernetes, Jenkins, and AWS.',
    banner: '/placeholder.svg',
    category: 'DevOps',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-06-30'),
    registrationDeadline: new Date('2026-03-25'),
    maxSeats: 25,
    enrolledCount: 25,
    price: 19999,
    originalPrice: 27999,
    mode: 'Online',
    skillsCovered: ['Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Terraform'],
    mentorNames: ['Karan Gupta'],
    status: 'Closed',
    rating: 4.7,
    tags: ['DevOps', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    isActive: true,
    publishedAt: new Date('2026-02-01'),
  },
  {
    title: 'UI/UX Design Sprint',
    slug: 'uiux-design-sprint',
    description: 'Intensive UI/UX design bootcamp covering user research, wireframing, prototyping, and design systems. Master Figma and build a professional design portfolio.',
    banner: '/placeholder.svg',
    category: 'UI/UX',
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-04-30'),
    registrationDeadline: new Date('2026-02-25'),
    maxSeats: 35,
    enrolledCount: 35,
    price: 14999,
    originalPrice: 21999,
    mode: 'Offline',
    skillsCovered: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    mentorNames: ['Sneha Patel', 'Ananya Iyer'],
    status: 'Completed',
    rating: 4.9,
    tags: ['UI/UX', 'Design', 'Figma', 'User Experience'],
    isActive: true,
    publishedAt: new Date('2026-01-15'),
  },
  {
    title: 'Cloud Architecture Bootcamp — AWS',
    slug: 'aws-cloud-architecture',
    description: 'Become an AWS certified cloud architect. Learn to design scalable, secure, and cost-effective cloud solutions. Includes hands-on labs and real-world scenarios.',
    banner: '/placeholder.svg',
    category: 'DevOps',
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-09-30'),
    registrationDeadline: new Date('2026-06-25'),
    maxSeats: 30,
    enrolledCount: 12,
    price: 27999,
    originalPrice: 37999,
    mode: 'Hybrid',
    skillsCovered: ['AWS', 'Cloud Architecture', 'EC2', 'S3', 'Lambda', 'CloudFormation'],
    mentorNames: ['Rajesh Kumar', 'Amit Desai'],
    status: 'Open',
    rating: 4.8,
    tags: ['AWS', 'Cloud', 'Architecture', 'DevOps'],
    isActive: true,
    publishedAt: new Date('2026-04-01'),
  },
  {
    title: 'Mobile App Development — React Native',
    slug: 'react-native-bootcamp',
    description: 'Build cross-platform mobile apps with React Native. Learn iOS and Android development, state management, navigation, and app deployment.',
    banner: '/placeholder.svg',
    category: 'MERN',
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-10-31'),
    registrationDeadline: new Date('2026-07-25'),
    maxSeats: 35,
    enrolledCount: 8,
    price: 22999,
    originalPrice: 31999,
    mode: 'Online',
    skillsCovered: ['React Native', 'JavaScript', 'iOS', 'Android', 'Redux', 'Firebase'],
    mentorNames: ['Priya Sharma', 'Arjun Mehta'],
    status: 'Open',
    rating: 4.7,
    tags: ['React Native', 'Mobile', 'iOS', 'Android', 'JavaScript'],
    isActive: true,
    publishedAt: new Date('2026-05-01'),
  },
  {
    title: 'Blockchain Development Bootcamp',
    slug: 'blockchain-bootcamp',
    description: 'Learn blockchain technology, smart contracts, and DApp development. Build decentralized applications using Ethereum, Solidity, and Web3.js.',
    banner: '/placeholder.svg',
    category: 'Other',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-11-30'),
    registrationDeadline: new Date('2026-08-25'),
    maxSeats: 25,
    enrolledCount: 25,
    price: 32999,
    originalPrice: 44999,
    mode: 'Online',
    skillsCovered: ['Blockchain', 'Ethereum', 'Solidity', 'Web3.js', 'Smart Contracts'],
    mentorNames: ['Vikram Singh', 'Karan Gupta'],
    status: 'Open',
    rating: 4.6,
    tags: ['Blockchain', 'Ethereum', 'Web3', 'Cryptocurrency'],
    isActive: true,
    publishedAt: new Date('2026-06-01'),
  },
  {
    title: 'Cybersecurity Fundamentals Bootcamp',
    slug: 'cybersecurity-bootcamp',
    description: 'Master cybersecurity essentials including network security, ethical hacking, penetration testing, and security best practices.',
    banner: '/placeholder.svg',
    category: 'Other',
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-12-31'),
    registrationDeadline: new Date('2026-09-25'),
    maxSeats: 30,
    enrolledCount: 3,
    price: 26999,
    originalPrice: 36999,
    mode: 'Hybrid',
    skillsCovered: ['Network Security', 'Ethical Hacking', 'Penetration Testing', 'Linux', 'Python'],
    mentorNames: ['Rajesh Kumar', 'Amit Desai'],
    status: 'Open',
    rating: 4.8,
    tags: ['Cybersecurity', 'Ethical Hacking', 'Security', 'Networking'],
    isActive: true,
    publishedAt: new Date('2026-07-01'),
  },
];

async function seedBootcamps() {
  try {
    console.log('🚀 Starting bootcamp seeding...\n');

    // Get MongoDB URI from environment
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft';
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing bootcamps
    console.log('🗑️  Clearing existing bootcamps...');
    const deleteResult = await Bootcamp.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} existing bootcamps\n`);

    // Insert new bootcamps
    console.log('📝 Inserting new bootcamps...');
    const insertedBootcamps = await Bootcamp.insertMany(bootcampsData);
    console.log(`   Inserted ${insertedBootcamps.length} bootcamps\n`);

    // Display summary
    console.log('📊 Seeding Summary:');
    console.log('===================');
    
    const statusCounts = await Bootcamp.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    
    statusCounts.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count} bootcamps`);
    });

    const modeCounts = await Bootcamp.aggregate([
      { $group: { _id: '$mode', count: { $sum: 1 } } },
    ]);
    
    console.log('\n   By Mode:');
    modeCounts.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count} bootcamps`);
    });

    const categoryCounts = await Bootcamp.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    
    console.log('\n   By Category:');
    categoryCounts.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count} bootcamps`);
    });

    console.log('\n✅ Bootcamp seeding completed successfully!\n');
    console.log('🔗 Test the API:');
    console.log('   GET http://localhost:5000/api/v1/bootcamps');
    console.log('   GET http://localhost:5000/api/v1/bootcamps?status=Open');
    console.log('   GET http://localhost:5000/api/v1/bootcamps?mode=Hybrid\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedBootcamps();
