import mongoose, { Schema, Document } from 'mongoose';
import { EventType } from './Bootcamp.model';

// What You'll Learn Item
export interface ILearningItem {
  text: string;
}

// Prerequisites Item
export interface IPrerequisite {
  text: string;
}

// What's Included Item
export interface IIncludedItem {
  text: string;
  icon?: string;
}

// Agenda/Schedule Item (for workshops/hackathons)
export interface IAgendaItem {
  step: number; // 1, 2, 3, 4
  title: string; // e.g., "Introduction & Setup"
  duration: string; // e.g., "1 Hour"
  topics: string[]; // Array of topics/subtopics
}

// Venue Details Interface
export interface IVenueDetails {
  type: 'Online' | 'Offline' | 'Hybrid';
  mode: string; // e.g., "Online — Zoom"
  description: string; // e.g., "Online event. Meeting link will be shared after registration."
  date?: string; // e.g., "July 10, 2026"
  time?: string; // e.g., "1:00 PM – 6:00 PM"
  // For offline/hybrid events
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  landmark?: string;
  mapLink?: string;
}

// Mentor Details Interface (simpler than instructor for events)
export interface IMentorDetails {
  name: string;
  avatar?: string;
  designation: string;
  company?: string;
  bio: string;
  expertise: string[]; // Areas of expertise
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

// FAQ Interface
export interface IFAQ {
  question: string;
  answer: string;
}

// Event Details Interface
export interface IEventDetails extends Document {
  eventId: mongoose.Types.ObjectId; // Reference to Bootcamp (event)
  slug: string; // Same as event slug for easy lookup
  type: EventType; // Workshop, Bootcamp, or Hackathon
  
  // Overview Section
  overview: {
    aboutEvent: string; // Rich text description
    whatYouWillLearn: ILearningItem[];
    prerequisites: IPrerequisite[];
    whatsIncluded: IIncludedItem[];
  };
  
  // Agenda/Schedule Section (timeline of the event)
  agenda: IAgendaItem[];
  
  // Venue Section
  venue: IVenueDetails;
  
  // Mentors Section (array of mentors)
  mentors: IMentorDetails[];
  
  // FAQ Section
  faqs: IFAQ[];
  
  isDateTBA?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const eventDetailsSchema = new Schema<IEventDetails>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Bootcamp',
      required: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(EventType),
      index: true,
    },
    overview: {
      aboutEvent: {
        type: String,
        required: true,
      },
      whatYouWillLearn: [
        {
          text: { type: String, required: true },
          _id: false,
        },
      ],
      prerequisites: [
        {
          text: { type: String, required: true },
          _id: false,
        },
      ],
      whatsIncluded: [
        {
          text: { type: String, required: true },
          icon: { type: String },
          _id: false,
        },
      ],
    },
    agenda: [
      {
        step: { type: Number, required: true },
        title: { type: String, required: true },
        duration: { type: String, required: true },
        topics: [{ type: String }],
        _id: false,
      },
    ],
    venue: {
      type: {
        type: String,
        required: true,
        enum: ['Online', 'Offline', 'Hybrid'],
      },
      mode: { type: String, required: true },
      description: { type: String, required: true },
      date: { type: String },
      time: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      landmark: { type: String },
      mapLink: { type: String },
      _id: false,
    },
    mentors: [
      {
        name: { type: String, required: true },
        avatar: { type: String },
        designation: { type: String, required: true },
        company: { type: String },
        bio: { type: String, required: true },
        expertise: [{ type: String }],
        socialLinks: {
          linkedin: { type: String },
          twitter: { type: String },
          github: { type: String },
        },
        _id: false,
      },
    ],
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        _id: false,
      },
    ],
    isDateTBA: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for type-based queries
eventDetailsSchema.index({ type: 1, slug: 1 });

// Remove __v from JSON response
eventDetailsSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const EventDetails = mongoose.model<IEventDetails>('EventDetails', eventDetailsSchema);
