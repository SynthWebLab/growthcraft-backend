import mongoose from 'mongoose';
import { Bootcamp } from '../src/database/models/Bootcamp.model';
import { EventDetails } from '../src/database/models/EventDetails.model';
import { config } from '../src/config';

mongoose.connect(config.MONGODB_URI).then(async () => {
  console.log('Connected to database');
  
  const event = await Bootcamp.findOne({ slug: 'react-performance-optimization' });
  
  if (!event) {
    console.log('Event not found!');
    process.exit(1);
  }
  
  console.log('Found event:', event.title);
  
  const details = await EventDetails.create({
    eventId: event._id,
    slug: 'react-performance-optimization',
    type: 'Workshop',
    overview: {
      aboutEvent: 'Master React performance patterns, profiling tools, and optimization techniques to build lightning-fast applications.',
      whatYouWillLearn: [
        { text: 'Master React from basics to advanced' },
        { text: 'Master Chrome DevTools' },
        { text: 'Master Lighthouse' },
        { text: 'Master React Profiler' },
      ],
      prerequisites: [
        { text: 'Basic programming knowledge' },
        { text: 'Laptop with required software' },
      ],
      whatsIncluded: [
        { text: '6 Hours of focused learning' },
        { text: 'Hands-on projects' },
        { text: 'Expert mentorship' },
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
        topics: [
          'Working with React',
          'Working with Chrome DevTools',
          'Working with Lighthouse',
          'Working with React Profiler',
        ],
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
      date: 'June 15, 2026',
      time: '10:00 AM – 4:00 PM',
    },
    mentors: [],
    faqs: [
      {
        question: 'Is this workshop suitable for beginners?',
        answer: 'This workshop is best suited for developers with basic React knowledge.',
      },
      {
        question: 'Will I get a certificate?',
        answer: 'Yes, all participants will receive a certificate of completion.',
      },
      {
        question: 'Is this recorded?',
        answer: 'Recordings will be available for 7 days after the workshop.',
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
