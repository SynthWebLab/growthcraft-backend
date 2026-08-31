import { CourseEnrollment, ICourseEnrollment } from '@/database/models/CourseEnrollment.model';
import { EventEnrollment, IEventEnrollment } from '@/database/models/EventEnrollment.model';
import {
  TrainingProgramEnrollment,
  ITrainingProgramEnrollment,
} from '@/database/models/TrainingProgramEnrollment.model';
import { IStudentProfile } from '@/database/models/StudentProfile.model';
import { ISupportTicket } from '@/database/models/SupportTicket.model';
import { IMentorProfile } from '@/database/models/MentorProfile.model';
import { IMentorSession } from '@/database/models/MentorSession.model';
import { EventType } from '@/database/models/Bootcamp.model';
import { logger } from '@/common/utils/logger.util';

import {
  studentEnrollmentService,
  StudentEnrollmentService,
  ACTIVE_STATUSES,
} from './student-enrollment.service';
import {
  studentProfileService,
  StudentProfileService,
  StudentCertification,
  UpdateStudentProfileData,
} from './student-profile.service';
import {
  studentAmbassadorService,
  StudentAmbassadorService,
} from './student-ambassador.service';
import {
  studentWorkspaceService,
  StudentWorkspaceService,
  ProjectSubmissionInput,
} from './student-workspace.service';

export {
  StudentCertification,
  UpdateStudentProfileData,
  ProjectSubmissionInput,
  studentEnrollmentService,
  studentProfileService,
  studentAmbassadorService,
  studentWorkspaceService,
};

export interface StudentDashboardSummary {
  counts: {
    courses: number;
    bootcamps: number;
    workshops: number;
    hackathons: number;
    trainingPrograms: number;
    certificates: number;
  };
  recent: {
    courses: ICourseEnrollment[];
    events: IEventEnrollment[];
    trainingPrograms: ITrainingProgramEnrollment[];
  };
  certificates: StudentCertification[];
}

/**
 * Facade service for Student Dashboard and student operations.
 * Aggregates dashboard summaries and delegates specialized concerns to:
 * - StudentEnrollmentService
 * - StudentProfileService
 * - StudentAmbassadorService
 * - StudentWorkspaceService
 */
export class StudentDashboardService {
  private static instance: StudentDashboardService | null = null;

  public constructor() { }

  public static getInstance(): StudentDashboardService {
    if (!StudentDashboardService.instance) {
      StudentDashboardService.instance = new StudentDashboardService();
    }
    return StudentDashboardService.instance;
  }

  public static setInstance(instance: StudentDashboardService | null): void {
    StudentDashboardService.instance = instance;
  }

  public static resetInstance(): void {
    StudentDashboardService.instance = null;
  }

  /**
   * Build the aggregated dashboard summary for a student (only paid/confirmed enrollments)
   */
  public async getDashboard(userId: string): Promise<StudentDashboardSummary> {
    try {
      const email = await studentEnrollmentService.linkEnrollmentsByEmail(userId);
      const userCondition = email ? { $or: [{ userId }, { email }] } : { userId };
      const baseFilter = {
        ...userCondition,
        status: { $in: ACTIVE_STATUSES },
        paymentStatus: { $nin: ['pending', 'failed', 'cancelled', 'unpaid'] },
      };

      const [courses, events, trainingPrograms, certificates] = await Promise.all([
        CourseEnrollment.find(baseFilter).populate('courseId').sort({ createdAt: -1 }).exec(),
        EventEnrollment.find(baseFilter).populate('eventId').sort({ createdAt: -1 }).exec(),
        TrainingProgramEnrollment.find(baseFilter).populate('programId').sort({ createdAt: -1 }).exec(),
        studentProfileService.getCertificates(userId),
      ]);

      const bootcamps = events.filter((e) => e.eventType === EventType.BOOTCAMP);
      const workshops = events.filter((e) => e.eventType === EventType.WORKSHOP);
      const hackathons = events.filter((e) => e.eventType === EventType.HACKATHON);

      return {
        counts: {
          courses: courses.length,
          bootcamps: bootcamps.length,
          workshops: workshops.length,
          hackathons: hackathons.length,
          trainingPrograms: trainingPrograms.length,
          certificates: certificates.length,
        },
        recent: {
          courses: courses.slice(0, 5),
          events: events.slice(0, 5),
          trainingPrograms: trainingPrograms.slice(0, 5),
        },
        certificates,
      };
    } catch (error: any) {
      logger.error('Get student dashboard error:', error);
      throw error;
    }
  }

  // --- Delegated Profile & Mentorship Methods ---

  public async getProfile(userId: string): Promise<IStudentProfile | null> {
    return studentProfileService.getProfile(userId);
  }

  public async updateProfile(userId: string, data: UpdateStudentProfileData): Promise<IStudentProfile> {
    return studentProfileService.updateProfile(userId, data);
  }

  public async getCertificates(userId: string): Promise<StudentCertification[]> {
    return studentProfileService.getCertificates(userId);
  }

  public async createSupportTicket(
    userId: string,
    data: { subject: string; message: string }
  ): Promise<ISupportTicket> {
    return studentProfileService.createSupportTicket(userId, data);
  }

  public async getSupportTickets(userId: string): Promise<ISupportTicket[]> {
    return studentProfileService.getSupportTickets(userId);
  }

  public async getMentors(studentUserId: string, areaOfExpertise?: string): Promise<IMentorProfile[]> {
    return studentProfileService.getMentors(studentUserId, areaOfExpertise);
  }

  public async bookMentorSession(
    studentUserId: string,
    data: {
      mentorUserId: string;
      topic: string;
      scheduledDate: string | Date;
      timeSlot: string;
      sessionType?: '1:1' | 'Group';
    }
  ): Promise<IMentorSession> {
    return studentProfileService.bookMentorSession(studentUserId, data);
  }

  public async getMentorSessions(studentUserId: string): Promise<IMentorSession[]> {
    return studentProfileService.getMentorSessions(studentUserId);
  }

  // --- Delegated Enrollment & Batch Methods ---

  public async getCourses(userId: string): Promise<ICourseEnrollment[]> {
    return studentEnrollmentService.getCourses(userId);
  }

  public async getEvents(userId: string, eventType?: EventType): Promise<IEventEnrollment[]> {
    return studentEnrollmentService.getEvents(userId, eventType);
  }

  public async getTrainingPrograms(userId: string): Promise<ITrainingProgramEnrollment[]> {
    return studentEnrollmentService.getTrainingPrograms(userId);
  }

  public async getBatches(userId: string): Promise<any[]> {
    return studentEnrollmentService.getBatches(userId);
  }

  // --- Delegated Ambassador Methods ---

  public async activateAmbassador(studentUserId: string): Promise<IStudentProfile> {
    return studentAmbassadorService.activateAmbassador(studentUserId);
  }

  public async getAmbassadorDashboard(studentUserId: string): Promise<any> {
    return studentAmbassadorService.getAmbassadorDashboard(studentUserId);
  }

  public async getAmbassadorReferrals(
    studentUserId: string,
    filters?: { status?: string; page?: number; limit?: number }
  ): Promise<{ referrals: any[]; total: number; page: number; limit: number }> {
    return studentAmbassadorService.getAmbassadorReferrals(studentUserId, filters);
  }

  public async inviteFriends(
    studentUserId: string,
    payload: { emails: string[]; programType?: string; programId?: string }
  ): Promise<{ referrals: any[] }> {
    return studentAmbassadorService.inviteFriends(studentUserId, payload);
  }

  public async getEarnings(studentUserId: string): Promise<any> {
    return studentAmbassadorService.getEarnings(studentUserId);
  }

  // --- Delegated Workspace & Submission Methods ---

  public async getHackathonWorkspace(userId: string, slugOrId: string): Promise<any> {
    return studentWorkspaceService.getHackathonWorkspace(userId, slugOrId);
  }

  public async submitHackathonProject(
    userId: string,
    slugOrId: string,
    submissionData: ProjectSubmissionInput
  ): Promise<any> {
    return studentWorkspaceService.submitHackathonProject(userId, slugOrId, submissionData);
  }

  public async getWorkshopWorkspace(userId: string, slugOrId: string): Promise<any> {
    return studentWorkspaceService.getWorkshopWorkspace(userId, slugOrId);
  }

  public async submitWorkshopAssignment(
    userId: string,
    slugOrId: string,
    submissionData: ProjectSubmissionInput
  ): Promise<any> {
    return studentWorkspaceService.submitWorkshopAssignment(userId, slugOrId, submissionData);
  }

  public async getBootcampWorkspace(userId: string, slugOrId: string): Promise<any> {
    return studentWorkspaceService.getBootcampWorkspace(userId, slugOrId);
  }

  public async submitBootcampProject(
    userId: string,
    slugOrId: string,
    submissionData: ProjectSubmissionInput
  ): Promise<any> {
    return studentWorkspaceService.submitBootcampProject(userId, slugOrId, submissionData);
  }

  public async getCourseWorkspace(userId: string, slugOrId: string): Promise<any> {
    return studentWorkspaceService.getCourseWorkspace(userId, slugOrId);
  }

  public async submitCourseProject(
    userId: string,
    slugOrId: string,
    submissionData: ProjectSubmissionInput
  ): Promise<any> {
    return studentWorkspaceService.submitCourseProject(userId, slugOrId, submissionData);
  }

  public async getTrainingProgramWorkspace(userId: string, slugOrId: string): Promise<any> {
    return studentWorkspaceService.getTrainingProgramWorkspace(userId, slugOrId);
  }

  public async submitTrainingProgramProject(
    userId: string,
    slugOrId: string,
    submissionData: ProjectSubmissionInput
  ): Promise<any> {
    return studentWorkspaceService.submitTrainingProgramProject(userId, slugOrId, submissionData);
  }
}

export const studentDashboardService = StudentDashboardService.getInstance();
