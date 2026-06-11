import mongoose from 'mongoose';
import { Bootcamp } from '../src/database/models/Bootcamp.model';
import { EventDetails } from '../src/database/models/EventDetails.model';
import { config } from '../src/config';

mongoose.connect(config.MONGODB_URI).then(async () => {
  console.log('Connected to database');
  
  // Find the event
  const event = await Bootcamp.findOne({ slug: 'typescript-deep-dive' });
  
  if (!event) {
    console.log('Event not found!');
    process.exit(1);
  }
  
  console.log('Found event:', event.title);
  
  // Create new details
  const details = await EventDetails.create({
    eventId: event._id,
    slug: 'typescript-deep-dive',
    type: 'Workshop',
    overview: {
      aboutEvent: 'Advanced TypeScript patterns, generics, utility types, and best practices for enterprise applications.',
      whatYouWillLearn: [
        { text: 'Master TypeScript from basics to advanced' },
        { text: 'Working with generics and utility types' },
      ],
      prerequisites: [
        { text: 'Basic programming knowledge' },
      ],
      whatsIncluded: [
        { text: '5 Hours of focused learning' },
      ],
    },
    agenda: [
      {
        step: 1,
        title: 'Introduction & Setup',
        duration: '1 Hour',
        topics: ['Welcome and overview', 'Environment setup'],
      },
      {
        step: 2,
        title: 'Core Concepts',
        duration: '2 Hours',
        topics: ['Working with TypeScript', 'Working with VS Code', 'Working with TSConfig', 'Working with Type Guards'],
      },
      {
        step: 3,
        title: 'Hands-on Practice',
        duration: '2 Hours',
        topics: ['Build real projects', 'Problem-solving exercises'],
      },
      {
        step: 4,
        title: 'Wrap-up & Q&A',
        duration: '1 Hour',
        topics: ['Review and recap', 'Q&A session'],
      },
    ],
    venue: {
      type: 'Online',
      mode: 'Online — Zoom',
      description: 'Online event. Meeting link will be shared after registration.',
      date: 'July 10, 2026',
      time: '1:00 PM – 6:00 PM',
    },
    mentors: [],
    faqs: [
      {
        question: 'What is the workshop schedule?',
        answer: 'The workshop runs from 1:00 PM to 6:00 PM with breaks included.',
      },
      {
        question: 'Will I get a certificate?',
        answer: 'Yes, all participants receive a certificate of completion.',
      },
    ],
  });
  
  console.log('✓ Created event details:', details._id);
  
  await mongoose.connection.close();
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
