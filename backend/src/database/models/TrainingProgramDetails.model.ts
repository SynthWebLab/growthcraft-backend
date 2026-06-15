import mongoose, { Schema, Document } from 'mongoose';

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

// Syllabus Week Interface
export interface ISyllabusWeek {
  week: number;
  title: string;
  topics: string[];
  deliverables?: string[];
}

// Mentor Details Interface
export interface IMentorDetails {
  name: string;
  avatar?: string;
  designation: string;
  company?: string;
  bio: string;
  expertise: string[];
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

// Training Program Details Interface
export interface ITrainingProgramDetails extends Document {
  programId: mongoose.Types.ObjectId; // Reference to TrainingProgram
  slug: string; // Same as program slug for easy lookup
  
  // Overview Section
  overview: {
    aboutProgram: string; // Rich text description
    whatYouWillLearn: ILearningItem[];
    prerequisites: IPrerequisite[];
    whatsIncluded: IIncludedItem[];
  };
  
  // Syllabus Section (week-by-week breakdown for 40-day programs)
  syllabus: ISyllabusWeek[];
  
  // Mentors Section (array of mentors)
  mentors: IMentorDetails[];
  
  // FAQ Section
  faqs: IFAQ[];
  
  createdAt: Date;
  updatedAt: Date;
}

const trainingProgramDetailsSchema = new Schema<ITrainingProgramDetails>(
  {
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingProgram',
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
    overview: {
      aboutProgram: {
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
    syllabus: [
      {
        week: { type: Number, required: true },
        title: { type: String, required: true },
        topics: [{ type: String }],
        deliverables: [{ type: String }],
        _id: false,
      },
    ],
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
  },
  {
    timestamps: true,
  }
);

// Compound index for queries
trainingProgramDetailsSchema.index({ slug: 1, programId: 1 });

// Remove __v from JSON response
trainingProgramDetailsSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const TrainingProgramDetails = mongoose.model<ITrainingProgramDetails>(
  'TrainingProgramDetails',
  trainingProgramDetailsSchema
);
