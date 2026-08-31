import { z } from 'zod';
import mongoose from 'mongoose';
import { PARTNERSHIP_TIERS } from '@/database/models/CollegeProfile.model';
import { CourseLevel, CourseCategory } from '@/database/models/Course.model';
import { ProgramLevel } from '@/database/models/TrainingProgram.model';
import { EventType } from '@/database/models/Bootcamp.model';

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid ObjectId format');

const optionalEmail = z
  .string()
  .trim()
  .email('Invalid email address')
  .or(z.literal(''))
  .nullable()
  .optional();

const optionalUrl = z
  .string()
  .trim()
  .url('Invalid URL format')
  .or(z.literal(''))
  .nullable()
  .optional();

// ==========================================
// College Admin Validators
// ==========================================
export const updateCollegeSchema = z
  .object({
    name: z.string().trim().min(1, 'College name cannot be empty').max(150).optional(),
    collegeName: z.string().trim().min(1).max(150).optional(),
    email: optionalEmail,
    phone: z.string().trim().max(30).nullable().optional(),
    address: z.string().trim().max(250).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    state: z.string().trim().max(100).nullable().optional(),
    website: optionalUrl,
    contact_person: z.string().trim().max(100).nullable().optional(),
    partnership_type: z.enum(PARTNERSHIP_TIERS).optional(),
    partnershipTier: z.enum(PARTNERSHIP_TIERS).optional(),
    is_active: z.boolean().optional(),
    partnershipActive: z.boolean().optional(),
  })
  .strict();

export type UpdateCollegeDto = z.infer<typeof updateCollegeSchema>;

// ==========================================
// Employer Admin Validators
// ==========================================
export const EMPLOYER_INDUSTRIES = [
  'IT/Software',
  'Fintech',
  'E-Commerce',
  'Healthcare',
  'EdTech',
  'Startup',
  'Other',
] as const;

export const EMPLOYER_COMPANY_SIZES = ['1-50', '51-200', '201-500', '500+'] as const;

export const updateEmployerSchema = z
  .object({
    company_name: z.string().trim().min(1, 'Company name cannot be empty').max(150).optional(),
    companyName: z.string().trim().min(1).max(150).optional(),
    email: optionalEmail,
    phone: z.string().trim().max(30).nullable().optional(),
    industry: z.enum(EMPLOYER_INDUSTRIES).optional(),
    company_size: z.enum(EMPLOYER_COMPANY_SIZES).optional(),
    companySize: z.enum(EMPLOYER_COMPANY_SIZES).optional(),
    website: optionalUrl,
    contact_person: z.string().trim().max(100).nullable().optional(),
    hiring_needs: z.string().trim().max(1000).nullable().optional(),
    hiringNeeds: z.string().trim().max(1000).nullable().optional(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateEmployerDto = z.infer<typeof updateEmployerSchema>;

// ==========================================
// Course Admin Validators
// ==========================================
const mentorInputSchema = z.object({
  userId: z.string().optional(),
  id: z.string().optional(),
  mentorProfileId: z.string().optional(),
  name: z.string().optional(),
  fullName: z.string().optional(),
  avatar: z.string().optional(),
  designation: z.string().optional(),
  currentOrganization: z.string().optional(),
  areaOfExpertise: z.string().optional(),
  bio: z.string().optional(),
});

export const createCourseSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
    shortDescription: z.string().trim().max(500).optional(),
    category: z.string().trim().min(1).optional(),
    price: z.coerce.number().min(0, 'Price cannot be negative'),
    originalPrice: z.coerce.number().min(0, 'Original price cannot be negative').nullable().optional(),
    duration: z.coerce.number().min(1).optional(),
    totalHours: z.coerce.number().min(1).optional(),
    lessonsCount: z.coerce.number().min(1).optional(),
    totalLessons: z.coerce.number().min(1).optional(),
    difficultyLevel: z.string().trim().optional(),
    level: z.nativeEnum(CourseLevel).optional(),
    instructorName: z.string().trim().max(100).optional(),
    instructor: z
      .object({
        name: z.string().trim().optional(),
        avatar: z.string().trim().optional(),
      })
      .optional(),
    mentorIds: z.array(z.string()).optional(),
    mentors: z.array(mentorInputSchema).optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
    thumbnail: z.string().trim().optional(),
    thumbnailUrl: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .strict();

export const updateCourseSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    shortDescription: z.string().trim().max(500).optional(),
    category: z.string().trim().min(1).optional(),
    price: z.coerce.number().min(0).optional(),
    originalPrice: z.coerce.number().min(0).nullable().optional(),
    duration: z.coerce.number().min(1).optional(),
    totalHours: z.coerce.number().min(1).optional(),
    lessonsCount: z.coerce.number().min(1).optional(),
    totalLessons: z.coerce.number().min(1).optional(),
    difficultyLevel: z.string().trim().optional(),
    level: z.nativeEnum(CourseLevel).optional(),
    instructorName: z.string().trim().max(100).optional(),
    instructor: z
      .object({
        name: z.string().trim().optional(),
        avatar: z.string().trim().optional(),
      })
      .optional(),
    mentorIds: z.array(z.string()).optional(),
    mentors: z.array(mentorInputSchema).optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
    thumbnail: z.string().trim().optional(),
    thumbnailUrl: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .strict();

export type CreateCourseDto = z.infer<typeof createCourseSchema>;
export type UpdateCourseDto = z.infer<typeof updateCourseSchema>;

// ==========================================
// Training Program Admin Validators
// ==========================================
const internshipPartnerSchema = z.object({
  companyName: z.string().trim().optional(),
  name: z.string().trim().optional(),
  logo: z.string().optional(),
  role: z.string().trim().optional(),
  duration: z.string().optional(),
  mode: z.string().optional(),
  stipend: z.string().optional(),
  description: z.string().optional(),
  availableSeats: z.coerce.number().optional(),
});

export const createTrainingProgramSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
    domain: z.string().trim().min(1, 'Domain is required'),
    durationDays: z.coerce.number().min(1, 'Duration must be at least 1 day'),
    price: z.coerce.number().min(0, 'Price cannot be negative'),
    originalPrice: z.coerce.number().min(0).nullable().optional(),
    tools: z.union([z.array(z.string()), z.string()]).optional(),
    prerequisites: z.union([z.array(z.string()), z.string()]).optional(),
    careerOutcomes: z.union([z.array(z.string()), z.string()]).optional(),
    level: z.union([z.nativeEnum(ProgramLevel), z.string()]).optional(),
    maxSeats: z.coerce.number().min(1).optional(),
    batchSize: z.coerce.number().min(1).optional(),
    startDate: z.union([z.string(), z.date()]).optional(),
    thumbnail: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    mentorIds: z.array(z.string()).optional(),
    mentors: z.array(mentorInputSchema).optional(),
    internshipPartners: z.array(z.union([internshipPartnerSchema, z.string()])).optional(),
  })
  .strict();

export const updateTrainingProgramSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    domain: z.string().trim().min(1).optional(),
    durationDays: z.coerce.number().min(1).optional(),
    price: z.coerce.number().min(0).optional(),
    originalPrice: z.coerce.number().min(0).nullable().optional(),
    tools: z.union([z.array(z.string()), z.string()]).optional(),
    prerequisites: z.union([z.array(z.string()), z.string()]).optional(),
    careerOutcomes: z.union([z.array(z.string()), z.string()]).optional(),
    level: z.union([z.nativeEnum(ProgramLevel), z.string()]).optional(),
    maxSeats: z.coerce.number().min(1).optional(),
    batchSize: z.coerce.number().min(1).optional(),
    startDate: z.union([z.string(), z.date()]).optional(),
    thumbnail: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    mentorIds: z.array(z.string()).optional(),
    mentors: z.array(mentorInputSchema).optional(),
    internshipPartners: z.array(z.union([internshipPartnerSchema, z.string()])).optional(),
  })
  .strict();

export type CreateTrainingProgramDto = z.infer<typeof createTrainingProgramSchema>;
export type UpdateTrainingProgramDto = z.infer<typeof updateTrainingProgramSchema>;

// ==========================================
// Event / Bootcamp Admin Validators
// ==========================================
export const EVENT_STATUSES = ['Draft', 'Open', 'Closed', 'Completed'] as const;
export const EVENT_MODES = ['Online', 'Offline', 'Hybrid'] as const;

export const createEventSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
    domain: z.string().trim().min(1, 'Domain is required'),
    type: z.nativeEnum(EventType).optional(),
    description: z.string().trim().max(5000).optional(),
    durationDays: z.coerce.number().min(1).optional(),
    price: z.coerce.number().min(0).optional(),
    originalPrice: z.coerce.number().min(0).nullable().optional(),
    startDate: z.union([z.string(), z.date()]).optional(),
    endDate: z.union([z.string(), z.date()]).optional(),
    registrationDeadline: z.union([z.string(), z.date()]).optional(),
    maxSeats: z.coerce.number().min(1).optional(),
    mode: z.enum(EVENT_MODES).optional(),
    banner: z.string().trim().optional(),
    keyTopics: z.array(z.string()).optional(),
    skillsCovered: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    slug: z.string().trim().optional(),
    status: z.enum(EVENT_STATUSES).optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    mentorIds: z.array(z.string()).optional(),
    mentors: z.array(mentorInputSchema).optional(),
  })
  .strict();

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    domain: z.string().trim().min(1).optional(),
    type: z.nativeEnum(EventType).optional(),
    description: z.string().trim().max(5000).optional(),
    durationDays: z.coerce.number().min(1).optional(),
    price: z.coerce.number().min(0).optional(),
    originalPrice: z.coerce.number().min(0).nullable().optional(),
    startDate: z.union([z.string(), z.date()]).optional(),
    endDate: z.union([z.string(), z.date()]).optional(),
    registrationDeadline: z.union([z.string(), z.date()]).optional(),
    maxSeats: z.coerce.number().min(1).optional(),
    mode: z.enum(EVENT_MODES).optional(),
    banner: z.string().trim().optional(),
    keyTopics: z.array(z.string()).optional(),
    skillsCovered: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    slug: z.string().trim().optional(),
    status: z.enum(EVENT_STATUSES).optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    mentorIds: z.array(z.string()).optional(),
    mentors: z.array(mentorInputSchema).optional(),
  })
  .strict();

export const toggleEventStatusSchema = z
  .object({
    status: z.enum(EVENT_STATUSES).optional(),
  })
  .strict();

export type CreateEventDto = z.infer<typeof createEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;

// ==========================================
// Other Admin Body Validators
// ==========================================
export const updateUserStatusSchema = z
  .object({
    isActive: z.boolean({ required_error: 'isActive boolean is required' }),
  })
  .strict();

export const toggleAmbassadorSchema = z
  .object({
    isAmbassador: z.boolean({ required_error: 'isAmbassador boolean is required' }),
  })
  .strict();

export const updateEnquirySchema = z
  .object({
    enquiry_type: z.string().trim().min(1, 'enquiry_type is required'),
    status: z.string().trim().min(1, 'status is required'),
    notes: z.string().trim().optional(),
  })
  .strict();

export const updateRegistrationSchema = z
  .object({
    item_type: z.string().trim().min(1, 'item_type is required'),
    status: z.string().trim().min(1, 'status is required'),
    payment_status: z.string().trim().min(1, 'payment_status is required'),
    notes: z.string().trim().optional(),
  })
  .strict();

export const recordMentorPayoutSchema = z
  .object({
    amount: z.coerce.number().positive('Payout amount must be greater than 0'),
    period: z.string().trim().min(1, 'Payout period is required (e.g. "June 2026")'),
    notes: z.string().trim().optional(),
  })
  .strict();

export const confirmMentorPayoutSchema = z
  .object({
    razorpayPaymentId: z.string().trim().optional(),
  })
  .strict();
