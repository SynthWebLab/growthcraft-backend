/**
 * Complete Bootcamp Seed Script
 * Seeds all 13 bootcamps matching the frontend mock data
 * 
 * Usage: npm run seed:all-bootcamps
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

// All 13 bootcamps from frontend mock
const bootcampSeeds = [
  {
    title: 'Full-Stack MERN Bootcamp — Batch 7',
    slug: 'mern-bootcamp-batch-7',
    type: EventType.BOOTCAMP,
    description: 'Master the MERN stack with hands-on projects. Build production-ready web applications using MongoDB, Express, React, and Node.js. Includes deployment on AWS and real-world capstone projects.',
    banner: '/placeholder.svg',
    category: 'MERN',
    domain: 'Full Stack Development',
    durationDays: 92,
    keyTopics: ['React', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'AWS'],
    startDate: new Date('2026-05-15'),
    endDate: new Date('2026-08-15'),
    registrationDeadline: new Date('2026-05-10'),
    maxSeats: 40,
    enrolledCount: 31,
    price: 24999,
    originalPrice: 34999,
    mode: 'Hybrid' as const,
    skillsCovered: ['React', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'AWS'],
    mentorNames: ['Arjun Mehta', 'Priya Sharma', 'Rohit Verma'],
    status: 'Open' as const,
    rating: 4.9,
    tags: ['MERN', 'Full-Stack', 'JavaScript', 'React', 'Node.js'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-03-01'),
  },
  {
    title: 'Data Science Immersive — Batch 3',
    slug: 'data-science-batch-3',
    type: EventType.BOOTCAMP,
    description: 'Comprehensive data science bootcamp covering Python, machine learning, deep learning, and data visualization. Work on real datasets and build a portfolio of data science projects.',
    banner: '/placeholder.svg',
    category: 'DataScience',
    domain: 'Data Science',
    durationDays: 92,
    keyTopics: ['Python', 'Pandas', 'Scikit-learn', 'TensorFlow', 'SQL', 'Tableau'],
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-09-01'),
    registrationDeadline: new Date('2026-05-25'),
    maxSeats: 30,
    enrolledCount: 22,
    price: 29999,
    originalPrice: 39999,
    mode: 'Online' as const,
    skillsCovered: ['Python', 'Pandas', 'Scikit-learn', 'TensorFlow', 'SQL', 'Tableau'],
    mentorNames: ['Vikram Singh', 'Sneha Patel'],
    status: 'Open' as const,
    rating: 4.8,
    tags: ['Data Science', 'Python', 'Machine Learning', 'AI'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-03-15'),
  },
  {
    title: 'DevOps Engineering Bootcamp',
    slug: 'devops-bootcamp',
    type: EventType.BOOTCAMP,
    description: 'Learn modern DevOps practices including CI/CD, containerization, orchestration, and cloud infrastructure. Hands-on experience with Docker, Kubernetes, Jenkins, and AWS.',
    banner: '/placeholder.svg',
    category: 'DevOps',
    domain: 'DevOps',
    durationDays: 91,
    keyTopics: ['Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Terraform'],
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-06-30'),
    registrationDeadline: new Date('2026-03-25'),
    maxSeats: 25,
    enrolledCount: 25,
    price: 19999,
    originalPrice: 27999,
    mode: 'Online' as const,
    skillsCovered: ['Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Terraform'],
    mentorNames: ['Karan Gupta'],
    status: 'Closed' as const,
    rating: 4.7,
    tags: ['DevOps', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-02-01'),
  },
  {
    title: 'UI/UX Design Sprint',
    slug: 'uiux-design-sprint',
    type: EventType.BOOTCAMP,
    description: 'Intensive UI/UX design bootcamp covering user research, wireframing, prototyping, and design systems. Master Figma and build a professional design portfolio.',
    banner: '/placeholder.svg',
    category: 'UI/UX',
    domain: 'Design',
    durationDays: 60,
    keyTopics: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-04-30'),
    registrationDeadline: new Date('2026-02-25'),
    maxSeats: 35,
    enrolledCount: 35,
    price: 14999,
    originalPrice: 21999,
    mode: 'Offline' as const,
    skillsCovered: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    mentorNames: ['Sneha Patel', 'Ananya Iyer'],
    status: 'Completed' as const,
    rating: 4.9,
    tags: ['UI/UX', 'Design', 'Figma', 'User Experience'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-01-15'),
  },
  {
    title: 'Python for Automation Bootcamp',
    slug: 'python-automation-bootcamp',
    type: EventType.BOOTCAMP,
    description: 'Automate repetitive workflows using Python, APIs, web scraping, spreadsheets, and scripting for business and engineering use cases.',
    banner: '/placeholder.svg',
    category: 'Python',
    domain: 'Automation',
    durationDays: 92,
    keyTopics: ['Python', 'Automation', 'Scripting', 'APIs', 'Web Scraping', 'Spreadsheets'],
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-09-30'),
    registrationDeadline: new Date('2026-06-25'),
    maxSeats: 36,
    enrolledCount: 12,
    price: 17999,
    originalPrice: 24999,
    mode: 'Online' as const,
    skillsCovered: ['Python', 'Automation', 'Scripting', 'APIs', 'Web Scraping', 'Spreadsheets'],
    mentorNames: ['Rajesh Kumar', 'Meera Nair'],
    status: 'Open' as const,
    rating: 4.6,
    tags: ['Python', 'Automation', 'Scripting', 'APIs'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-04-15'),
  },
  {
    title: 'Cybersecurity Fundamentals Bootcamp',
    slug: 'cybersecurity-fundamentals-bootcamp',
    type: EventType.BOOTCAMP,
    description: 'Master cybersecurity essentials including network security, ethical hacking, penetration testing, and security best practices.',
    banner: '/placeholder.svg',
    category: 'Cybersecurity',
    domain: 'Cybersecurity',
    durationDays: 91,
    keyTopics: ['Network Security', 'Ethical Hacking', 'Penetration Testing', 'Security Tools', 'Cryptography'],
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-10-30'),
    registrationDeadline: new Date('2026-07-25'),
    maxSeats: 25,
    enrolledCount: 18,
    price: 27999,
    originalPrice: 36999,
    mode: 'Hybrid' as const,
    skillsCovered: ['Network Security', 'Ethical Hacking', 'Penetration Testing', 'Security Tools', 'Cryptography'],
    mentorNames: ['Amit Singh', 'Kavita Rao'],
    status: 'Open' as const,
    rating: 4.8,
    tags: ['Cybersecurity', 'Ethical Hacking', 'Security', 'Networking'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-05-01'),
  },
  {
    title: 'Mobile App Development with React Native',
    slug: 'react-native-bootcamp',
    type: EventType.BOOTCAMP,
    description: 'Build cross-platform mobile apps with React Native. Learn iOS and Android development, state management, navigation, and app deployment.',
    banner: '/placeholder.svg',
    category: 'Mobile Development',
    domain: 'Mobile Development',
    durationDays: 92,
    keyTopics: ['React Native', 'JavaScript', 'Mobile UI', 'Firebase', 'App Store Deployment'],
    startDate: new Date('2026-06-15'),
    endDate: new Date('2026-09-15'),
    registrationDeadline: new Date('2026-06-10'),
    maxSeats: 30,
    enrolledCount: 30,
    price: 22999,
    originalPrice: 31999,
    mode: 'Online' as const,
    skillsCovered: ['React Native', 'JavaScript', 'Mobile UI', 'Firebase', 'App Store Deployment'],
    mentorNames: ['Sanjay Verma', 'Pooja Desai'],
    status: 'Closed' as const,
    rating: 4.7,
    tags: ['React Native', 'Mobile', 'iOS', 'Android', 'JavaScript'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-04-01'),
  },
  {
    title: 'Cloud Engineering with AWS — Batch 2',
    slug: 'aws-cloud-engineering-batch-2',
    type: EventType.BOOTCAMP,
    description: 'Become an AWS certified cloud architect. Learn to design scalable, secure, and cost-effective cloud solutions. Includes hands-on labs and real-world scenarios.',
    banner: '/placeholder.svg',
    category: 'Cloud Computing',
    domain: 'Cloud Engineering',
    durationDays: 92,
    keyTopics: ['AWS', 'EC2', 'S3', 'Lambda', 'CloudFormation', 'Serverless'],
    startDate: new Date('2026-07-15'),
    endDate: new Date('2026-10-15'),
    registrationDeadline: new Date('2026-07-10'),
    maxSeats: 28,
    enrolledCount: 15,
    price: 26999,
    originalPrice: 37999,
    mode: 'Online' as const,
    skillsCovered: ['AWS', 'EC2', 'S3', 'Lambda', 'CloudFormation', 'Serverless'],
    mentorNames: ['Deepak Sharma', 'Nisha Gupta'],
    status: 'Open' as const,
    rating: 4.8,
    tags: ['AWS', 'Cloud', 'Architecture', 'DevOps'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-05-15'),
  },
  {
    title: 'Full-Stack Java Spring Boot Bootcamp',
    slug: 'java-spring-boot-bootcamp',
    type: EventType.BOOTCAMP,
    description: 'Master enterprise Java development with Spring Boot, Hibernate, MySQL, REST APIs, and microservices architecture.',
    banner: '/placeholder.svg',
    category: 'Java',
    domain: 'Full Stack Development',
    durationDays: 92,
    keyTopics: ['Java', 'Spring Boot', 'Hibernate', 'MySQL', 'REST APIs', 'Microservices'],
    startDate: new Date('2026-08-15'),
    endDate: new Date('2026-11-15'),
    registrationDeadline: new Date('2026-08-10'),
    maxSeats: 32,
    enrolledCount: 8,
    price: 25999,
    originalPrice: 35999,
    mode: 'Hybrid' as const,
    skillsCovered: ['Java', 'Spring Boot', 'Hibernate', 'MySQL', 'REST APIs', 'Microservices'],
    mentorNames: ['Ravi Patel', 'Lakshmi Iyer', 'Arun Kumar'],
    status: 'Open' as const,
    rating: 4.7,
    tags: ['Java', 'Spring Boot', 'Backend', 'Microservices'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-06-01'),
  },
  {
    title: 'AI & Machine Learning Bootcamp — Batch 4',
    slug: 'ai-ml-bootcamp-batch-4',
    type: EventType.BOOTCAMP,
    description: 'Deep dive into AI and machine learning with hands-on projects covering Python, ML algorithms, deep learning, neural networks, and deployment.',
    banner: '/placeholder.svg',
    category: 'AI/ML',
    domain: 'Artificial Intelligence',
    durationDays: 92,
    keyTopics: ['Python', 'Machine Learning', 'Deep Learning', 'Neural Networks', 'TensorFlow', 'PyTorch'],
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-12-01'),
    registrationDeadline: new Date('2026-08-25'),
    maxSeats: 20,
    enrolledCount: 16,
    price: 32999,
    originalPrice: 44999,
    mode: 'Online' as const,
    skillsCovered: ['Python', 'Machine Learning', 'Deep Learning', 'Neural Networks', 'TensorFlow', 'PyTorch'],
    mentorNames: ['Dr. Suresh Reddy', 'Anita Joshi'],
    status: 'Open' as const,
    rating: 4.9,
    tags: ['AI', 'Machine Learning', 'Deep Learning', 'Python'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-06-15'),
  },
  {
    title: 'Blockchain Development Bootcamp',
    slug: 'blockchain-development-bootcamp',
    type: EventType.BOOTCAMP,
    description: 'Learn blockchain technology, smart contracts, and DApp development. Build decentralized applications using Ethereum, Solidity, and Web3.js.',
    banner: '/placeholder.svg',
    category: 'Blockchain',
    domain: 'Blockchain',
    durationDays: 92,
    keyTopics: ['Solidity', 'Ethereum', 'Smart Contracts', 'Web3', 'DApps', 'Blockchain Security'],
    startDate: new Date('2026-10-01'),
    endDate: new Date('2027-01-01'),
    registrationDeadline: new Date('2026-09-25'),
    maxSeats: 24,
    enrolledCount: 5,
    price: 28999,
    originalPrice: 39999,
    mode: 'Online' as const,
    skillsCovered: ['Solidity', 'Ethereum', 'Smart Contracts', 'Web3', 'DApps', 'Blockchain Security'],
    mentorNames: ['Manish Agarwal', 'Priyanka Singh'],
    status: 'Open' as const,
    rating: 4.6,
    tags: ['Blockchain', 'Ethereum', 'Web3', 'Cryptocurrency'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-07-01'),
  },
  {
    title: 'Digital Marketing & Analytics Bootcamp',
    slug: 'digital-marketing-analytics-bootcamp',
    type: EventType.BOOTCAMP,
    description: 'Master digital marketing strategies including SEO, social media marketing, Google Analytics, content strategy, email marketing, and PPC campaigns.',
    banner: '/placeholder.svg',
    category: 'Digital Marketing',
    domain: 'Marketing',
    durationDays: 92,
    keyTopics: ['SEO', 'Google Analytics', 'Social Media Marketing', 'Content Strategy', 'Email Marketing', 'PPC'],
    startDate: new Date('2026-06-20'),
    endDate: new Date('2026-09-20'),
    registrationDeadline: new Date('2026-06-15'),
    maxSeats: 40,
    enrolledCount: 40,
    price: 18999,
    originalPrice: 26999,
    mode: 'Online' as const,
    skillsCovered: ['SEO', 'Google Analytics', 'Social Media Marketing', 'Content Strategy', 'Email Marketing', 'PPC'],
    mentorNames: ['Neha Kapoor', 'Rahul Jain'],
    status: 'Closed' as const,
    rating: 4.8,
    tags: ['Digital Marketing', 'SEO', 'Analytics', 'Marketing'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-04-15'),
  },
  {
    title: 'Game Development with Unity — Batch 1',
    slug: 'unity-game-development-batch-1',
    type: EventType.BOOTCAMP,
    description: 'Build 2D and 3D games with Unity. Learn C#, game physics, 3D modeling, AR/VR, and publish games to multiple platforms.',
    banner: '/placeholder.svg',
    category: 'Game Development',
    domain: 'Game Development',
    durationDays: 92,
    keyTopics: ['Unity', 'C#', '3D Modeling', 'Game Physics', 'AR/VR', 'Mobile Games'],
    startDate: new Date('2026-09-15'),
    endDate: new Date('2026-12-15'),
    registrationDeadline: new Date('2026-09-10'),
    maxSeats: 22,
    enrolledCount: 9,
    price: 23999,
    originalPrice: 32999,
    mode: 'Hybrid' as const,
    skillsCovered: ['Unity', 'C#', '3D Modeling', 'Game Physics', 'AR/VR', 'Mobile Games'],
    mentorNames: ['Vikrant Mehta', 'Simran Kaur'],
    status: 'Open' as const,
    rating: 4.7,
    tags: ['Unity', 'Game Development', 'C#', 'AR/VR'],
    isActive: true,
    isPublished: true,
    publishedAt: new Date('2026-06-20'),
  },
];

// Main seed function
const seedAllBootcamps = async () => {
  try {
    logger.info('Starting complete bootcamp seeding...');

    // Clear existing bootcamps (optional - comment out if you want to keep existing)
    const deleteResult = await Bootcamp.deleteMany({ type: EventType.BOOTCAMP });
    logger.info(`Deleted ${deleteResult.deletedCount} existing bootcamps`);

    // Insert all bootcamps
    logger.info('Seeding 13 bootcamps...');
    const bootcamps = await Bootcamp.insertMany(bootcampSeeds);
    logger.info(`✓ Created ${bootcamps.length} bootcamps`);

    // Summary by status
    const statusCounts = await Bootcamp.aggregate([
      { $match: { type: EventType.BOOTCAMP } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    logger.info('\n=== Bootcamp Seeding Summary ===');
    logger.info(`Total bootcamps created: ${bootcamps.length}`);
    logger.info('\nBy Status:');
    statusCounts.forEach(({ _id, count }) => {
      logger.info(`  ${_id}: ${count}`);
    });

    // Summary by mode
    const modeCounts = await Bootcamp.aggregate([
      { $match: { type: EventType.BOOTCAMP } },
      { $group: { _id: '$mode', count: { $sum: 1 } } },
    ]);

    logger.info('\nBy Mode:');
    modeCounts.forEach(({ _id, count }) => {
      logger.info(`  ${_id}: ${count}`);
    });

    // Display sample IDs
    logger.info('\nSample Bootcamp IDs for testing:');
    const openBootcamp = await Bootcamp.findOne({ type: EventType.BOOTCAMP, status: 'Open' });
    if (openBootcamp) {
      logger.info(`Open Bootcamp: ${openBootcamp._id} - ${openBootcamp.title}`);
    }

    logger.info('\n✓ All 13 bootcamps seeded successfully!');
  } catch (error) {
    logger.error('Bootcamp seeding failed:', error);
    throw error;
  }
};

// Run the seed script
const run = async () => {
  try {
    await connectDB();
    await seedAllBootcamps();
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

export { seedAllBootcamps };
