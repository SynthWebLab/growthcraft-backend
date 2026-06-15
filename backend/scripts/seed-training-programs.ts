/**
 * Seed script for Training Programs (40-day internship programs)
 * 
 * This script populates the database with sample training programs matching the frontend mock data.
 * It creates both TrainingProgram entries and their corresponding TrainingProgramDetails.
 * 
 * Usage: npx ts-node scripts/seed-training-programs.ts
 */

import mongoose from 'mongoose';
import { TrainingProgram, ProgramLevel } from '../src/database/models/TrainingProgram.model';
import { TrainingProgramDetails } from '../src/database/models/TrainingProgramDetails.model';
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

// Training Program seed data (matching frontend mocks)
const trainingProgramSeeds = [
  {
    slug: 'full-stack-web-development',
    title: 'Full-Stack Web Development Internship',
    description: 'Build production-ready web applications using MERN stack. Work on real client projects and deploy live applications.',
    domain: 'Web Development',
    durationDays: 60,
    tools: ['React', 'Node.js', 'MongoDB', 'Express'],
    price: 12999,
    originalPrice: 18999,
    status: 'active' as const,
    enrollmentCount: 342,
    rating: 4.8,
    level: ProgramLevel.INTERMEDIATE,
    thumbnail: '/images/programs/full-stack-web-development.jpg',
    startDate: new Date('2026-07-01'),
    maxSeats: 50,
    enrolledCount: 28,
    isPublished: true,
  },
  {
    slug: 'uiux-design-internship',
    title: 'UI/UX Design Internship',
    description: 'Master Figma, design systems, and user research. Create portfolio-worthy designs for real startups.',
    domain: 'Design',
    durationDays: 30,
    tools: ['Figma', 'Adobe XD', 'Sketch', 'InVision'],
    price: 9999,
    originalPrice: 14999,
    status: 'active' as const,
    enrollmentCount: 256,
    rating: 4.7,
    level: ProgramLevel.BEGINNER,
    thumbnail: '/images/programs/uiux-design.jpg',
    startDate: new Date('2026-07-01'),
    maxSeats: 40,
    enrolledCount: 22,
    isPublished: true,
  },
  {
    slug: 'data-science-analytics',
    title: 'Data Science & Analytics Internship',
    description: 'Work with real datasets, build ML models, and create dashboards. Learn Python, pandas, and visualization tools.',
    domain: 'Data Science',
    durationDays: 60,
    tools: ['Python', 'Pandas', 'NumPy', 'Scikit-learn'],
    price: 14999,
    originalPrice: 21999,
    status: 'active' as const,
    enrollmentCount: 189,
    rating: 4.9,
    level: ProgramLevel.INTERMEDIATE,
    thumbnail: '/images/programs/data-science.jpg',
    startDate: new Date('2026-07-15'),
    maxSeats: 35,
    enrolledCount: 18,
    isPublished: true,
  },
  {
    slug: 'devops-cloud-engineering',
    title: 'DevOps & Cloud Engineering Internship',
    description: 'Master Docker, Kubernetes, CI/CD pipelines. Deploy and manage applications on AWS and GCP.',
    domain: 'DevOps',
    durationDays: 40,
    tools: ['Docker', 'Kubernetes', 'AWS', 'Jenkins'],
    price: 15999,
    originalPrice: 22999,
    status: 'coming-soon' as const,
    enrollmentCount: 0,
    rating: 0,
    level: ProgramLevel.ADVANCED,
    thumbnail: '/images/programs/devops-cloud.jpg',
    startDate: new Date('2026-08-01'),
    maxSeats: 30,
    enrolledCount: 0,
    isPublished: true,
  },
  {
    slug: 'mobile-app-development',
    title: 'Mobile App Development Internship',
    description: 'Build cross-platform mobile apps with React Native. Ship apps to iOS and Android app stores.',
    domain: 'Mobile Development',
    durationDays: 40,
    tools: ['React Native', 'Expo', 'Firebase', 'Redux'],
    price: 13999,
    originalPrice: 19999,
    status: 'active' as const,
    enrollmentCount: 178,
    rating: 4.6,
    level: ProgramLevel.INTERMEDIATE,
    thumbnail: '/images/programs/mobile-app-development.jpg',
    startDate: new Date('2026-07-10'),
    maxSeats: 40,
    enrolledCount: 25,
    isPublished: true,
  },
  {
    slug: 'digital-marketing-growth',
    title: 'Digital Marketing & Growth Internship',
    description: 'Learn SEO, social media marketing, content strategy, and analytics. Run real campaigns for brands.',
    domain: 'Marketing',
    durationDays: 30,
    tools: ['Google Analytics', 'SEMrush', 'HubSpot', 'Meta Ads'],
    price: 8999,
    originalPrice: 12999,
    status: 'active' as const,
    enrollmentCount: 423,
    rating: 4.5,
    level: ProgramLevel.BEGINNER,
    thumbnail: '/images/programs/digital-marketing.jpg',
    startDate: new Date('2026-07-05'),
    maxSeats: 60,
    enrolledCount: 45,
    isPublished: true,
  },
  {
    slug: 'ai-machine-learning',
    title: 'AI & Machine Learning Internship',
    description: 'Deep dive into neural networks, NLP, and computer vision. Build and deploy ML models.',
    domain: 'Artificial Intelligence',
    durationDays: 60,
    tools: ['TensorFlow', 'PyTorch', 'Keras', 'OpenCV'],
    price: 16999,
    originalPrice: 24999,
    status: 'active' as const,
    enrollmentCount: 234,
    rating: 4.9,
    level: ProgramLevel.ADVANCED,
    thumbnail: '/images/programs/ai-machine-learning.jpg',
    startDate: new Date('2026-07-20'),
    maxSeats: 25,
    enrolledCount: 12,
    isPublished: true,
  },
  {
    slug: 'backend-engineering',
    title: 'Backend Engineering Internship',
    description: 'Build scalable APIs, implement authentication, caching, and queues. Learn Node.js and microservices.',
    domain: 'Backend Development',
    durationDays: 40,
    tools: ['Node.js', 'PostgreSQL', 'Redis', 'GraphQL'],
    price: 13999,
    originalPrice: 19999,
    status: 'active' as const,
    enrollmentCount: 167,
    rating: 4.7,
    level: ProgramLevel.INTERMEDIATE,
    thumbnail: '/images/programs/backend-engineering.jpg',
    startDate: new Date('2026-07-15'),
    maxSeats: 35,
    enrolledCount: 20,
    isPublished: true,
  },
  {
    slug: 'cybersecurity-internship',
    title: 'Cybersecurity Internship',
    description: 'Learn ethical hacking, penetration testing, and security auditing. Secure real applications.',
    domain: 'Cybersecurity',
    durationDays: 60,
    tools: ['Kali Linux', 'Wireshark', 'Metasploit', 'Burp Suite'],
    price: 14999,
    originalPrice: 21999,
    status: 'coming-soon' as const,
    enrollmentCount: 0,
    rating: 0,
    level: ProgramLevel.ADVANCED,
    thumbnail: '/images/programs/cybersecurity.jpg',
    startDate: new Date('2026-08-10'),
    maxSeats: 20,
    enrolledCount: 0,
    isPublished: true,
  },
  {
    slug: 'product-management',
    title: 'Product Management Internship',
    description: 'Learn product strategy, roadmapping, user research, and stakeholder management. Work with real products.',
    domain: 'Product Management',
    durationDays: 30,
    tools: ['Jira', 'Miro', 'Figma', 'Google Analytics'],
    price: 11999,
    originalPrice: 16999,
    status: 'active' as const,
    enrollmentCount: 145,
    rating: 4.6,
    level: ProgramLevel.INTERMEDIATE,
    thumbnail: '/images/programs/product-management.jpg',
    startDate: new Date('2026-07-12'),
    maxSeats: 30,
    enrolledCount: 15,
    isPublished: true,
  },
  {
    slug: 'game-development',
    title: 'Game Development Internship',
    description: 'Build 2D and 3D games using Unity and C#. Design gameplay mechanics and publish your games.',
    domain: 'Game Development',
    durationDays: 40,
    tools: ['Unity', 'C#', 'Blender', 'Photoshop'],
    price: 15999,
    originalPrice: 22999,
    status: 'coming-soon' as const,
    enrollmentCount: 0,
    rating: 0,
    level: ProgramLevel.INTERMEDIATE,
    thumbnail: '/images/programs/game-development.jpg',
    startDate: new Date('2026-08-05'),
    maxSeats: 25,
    enrolledCount: 0,
    isPublished: true,
  },
  {
    slug: 'blockchain-development',
    title: 'Blockchain Development Internship',
    description: 'Build decentralized applications, write smart contracts with Solidity, and work with Web3 technologies.',
    domain: 'Blockchain',
    durationDays: 60,
    tools: ['Solidity', 'Ethereum', 'Web3.js', 'Hardhat'],
    price: 17999,
    originalPrice: 25999,
    status: 'active' as const,
    enrollmentCount: 98,
    rating: 4.8,
    level: ProgramLevel.ADVANCED,
    thumbnail: '/images/programs/blockchain-development.jpg',
    startDate: new Date('2026-07-25'),
    maxSeats: 20,
    enrolledCount: 8,
    isPublished: true,
  },
];

// Training Program Details seed data
const getTrainingProgramDetails = (program: any, programId: mongoose.Types.ObjectId) => {
  // Common templates for different program types
  const commonOverview = {
    aboutProgram: `${program.description}\n\nThis comprehensive ${program.durationDays}-day internship program is designed to give you hands-on experience in ${program.domain}. You'll work on real-world projects, learn industry-standard tools, and build a professional portfolio that will help you stand out in the job market.`,
    whatYouWillLearn: [
      { text: `Master ${program.tools[0]} from basics to advanced concepts` },
      { text: 'Build real-world projects for your portfolio' },
      { text: 'Work with industry-standard tools and best practices' },
      { text: 'Collaborate with peers on team projects' },
      { text: 'Get mentorship from experienced professionals' },
      { text: 'Prepare for technical interviews and job placements' },
    ],
    prerequisites: [
      { text: 'Basic understanding of programming concepts' },
      { text: 'Laptop with internet connection' },
      { text: 'Willingness to dedicate 4-6 hours daily' },
      { text: 'Passion for learning and building things' },
    ],
    whatsIncluded: [
      { text: 'Live interactive sessions', icon: '🎥' },
      { text: 'Hands-on projects and assignments', icon: '💻' },
      { text: 'Mentor support and code reviews', icon: '👨‍🏫' },
      { text: 'Industry-recognized certificate', icon: '📜' },
      { text: 'Lifetime community access', icon: '👥' },
      { text: 'Placement assistance', icon: '💼' },
    ],
  };

  // Generate syllabus based on duration
  const weeksCount = Math.ceil(program.durationDays / 7);
  const syllabus = [];
  for (let i = 1; i <= Math.min(weeksCount, 8); i++) {
    syllabus.push({
      week: i,
      title: `Week ${i}: ${getWeekTitle(program.domain, i)}`,
      topics: getWeekTopics(program.domain, program.tools, i),
      deliverables: [`Project milestone ${i}`, 'Weekly assignment'],
    });
  }

  return {
    programId,
    slug: program.slug,
    overview: commonOverview,
    syllabus,
    mentors: [
      {
        name: 'Rajesh Kumar',
        avatar: '/images/mentors/rajesh-kumar.jpg',
        designation: 'Senior Engineer',
        company: 'Tech Corp',
        bio: `Rajesh has over 10 years of experience in ${program.domain} and has mentored hundreds of students. He's passionate about helping aspiring developers launch their careers.`,
        expertise: program.tools.slice(0, 3),
        socialLinks: {
          linkedin: 'https://linkedin.com/in/rajesh-kumar',
          github: 'https://github.com/rajeshkumar',
        },
      },
      {
        name: 'Priya Sharma',
        avatar: '/images/mentors/priya-sharma.jpg',
        designation: 'Lead Developer',
        company: 'Innovation Labs',
        bio: `Priya specializes in ${program.domain} and has worked on multiple high-scale projects. She brings practical industry experience to the classroom.`,
        expertise: program.tools.slice(1, 4),
        socialLinks: {
          linkedin: 'https://linkedin.com/in/priya-sharma',
          twitter: 'https://twitter.com/priyasharma',
        },
      },
    ],
    faqs: [
      {
        question: 'Is this program suitable for beginners?',
        answer: `This program is designed for ${program.level.toLowerCase()} level students. You should have basic programming knowledge and willingness to learn.`,
      },
      {
        question: 'What is the daily time commitment?',
        answer: 'You should dedicate 4-6 hours daily including live sessions, assignments, and project work.',
      },
      {
        question: 'Will I get a certificate?',
        answer: 'Yes, you will receive an industry-recognized certificate upon successful completion of the program.',
      },
      {
        question: 'Do you provide placement assistance?',
        answer: 'Yes, we provide placement assistance including resume building, interview preparation, and job referrals.',
      },
      {
        question: 'Can I work on this part-time?',
        answer: `This is a ${program.durationDays}-day intensive program. While you can manage it part-time, we recommend dedicating focused hours daily for best results.`,
      },
      {
        question: 'What if I miss a live session?',
        answer: 'All live sessions are recorded and made available within 24 hours. You can catch up at your own pace.',
      },
    ],
  };
};

// Helper functions for generating dynamic content
function getWeekTitle(domain: string, week: number): string {
  const titles: { [key: string]: string[] } = {
    'Web Development': [
      'HTML, CSS & JavaScript Fundamentals',
      'React Basics & Components',
      'State Management & Hooks',
      'Backend with Node.js & Express',
      'Database Integration',
      'Authentication & Security',
      'Deployment & DevOps',
      'Final Project',
    ],
    'Design': [
      'Design Principles & Figma Basics',
      'User Research & Personas',
      'Wireframing & Prototyping',
      'UI Components & Design Systems',
      'Advanced Interactions',
      'Usability Testing',
      'Portfolio Building',
      'Final Project',
    ],
    'Data Science': [
      'Python Programming Basics',
      'Data Analysis with Pandas',
      'Data Visualization',
      'Statistical Analysis',
      'Machine Learning Fundamentals',
      'Advanced ML Algorithms',
      'Model Deployment',
      'Capstone Project',
    ],
  };
  return titles[domain]?.[week - 1] || `Core Concepts - Part ${week}`;
}

function getWeekTopics(domain: string, tools: string[], week: number): string[] {
  // Return relevant topics based on domain and week
  return [
    `Introduction to ${tools[0]}`,
    `Practical applications and use cases`,
    `Best practices and patterns`,
    `Hands-on exercises and projects`,
  ];
}

// Main seed function
const seedTrainingPrograms = async () => {
  try {
    logger.info('Starting training programs seeding...');

    // Clear existing training programs and their details
    const deletePrograms = await TrainingProgram.deleteMany({});
    const deleteDetails = await TrainingProgramDetails.deleteMany({});
    logger.info(`Deleted ${deletePrograms.deletedCount} existing training programs`);
    logger.info(`Deleted ${deleteDetails.deletedCount} existing training program details`);

    // Insert training programs
    logger.info('Seeding training programs...');
    const programs = await TrainingProgram.insertMany(trainingProgramSeeds);
    logger.info(`✓ Created ${programs.length} training programs`);

    // Create program details for each program
    logger.info('Seeding training program details...');
    const programDetailsData = programs.map((program) =>
      getTrainingProgramDetails(
        trainingProgramSeeds.find((p) => p.slug === program.slug),
        program._id as mongoose.Types.ObjectId
      )
    );
    const programDetails = await TrainingProgramDetails.insertMany(programDetailsData);
    logger.info(`✓ Created ${programDetails.length} training program details`);

    // Summary
    logger.info('\n=== Seeding Summary ===');
    logger.info(`Training Programs created: ${programs.length}`);
    logger.info(`Program Details created: ${programDetails.length}`);
    logger.info('======================\n');

    // Display sample program for testing
    logger.info('Sample Training Program for testing:');
    if (programs.length > 0) {
      logger.info(`ID: ${programs[0]._id}`);
      logger.info(`Title: ${programs[0].title}`);
      logger.info(`Slug: ${programs[0].slug}`);
      logger.info(`Status: ${programs[0].status}`);
    }

    logger.info('\n✓ Training programs seeding completed successfully!');
  } catch (error) {
    logger.error('Training programs seeding failed:', error);
    throw error;
  }
};

// Run the seed script
const run = async () => {
  try {
    await connectDB();
    await seedTrainingPrograms();
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

export { seedTrainingPrograms };
