import mongoose from 'mongoose';
import { ICollegeProfile, PartnershipTier } from '@/database/models/CollegeProfile.model';
import { ICollegePartnershipRequest } from '@/database/models/CollegePartnershipRequest.model';
import { CourseEnrollment } from '@/database/models/CourseEnrollment.model';
import { EventEnrollment } from '@/database/models/EventEnrollment.model';
import { IStudentProfile } from '@/database/models/StudentProfile.model';
import { ISupportTicket } from '@/database/models/SupportTicket.model';
import { logger } from '@/common/utils/logger.util';

import {
  collegeProfileService,
  CollegeProfileService,
  UpdateCollegeProfileData,
} from './college-profile.service';
import {
  collegeCohortService,
  CollegeCohortService,
  StudentStatus,
  CollegeStudentRow,
  CohortStatus,
  CollegeMonthlyReport,
  ACTIVE_ENROLLMENT_STATUSES,
  MONTH_LABELS,
} from './college-cohort.service';
import {
  collegeImportService,
  CollegeImportService,
  ImportStudentInput,
  ImportStudentsResult,
} from './college-import.service';
import {
  collegeAttendanceService,
  CollegeAttendanceService,
} from './college-attendance.service';
import {
  collegeEventAccessService,
  CollegeEventAccessService,
} from './college-event-access.service';
import {
  collegeAmbassadorService,
  CollegeAmbassadorService,
} from './college-ambassador.service';

export {
  StudentStatus,
  CollegeStudentRow,
  CohortStatus,
  ImportStudentInput,
  ImportStudentsResult,
  CollegeMonthlyReport,
  UpdateCollegeProfileData,
  collegeProfileService,
  collegeCohortService,
  collegeImportService,
  collegeAttendanceService,
  collegeEventAccessService,
  collegeAmbassadorService,
};

export interface CollegeDashboardSummary {
  kpis: {
    totalStudentsEnrolled: number;
    activeCourses: number;
    partnershipTier: PartnershipTier;
    cohortLimit: number | null;
    cohortRemaining: number | null;
  };
  activeEventIds?: string[];
  activeCourseIds?: string[];
  enrollmentTrend: {
    weekly: { label: string; students: number }[];
    monthly: { label: string; students: number }[];
    yearly: { label: string; students: number }[];
  };
  topPerformers: { name: string; course: string; progress: number }[];
  recentActivity: { text: string; date: Date }[];
}

/**
 * Facade service for College Dashboard and campus operations.
 * Aggregates dashboard summaries and delegates domain operations to:
 * - CollegeProfileService
 * - CollegeCohortService
 * - CollegeImportService
 * - CollegeAttendanceService
 * - CollegeEventAccessService
 * - CollegeAmbassadorService
 */
export class CollegeDashboardService {
  private static instance: CollegeDashboardService;

  private constructor() {}

  public static getInstance(): CollegeDashboardService {
    if (!CollegeDashboardService.instance) {
      CollegeDashboardService.instance = new CollegeDashboardService();
    }
    return CollegeDashboardService.instance;
  }

  /**
   * Weekly enrolment counts for the trailing 6 weeks.
   */
  private async getEnrollmentTrendWeekly(
    userIds: mongoose.Types.ObjectId[]
  ): Promise<{ label: string; students: number }[]> {
    const now = new Date();
    const start = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000);

    const [groupedCourses, groupedEvents] = await Promise.all([
      userIds.length
        ? CourseEnrollment.find({
            userId: { $in: userIds },
            status: { $in: ACTIVE_ENROLLMENT_STATUSES },
            createdAt: { $gte: start },
          })
            .select('createdAt')
            .lean()
            .exec()
        : Promise.resolve([]),
      userIds.length
        ? EventEnrollment.find({
            userId: { $in: userIds },
            status: { $in: ['pending', 'confirmed'] },
            createdAt: { $gte: start },
          })
            .select('createdAt')
            .lean()
            .exec()
        : Promise.resolve([]),
    ]);

    const result: { label: string; students: number }[] = [];
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    for (let i = 5; i >= 0; i--) {
      const bucketStart = new Date(now.getTime() - i * oneWeekMs);
      const bucketEnd = new Date(bucketStart.getTime() + oneWeekMs);

      const courseCount = groupedCourses.filter((c) => {
        const d = new Date((c as any).createdAt);
        return d >= bucketStart && d < bucketEnd;
      }).length;

      const eventCount = groupedEvents.filter((e) => {
        const d = new Date((e as any).createdAt);
        return d >= bucketStart && d < bucketEnd;
      }).length;

      const weekLabel = bucketStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      result.push({ label: weekLabel, students: courseCount + eventCount });
    }
    return result;
  }

  /**
   * Monthly enrolment counts for the trailing 6 months.
   */
  private async getEnrollmentTrendMonthly(
    userIds: mongoose.Types.ObjectId[]
  ): Promise<{ label: string; students: number }[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [groupedCourses, groupedEvents] = await Promise.all([
      userIds.length
        ? CourseEnrollment.aggregate<{ _id: { y: number; m: number }; count: number }>([
            {
              $match: {
                userId: { $in: userIds },
                status: { $in: ACTIVE_ENROLLMENT_STATUSES },
                createdAt: { $gte: start },
              },
            },
            {
              $group: {
                _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
                count: { $sum: 1 },
              },
            },
          ])
        : Promise.resolve([]),
      userIds.length
        ? EventEnrollment.aggregate<{ _id: { y: number; m: number }; count: number }>([
            {
              $match: {
                userId: { $in: userIds },
                status: { $in: ['pending', 'confirmed'] },
                createdAt: { $gte: start },
              },
            },
            {
              $group: {
                _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
                count: { $sum: 1 },
              },
            },
          ])
        : Promise.resolve([]),
    ]);

    const countByKey = new Map<string, number>();

    groupedCourses.forEach((g) => {
      const key = `${g._id.y}-${g._id.m}`;
      countByKey.set(key, (countByKey.get(key) || 0) + g.count);
    });

    groupedEvents.forEach((g) => {
      const key = `${g._id.y}-${g._id.m}`;
      countByKey.set(key, (countByKey.get(key) || 0) + g.count);
    });

    const result: { label: string; students: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      result.push({ label: MONTH_LABELS[d.getMonth()], students: countByKey.get(key) ?? 0 });
    }
    return result;
  }

  /**
   * Yearly enrolment counts for the trailing 5 years.
   */
  private async getEnrollmentTrendYearly(
    userIds: mongoose.Types.ObjectId[]
  ): Promise<{ label: string; students: number }[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = currentYear - 4;
    const start = new Date(startYear, 0, 1);

    const [groupedCourses, groupedEvents] = await Promise.all([
      userIds.length
        ? CourseEnrollment.find({
            userId: { $in: userIds },
            status: { $in: ACTIVE_ENROLLMENT_STATUSES },
            createdAt: { $gte: start },
          })
            .select('createdAt')
            .lean()
            .exec()
        : Promise.resolve([]),
      userIds.length
        ? EventEnrollment.find({
            userId: { $in: userIds },
            status: { $in: ['pending', 'confirmed'] },
            createdAt: { $gte: start },
          })
            .select('createdAt')
            .lean()
            .exec()
        : Promise.resolve([]),
    ]);

    const result: { label: string; students: number }[] = [];
    for (let year = startYear; year <= currentYear; year++) {
      const courseCount = groupedCourses.filter((c) => {
        const d = new Date((c as any).createdAt);
        return d.getFullYear() === year;
      }).length;

      const eventCount = groupedEvents.filter((e) => {
        const d = new Date((e as any).createdAt);
        return d.getFullYear() === year;
      }).length;

      result.push({ label: String(year), students: courseCount + eventCount });
    }
    return result;
  }

  /**
   * Aggregated dashboard summary: KPIs, enrollment trend, top performers, activity.
   */
  public async getDashboard(userId: string): Promise<CollegeDashboardSummary> {
    try {
      const college = await collegeProfileService.getProfileOrThrow(userId);
      const userIds = await collegeProfileService.resolveStudentUserIds(college);
      const rows = await collegeCohortService.buildStudentRows(userIds);

      const [activeCourseIds, activeEventIds, weeklyTrend, monthlyTrend, yearlyTrend, recentCourses, recentEvents] =
        await Promise.all([
          CourseEnrollment.distinct('courseId', {
            userId: { $in: userIds },
            status: { $in: ACTIVE_ENROLLMENT_STATUSES },
          }),
          EventEnrollment.distinct('eventId', {
            userId: { $in: userIds },
            status: { $in: ['pending', 'confirmed'] },
          }),
          this.getEnrollmentTrendWeekly(userIds),
          this.getEnrollmentTrendMonthly(userIds),
          this.getEnrollmentTrendYearly(userIds),
          CourseEnrollment.find({ userId: { $in: userIds } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('fullName title createdAt')
            .lean()
            .exec(),
          EventEnrollment.find({ userId: { $in: userIds } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('fullName title eventType createdAt')
            .lean()
            .exec(),
        ]);

      const combinedRecent = [
        ...recentCourses.map((c) => ({
          text: `${c.fullName} enrolled in ${c.title}`,
          date: (c as { createdAt: Date }).createdAt,
        })),
        ...recentEvents.map((e) => ({
          text: `${e.fullName} enrolled in ${e.title} (${e.eventType})`,
          date: (e as { createdAt: Date }).createdAt,
        })),
      ];

      const recentActivity = combinedRecent
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);

      const topPerformers = [...rows]
        .sort((a, b) => b.avgProgress - a.avgProgress)
        .slice(0, 5)
        .map((r) => ({ name: r.name, course: '', progress: r.avgProgress }));

      const cohort = await collegeCohortService.computeCohortStatus(college);

      return {
        kpis: {
          totalStudentsEnrolled: userIds.length,
          activeCourses: activeCourseIds.length + activeEventIds.length,
          partnershipTier: college.partnershipTier,
          cohortLimit: cohort.limit,
          cohortRemaining: cohort.remaining,
        },
        activeEventIds: activeEventIds.map((id) => String(id)),
        activeCourseIds: activeCourseIds.map((id) => String(id)),
        enrollmentTrend: {
          weekly: weeklyTrend,
          monthly: monthlyTrend,
          yearly: yearlyTrend,
        },
        topPerformers,
        recentActivity,
      };
    } catch (error: any) {
      logger.error('Get college dashboard error:', error);
      throw error;
    }
  }

  // --- Delegated Profile & Settings Methods ---

  public async getProfileOrThrow(userId: string): Promise<ICollegeProfile> {
    return collegeProfileService.getProfileOrThrow(userId);
  }

  public async resolveStudentUserIds(college: ICollegeProfile): Promise<mongoose.Types.ObjectId[]> {
    return collegeProfileService.resolveStudentUserIds(college);
  }

  public async getProfile(userId: string): Promise<ICollegeProfile> {
    return collegeProfileService.getProfile(userId);
  }

  public async updateProfile(userId: string, data: UpdateCollegeProfileData): Promise<ICollegeProfile> {
    return collegeProfileService.updateProfile(userId, data);
  }

  public async getSettings(userId: string) {
    return collegeProfileService.getSettings(userId);
  }

  public async updateAccount(userId: string, data: { institutionName?: string; phone?: string }) {
    return collegeProfileService.updateAccount(userId, data);
  }

  public async updateNotificationPreferences(
    userId: string,
    prefs: Partial<ICollegeProfile['notificationPreferences']>
  ) {
    return collegeProfileService.updateNotificationPreferences(userId, prefs);
  }

  public async createSupportTicket(userId: string, data: { subject: string; message: string }): Promise<ISupportTicket> {
    return collegeProfileService.createSupportTicket(userId, data);
  }

  public async getSupportTickets(userId: string): Promise<ISupportTicket[]> {
    return collegeProfileService.getSupportTickets(userId);
  }

  // --- Delegated Cohort & Subscription Methods ---

  public async getCohortStatus(userId: string): Promise<CohortStatus> {
    return collegeCohortService.getCohortStatus(userId);
  }

  public async getStudents(
    userId: string,
    options: { status?: StudentStatus; search?: string; page?: number; limit?: number } = {}
  ) {
    return collegeCohortService.getStudents(userId, options);
  }

  public async getPartnership(userId: string) {
    return collegeCohortService.getPartnership(userId);
  }

  public async activateSubscription(userId: string, tier: PartnershipTier): Promise<CohortStatus> {
    return collegeCohortService.activateSubscription(userId, tier);
  }

  public async requestUpgrade(
    userId: string,
    data: { requestedTier: PartnershipTier; note?: string }
  ): Promise<ICollegePartnershipRequest> {
    return collegeCohortService.requestUpgrade(userId, data);
  }

  public async getReports(userId: string): Promise<CollegeMonthlyReport[]> {
    return collegeCohortService.getReports(userId);
  }

  // --- Delegated Student Import Methods ---

  public async importStudents(
    userId: string,
    input: {
      students?: ImportStudentInput[];
      csv?: string;
      eventIds?: string[];
      defaultPassword?: string;
    }
  ): Promise<ImportStudentsResult> {
    return collegeImportService.importStudents(userId, input);
  }

  // --- Delegated Attendance Methods ---

  public async getAttendance(
    collegeUserId: string,
    filters: {
      batchId?: string;
      studentId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    return collegeAttendanceService.getAttendance(collegeUserId, filters);
  }

  public async getAttendanceSummary(collegeUserId: string): Promise<any[]> {
    return collegeAttendanceService.getAttendanceSummary(collegeUserId);
  }

  // --- Delegated Event Access & Orders Methods ---

  public async getEventAccessStatus(userId: string, eventId: string) {
    return collegeEventAccessService.getEventAccessStatus(userId, eventId);
  }

  public async updateEventAccess(
    userId: string,
    eventId: string,
    payload: { studentIds: string[]; action: 'grant' | 'revoke' }
  ) {
    return collegeEventAccessService.updateEventAccess(userId, eventId, payload);
  }

  public async createEventOrder(
    collegeUserId: string,
    eventId: string,
    batchId?: string,
    customAmount?: number
  ) {
    return collegeEventAccessService.createEventOrder(collegeUserId, eventId, batchId, customAmount);
  }

  public async verifyEventPayment(
    collegeUserId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature?: string
  ) {
    return collegeEventAccessService.verifyEventPayment(
      collegeUserId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
  }

  // --- Delegated Ambassador Methods ---

  public async activateAmbassadors(collegeUserId: string, studentUserIds: string[]) {
    return collegeAmbassadorService.activateAmbassadors(collegeUserId, studentUserIds);
  }

  public async getAmbassadors(collegeUserId: string): Promise<any[]> {
    return collegeAmbassadorService.getAmbassadors(collegeUserId);
  }

  public async deactivateAmbassador(collegeUserId: string, studentUserId: string): Promise<IStudentProfile> {
    return collegeAmbassadorService.deactivateAmbassador(collegeUserId, studentUserId);
  }
}

export const collegeDashboardService = CollegeDashboardService.getInstance();
