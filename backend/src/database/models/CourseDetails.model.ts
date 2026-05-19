import mongoose, { Schema, Document } from 'mongoose';

// Curriculum Lesson Interface
export interface ILesson {
  title: string;
  duration: number; // in minutes
  isFree: boolean;
  videoUrl?: string;
}

// Curriculum Section Interface
export interface ICurriculumSection {
  sectionNumber: number;
  title: string;
  lessons: ILesson[];
}

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

// Instructor Details Interface
export interface IInstructorDetails {
  name: string;
  avatar?: string;
  bio: string;
  rating: number;
  studentsCount: number;
  coursesCount?: number;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
}

// FAQ Interface
export interface IFAQ {
  question: string;
  answer: string;
}

// Course Details Interface
export interface ICourseDetails extends Document {
  courseId: mongoose.Types.ObjectId; // Reference to Course
  slug: string; // Same as course slug for easy lookup
  
  // Overview Section
  overview: {
    aboutCourse: string;
    whatYouWillLearn: ILearningItem[];
    prerequisites: IPrerequisite[];
    whatsIncluded: IIncludedItem[];
  };
  
  // Curriculum Section
  curriculum: ICurriculumSection[];
  
  // Instructor Section
  instructorDetails: IInstructorDetails;
  
  // FAQ Section
  faqs: IFAQ[];
  
  createdAt: Date;
  updatedAt: Date;
}

const courseDetailsSchema = new Schema<ICourseDetails>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
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
      aboutCourse: {
        type: String,
        required: true,
      },
      whatYouWillLearn: [
        {
          text: { type: String, required: true },
        },
      ],
      prerequisites: [
        {
          text: { type: String, required: true },
        },
      ],
      whatsIncluded: [
        {
          text: { type: String, required: true },
          icon: { type: String },
        },
      ],
    },
    curriculum: [
      {
        sectionNumber: { type: Number, required: true },
        title: { type: String, required: true },
        lessons: [
          {
            title: { type: String, required: true },
            duration: { type: Number, required: true },
            isFree: { type: Boolean, default: false },
            videoUrl: { type: String },
          },
        ],
      },
    ],
    instructorDetails: {
      name: { type: String, required: true },
      avatar: { type: String },
      bio: { type: String, required: true },
      rating: { type: Number, default: 0, min: 0, max: 5 },
      studentsCount: { type: Number, default: 0 },
      coursesCount: { type: Number, default: 0 },
      socialLinks: {
        linkedin: { type: String },
        twitter: { type: String },
        github: { type: String },
        website: { type: String },
      },
    },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Remove __v from JSON response
courseDetailsSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const CourseDetails = mongoose.model<ICourseDetails>('CourseDetails', courseDetailsSchema);
