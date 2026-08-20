/**
 * Seed script for Training Programs (40/60-day offline internship programs)
 * Based on GrowthCraft Complete Product Catalogue
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

/// Training Program seed data from GrowthCraft Complete Product Catalogue
const trainingProgramSeeds = [
  {
    slug: 'appfoundry-mobile-app-development',
    title: 'AppFoundry',
    programName: 'AppFoundry',
    fullTitle: 'Mobile App Development with React Native',
    description: 'Build production-ready cross-platform mobile apps with React Native, Expo, and Redux. Learn Firebase backend integration, UI building with native components, navigation patterns, and deploy live apps to Google Play and Apple App Store.',
    domain: 'Mobile Development',
    durationDays: 60,
    tools: ['React Native', 'Expo', 'Firebase', 'Redux', 'React Navigation'],
    price: 12999,
    originalPrice: 18999,
    status: 'active' as const,
    enrollmentCount: 145,
    rating: 4.8,
    level: ProgramLevel.INTERMEDIATE,
    thumbnail: '/images/programs/mobile-app-development.jpg',
    startDate: new Date('2026-07-01'),
    maxSeats: 40,
    enrolledCount: 18,
    isPublished: true,
    prerequisites: [
      'Basic JavaScript + React knowledge',
      'AppStarter or React Ready recommended',
    ],
    careerOutcomes: [
      'Mobile App Developer',
      'Cross-Platform Developer',
      'React Native Engineer',
    ],
    whatYouWillLearn: [
      'Cross-platform mobile app development',
      'Firebase integration',
      'UI building with native components',
      'State management with Redux',
      'Navigation patterns',
      'Real app deployment to app stores',
    ],
    syllabusTitles: [
      'React Native & Expo Essentials',
      'UI Architecture & Native Components',
      'Navigation Patterns & Screen Flows',
      'State Management with Redux Toolkit',
      'Firebase Authentication & Cloud Firestore',
      'Device APIs, Camera & Push Notifications',
      'Offline Storage & Performance Tuning',
      'App Store & Play Store Deployment',
    ],
  },
  {
    slug: 'mern-masters-full-stack-web-dev',
    title: 'MERN Masters',
    programName: 'MERN Masters',
    fullTitle: 'Full Stack Web Dev Internship',
    description: '60-day intensive full-stack internship covering MERN stack end-to-end. Master API design & integration, JWT/OAuth authentication, MongoDB database modeling, CI/CD automated deployment, and client project delivery.',
    domain: 'Web Application Development',
    durationDays: 60,
    tools: ['MongoDB', 'Express.js', 'React.js', 'Node.js', 'Git', 'Netlify/Vercel'],
    price: 12999,
    originalPrice: 18999,
    status: 'active' as const,
    enrollmentCount: 312,
    rating: 4.9,
    level: ProgramLevel.INTERMEDIATE,
    thumbnail: '/images/programs/full-stack-web-development.jpg',
    startDate: new Date('2026-07-01'),
    maxSeats: 50,
    enrolledCount: 28,
    isPublished: true,
    prerequisites: [
      'FullStack Fusion or equivalent MERN experience',
      'Git proficiency',
    ],
    careerOutcomes: [
      'Full-Stack Developer',
      'MERN Developer',
      'Web Application Engineer',
    ],
    whatYouWillLearn: [
      'Full-stack development end-to-end',
      'API design & integration',
      'Authentication (JWT, OAuth)',
      'Database modeling',
      'Deployment & CI/CD basics',
      'Client project delivery',
    ],
    syllabusTitles: [
      'Advanced React & State Architecture',
      'Node.js & Express RESTful API Design',
      'MongoDB Schema Design & Query Optimization',
      'Authentication & Authorization (JWT, OAuth)',
      'Full-Stack Integration & Middleware',
      'Testing & Code Quality with Jest/Supertest',
      'CI/CD Pipelines & Automated Deployments',
      'Capstone Client Project Delivery',
    ],
  },
  {
    slug: 'wp-wizard-cms-web-design',
    title: 'WP Wizard',
    programName: 'WP Wizard',
    fullTitle: 'CMS Web Design & Customization with WordPress',
    description: '40-day practical CMS web design internship. Master WordPress theme customization, Elementor visual page building, WooCommerce online store setup, SEO fundamentals, hosting, and cPanel server management.',
    domain: 'CMS Web Development',
    durationDays: 40,
    tools: ['WordPress', 'Elementor', 'WooCommerce', 'cPanel', 'MySQL'],
    price: 9999,
    originalPrice: 14999,
    status: 'active' as const,
    enrollmentCount: 220,
    rating: 4.7,
    level: ProgramLevel.BEGINNER,
    thumbnail: '/images/programs/wp-wizard.jpg',
    startDate: new Date('2026-07-10'),
    maxSeats: 40,
    enrolledCount: 19,
    isPublished: true,
    prerequisites: [
      'Basic computer and internet literacy',
      'No coding required',
    ],
    careerOutcomes: [
      'WordPress Developer',
      'Freelance Web Designer',
      'CMS Specialist',
    ],
    whatYouWillLearn: [
      'Theme design & customization',
      'Plugin configuration & management',
      'WooCommerce store setup',
      'Elementor page building',
      'SEO basics',
      'Hosting & cPanel management',
    ],
    syllabusTitles: [
      'WordPress Architecture & cPanel Hosting',
      'Visual Page Building with Elementor Pro',
      'Theme Customization & Child Themes',
      'WooCommerce Store Setup & Payment Gateways',
      'On-Page SEO, Speed Optimization & Security',
      'Client Project Delivery & Site Handoff',
    ],
  },
  {
    slug: 'designsprint-ui-ux-design',
    title: 'DesignSprint',
    programName: 'DesignSprint',
    fullTitle: 'UI/UX Design Internship Program',
    description: '40-day immersive UI/UX design internship. Master Figma from end-to-end product design, wireframing, high-fidelity prototyping, user research, design systems, and crafting client-ready portfolio case studies.',
    domain: 'UI/UX Design',
    durationDays: 40,
    tools: ['Figma', 'UI/UX Design', 'Design Systems', 'Prototyping'],
    price: 9999,
    originalPrice: 14999,
    status: 'active' as const,
    enrollmentCount: 280,
    rating: 4.8,
    level: ProgramLevel.BEGINNER,
    thumbnail: '/images/programs/uiux-design.jpg',
    startDate: new Date('2026-07-05'),
    maxSeats: 45,
    enrolledCount: 24,
    isPublished: true,
    prerequisites: [
      'UX Genesis or FigmaFlow recommended',
      'Strong visual sense helpful',
    ],
    careerOutcomes: [
      'UI/UX Designer',
      'Product Designer',
      'UX Researcher',
    ],
    whatYouWillLearn: [
      'Design principles & visual hierarchy',
      'Wireframing & prototyping',
      'User research & testing',
      'Design systems & component libraries',
      'Portfolio-ready case studies',
      'Client design handoffs',
    ],
    syllabusTitles: [
      'Design Foundations & Visual Hierarchy',
      'User Research, Personas & User Journeys',
      'Wireframing & Information Architecture',
      'Figma Mastery & Interactive Prototyping',
      'Design Systems, Tokens & Component Libraries',
      'Usability Testing & Portfolio Case Study',
    ],
  },
  {
    slug: 'devops-launchpad-devops-engineering',
    title: 'DevOps Launchpad',
    programName: 'DevOps Launchpad',
    fullTitle: 'DevOps Engineering Internship',
    description: '40-day intensive DevOps internship. Master containerization with Docker, orchestration with Kubernetes, automated CI/CD with GitHub Actions & Jenkins, AWS cloud infrastructure as code, and live monitoring.',
    domain: 'DevOps',
    durationDays: 40,
    tools: ['Git', 'GitHub Actions', 'Docker', 'Kubernetes', 'Jenkins', 'AWS'],
    price: 12999,
    originalPrice: 18999,
    status: 'active' as const,
    enrollmentCount: 195,
    rating: 4.8,
    level: ProgramLevel.INTERMEDIATE,
    thumbnail: '/images/programs/devops-cloud.jpg',
    startDate: new Date('2026-07-15'),
    maxSeats: 35,
    enrolledCount: 16,
    isPublished: true,
    prerequisites: [
      'DevOps Jumpstart, CloudClimb recommended',
      'Linux CLI proficiency required',
    ],
    careerOutcomes: [
      'DevOps Engineer',
      'Site Reliability Engineer',
      'Cloud Engineer',
    ],
    whatYouWillLearn: [
      'CI/CD pipeline design & automation',
      'Containerization & orchestration',
      'Infrastructure as code',
      'Cloud deployment (AWS)',
      'Monitoring & logging',
      'Real infrastructure project delivery',
    ],
    syllabusTitles: [
      'Linux Shell Scripting & Git Workflows',
      'Docker Containerization & Multi-Stage Builds',
      'CI/CD Automation with GitHub Actions & Jenkins',
      'AWS Cloud Core Services (EC2, S3, RDS, IAM)',
      'Kubernetes Pods, Deployments & Services',
      'Infrastructure Monitoring & Production Deployment',
    ],
  },
];

// Helper to construct TrainingProgramDetails
const getTrainingProgramDetails = (programSeed: typeof trainingProgramSeeds[0], programId: mongoose.Types.ObjectId) => {
  const overview = {
    aboutProgram: `${programSeed.description}\n\nThis comprehensive ${programSeed.durationDays}-day offline internship program is delivered in-person at partner campuses and GrowthCraft tech hubs. You will work on real client projects, build industry-standard applications, and graduate with a verified internship certificate and production portfolio.`,
    whatYouWillLearn: programSeed.whatYouWillLearn.map((item) => ({ text: item })),
    prerequisites: programSeed.prerequisites.map((item) => ({ text: item })),
    whatsIncluded: [
      { text: 'In-person mentor-led daily training', icon: '👨‍🏫' },
      { text: 'Real client project deliverables', icon: '💻' },
      { text: 'Code reviews & architecture feedback', icon: '🔍' },
      { text: 'Internship Completion Certificate (GrowthCraft + SynthWeb)', icon: '📜' },
      { text: 'Resume building & interview preparation', icon: '💼' },
      { text: 'Lifetime alumni community access', icon: '👥' },
    ],
  };

  const syllabus = programSeed.syllabusTitles.map((title, index) => ({
    week: index + 1,
    title: `Week ${index + 1}: ${title}`,
    topics: [
      `Core concepts and fundamentals of ${title}`,
      `Practical hands-on lab and component building`,
      `Best practices, debugging, and optimization`,
      `Weekly milestone evaluation and code review`,
    ],
    deliverables: [`Week ${index + 1} milestone submission`, 'Weekly assignment assessment'],
  }));

  return {
    programId,
    slug: programSeed.slug,
    overview,
    syllabus,
    mentors: [
      {
        name: 'Siddharth Sharma',
        avatar: '/images/mentors/siddharth-sharma.jpg',
        designation: 'Lead Technical Mentor',
        company: 'GrowthCraft & SynthWeb',
        bio: `Siddharth has over 8 years of industry experience across ${programSeed.domain}. He has mentored 500+ engineers into top tier product companies.`,
        expertise: programSeed.tools.slice(0, 3),
        socialLinks: {
          linkedin: 'https://linkedin.com/in/siddharth-sharma',
          github: 'https://github.com/siddharthsharma',
        },
      },
      {
        name: 'Pooja Verma',
        avatar: '/images/mentors/pooja-verma.jpg',
        designation: 'Senior Industry Instructor',
        company: 'SynthWeb Technologies',
        bio: `Pooja brings rich production experience in ${programSeed.domain} and specializes in project-based learning and career mentorship.`,
        expertise: programSeed.tools.slice(1, 4),
        socialLinks: {
          linkedin: 'https://linkedin.com/in/pooja-verma',
          twitter: 'https://twitter.com/poojaverma',
        },
      },
    ],
    faqs: [
      {
        question: 'Is this an offline internship program?',
        answer: 'Yes, all GrowthCraft internship programs are offline and conducted in-person at partner college campuses or SynthWeb offices.',
      },
      {
        question: 'What are the prerequisites for this program?',
        answer: programSeed.prerequisites.join('. ') + '.',
      },
      {
        question: 'Will I receive an internship certificate?',
        answer: 'Yes! Upon successful completion and project delivery, you will receive an industry-recognized Internship Completion Certificate co-branded by GrowthCraft and SynthWeb.',
      },
      {
        question: 'Will I work on real client projects?',
        answer: 'Yes, every participant builds portfolio-ready, live-deployed client projects under direct mentor supervision.',
      },
      {
        question: 'What is the daily time commitment?',
        answer: `This is an intensive ${programSeed.durationDays}-day program requiring dedicated in-person training and project building hours.`,
      },
    ],
  };
};

// Main seed function
const seedTrainingPrograms = async () => {
  try {
    logger.info('Starting Training Programs seeding...');

    // Clear existing training programs and their details
    const deletePrograms = await TrainingProgram.deleteMany({});
    const deleteDetails = await TrainingProgramDetails.deleteMany({});
    logger.info(`Cleared ${deletePrograms.deletedCount} existing training programs`);
    logger.info(`Cleared ${deleteDetails.deletedCount} existing training program details`);

    // Prepare program docs (excluding syllabus/whatYouWillLearn helper arrays from base doc)
    const baseProgramData = trainingProgramSeeds.map((p) => ({
      slug: p.slug,
      title: p.title,
      programName: p.programName,
      fullTitle: p.fullTitle,
      description: p.description,
      domain: p.domain,
      durationDays: p.durationDays,
      tools: p.tools,
      price: p.price,
      originalPrice: p.originalPrice,
      status: p.status,
      enrollmentCount: p.enrollmentCount,
      rating: p.rating,
      level: p.level,
      thumbnail: p.thumbnail,
      startDate: p.startDate,
      maxSeats: p.maxSeats,
      enrolledCount: p.enrolledCount,
      isPublished: p.isPublished,
      prerequisites: p.prerequisites,
      careerOutcomes: p.careerOutcomes,
      internshipPartners: [
        {
          companyName: 'SynthWeb',
          role: `${p.title} Industrial Intern`,
          duration: `${p.durationDays || 60} Days Internship`,
          mode: 'Hybrid / Campus Hub',
          stipend: 'Performance-based Stipend + PPO Opportunity',
          description: `Work on live client-facing software systems and enterprise modules using ${p.tools.slice(0, 3).join(', ')}.`,
        },
        {
          companyName: 'Social Stories',
          role: 'Product Engineering & Growth Intern',
          duration: `${p.durationDays || 60} Days Internship`,
          mode: 'Hybrid / Remote',
          stipend: 'Performance-based Stipend + Co-branded Certificate',
          description: `Build modern interactive tools, responsive workflows, and UI components using ${p.tools.slice(0, 2).join(', ')}.`,
        },
      ],
    }));

    // Insert training programs
    logger.info('Inserting Training Programs...');
    const createdPrograms = await TrainingProgram.insertMany(baseProgramData);
    logger.info(`✓ Created ${createdPrograms.length} Training Programs`);

    // Create program details
    logger.info('Inserting Training Program Details...');
    const detailsData = createdPrograms.map((prog) => {
      const seed = trainingProgramSeeds.find((s) => s.slug === prog.slug)!;
      return getTrainingProgramDetails(seed, prog._id as mongoose.Types.ObjectId);
    });

    const createdDetails = await TrainingProgramDetails.insertMany(detailsData);
    logger.info(`✓ Created ${createdDetails.length} Training Program Details`);

    logger.info('\n=== Training Programs Seeding Summary ===');
    for (const prog of createdPrograms) {
      logger.info(`• [${prog.domain}] ${prog.title} (Slug: ${prog.slug}, Days: ${prog.durationDays}, Price: ₹${prog.price})`);
      logger.info(`  Prerequisites: ${prog.prerequisites?.join(', ')}`);
      logger.info(`  Tools: ${prog.tools.join(', ')}`);
    }
    logger.info('=========================================\n');

    logger.info('✓ Training Programs seeding completed successfully!');
  } catch (error) {
    logger.error('Training Programs seeding failed:', error);
    throw error;
  }
};

// Run script if executed directly
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

if (require.main === module) {
  run();
}

export { seedTrainingPrograms };
