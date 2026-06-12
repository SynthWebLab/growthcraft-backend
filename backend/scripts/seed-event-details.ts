/**
 * Seed script for EventDetails.
 *
 * Usage:
 *   npm run seed:events
 *   npm run seed:event-details
 */

import mongoose from 'mongoose';
import { Bootcamp, EventType, IBootcamp } from '../src/database/models/Bootcamp.model';
import { EventDetails, IAgendaItem, IFAQ, IIncludedItem, ILearningItem, IMentorDetails, IPrerequisite } from '../src/database/models/EventDetails.model';
import { config } from '../src/config';
import { logger } from '../src/common/utils/logger.util';

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

const formatDate = (date?: Date): string | undefined => {
  if (!date) {
    return undefined;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

const formatTimeRange = (startDate?: Date, endDate?: Date): string | undefined => {
  if (!startDate || !endDate) {
    return undefined;
  }

  const formatter = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
};

const buildLearningItems = (event: IBootcamp): ILearningItem[] => {
  const topics = event.keyTopics?.length ? event.keyTopics : event.skillsCovered;

  return topics.slice(0, 6).map((topic) => ({
    text: `Build practical skills with ${topic}`,
  }));
};

const buildPrerequisites = (event: IBootcamp): IPrerequisite[] => {
  if (event.type === EventType.HACKATHON) {
    return [
      { text: 'A laptop with your preferred development environment' },
      { text: 'Basic experience with at least one technology from the event stack' },
      { text: 'A team or willingness to join one during the event' },
    ];
  }

  return [
    { text: 'Basic programming knowledge' },
    { text: 'A laptop with the required software installed' },
  ];
};

const buildIncludedItems = (event: IBootcamp): IIncludedItem[] => {
  const items: IIncludedItem[] = [
    { text: `${event.durationDays} day${event.durationDays === 1 ? '' : 's'} of focused learning` },
    { text: event.type === EventType.HACKATHON ? 'Mentor support during the build' : 'Hands-on practice sessions' },
    { text: 'Certificate of participation' },
  ];

  if (event.price === 0) {
    items.unshift({ text: 'Free registration' });
  }

  return items;
};

const buildAgenda = (event: IBootcamp): IAgendaItem[] => {
  if (event.type === EventType.HACKATHON) {
    return [
      {
        step: 1,
        title: 'Kickoff and Team Formation',
        duration: '2 Hours',
        topics: ['Problem statements', 'Team formation', 'Rules and judging criteria'],
      },
      {
        step: 2,
        title: 'Build Sprint',
        duration: `${Math.max(event.durationDays * 8, 8)} Hours`,
        topics: event.keyTopics.slice(0, 5),
      },
      {
        step: 3,
        title: 'Mentor Reviews',
        duration: '2 Hours',
        topics: ['Technical feedback', 'Product refinement', 'Demo preparation'],
      },
      {
        step: 4,
        title: 'Demos and Results',
        duration: '2 Hours',
        topics: ['Project demos', 'Judging', 'Winner announcements'],
      },
    ];
  }

  return [
    {
      step: 1,
      title: 'Introduction and Setup',
      duration: '1 Hour',
      topics: ['Welcome and overview', 'Environment setup'],
    },
    {
      step: 2,
      title: 'Core Concepts',
      duration: event.durationDays > 1 ? '1 Day' : '2 Hours',
      topics: event.keyTopics.slice(0, 5),
    },
    {
      step: 3,
      title: 'Hands-on Practice',
      duration: event.durationDays > 1 ? `${Math.max(event.durationDays - 1, 1)} Days` : '2 Hours',
      topics: ['Guided exercises', 'Real-world scenarios'],
    },
    {
      step: 4,
      title: 'Wrap-up and Q&A',
      duration: '1 Hour',
      topics: ['Review and recap', 'Q&A session'],
    },
  ];
};

const buildMentors = (event: IBootcamp): IMentorDetails[] => {
  return event.mentorNames.map((name) => ({
    name,
    designation: event.type === EventType.HACKATHON ? 'Hackathon Mentor' : 'Event Mentor',
    bio: `${name} mentors learners in ${event.domain} with a focus on practical, project-based outcomes.`,
    expertise: event.keyTopics.slice(0, 4),
  }));
};

const buildFAQs = (event: IBootcamp): IFAQ[] => [
  {
    question: `Who should attend this ${event.type.toLowerCase()}?`,
    answer: `This ${event.type.toLowerCase()} is ideal for learners interested in ${event.domain} and ${event.keyTopics.slice(0, 3).join(', ')}.`,
  },
  {
    question: 'Will I get a certificate?',
    answer: 'Yes, eligible participants receive a certificate of participation.',
  },
  {
    question: 'Where will the event happen?',
    answer:
      event.mode === 'Online'
        ? 'The event is online. Access details will be shared after registration.'
        : 'Venue details and joining instructions will be shared after registration.',
  },
];

const buildDetails = (event: IBootcamp) => ({
  eventId: event._id,
  slug: event.slug,
  type: event.type,
  overview: {
    aboutEvent: event.description,
    whatYouWillLearn: buildLearningItems(event),
    prerequisites: buildPrerequisites(event),
    whatsIncluded: buildIncludedItems(event),
  },
  agenda: buildAgenda(event),
  venue: {
    type: event.mode,
    mode: event.mode === 'Online' ? 'Online - Zoom' : event.mode,
    description:
      event.mode === 'Online'
        ? 'Online event. Meeting link will be shared after registration.'
        : 'Venue and arrival details will be shared after registration.',
    date: formatDate(event.startDate),
    time: formatTimeRange(event.startDate, event.endDate),
    country: event.mode === 'Online' ? undefined : 'India',
  },
  mentors: buildMentors(event),
  faqs: buildFAQs(event),
});

const seedEventDetails = async () => {
  logger.info('Starting event details seeding...');

  const events = await Bootcamp.find({
    isActive: true,
    deletedAt: null,
  }).exec();

  if (events.length === 0) {
    logger.warn('No events found. Run npm run seed:events first.');
    return;
  }

  let upsertedCount = 0;

  for (const event of events) {
    await EventDetails.findOneAndUpdate(
      { slug: event.slug },
      buildDetails(event),
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).exec();

    upsertedCount += 1;
  }

  logger.info(`Created or updated ${upsertedCount} event details`);
};

const run = async () => {
  try {
    await connectDB();
    await seedEventDetails();
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Seed event details script failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

export { seedEventDetails };
