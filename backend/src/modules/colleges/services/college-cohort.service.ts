import mongoose from 'mongoose';
import {
  CollegeProfile,
  ICollegeProfile,
  PARTNERSHIP_TIERS,
  PartnershipTier,
  COHORT_LIMITS,
} from '@/database/models/CollegeProfile.model';
import {
  CollegePartnershipRequest,
  ICollegePartnershipRequest,
} from '@/database/models/CollegePartnershipRequest.model';
import { CourseEnrollment } from '@/database/models/CourseEnrollment.model';
import { EventEnrollment } from '@/database/models/EventEnrollment.model';
import { StudentProfile } from '@/database/models/StudentProfile.model';
import { User, IUser } from '@/database/models/User.model';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';
import { CohortLimitError } from '@/common/errors/CohortLimitError';
import { logger } from '@/common/utils/logger.util';
import { collegeProfileService } from './college-profile.service';

export const ACTIVE_ENROLLMENT_STATUSES = ['pending', 'confirmed'];

export type StudentStatus = 'active' | 'completed' | 'pending';

export interface CollegeStudentRow {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  enrollmentNumber?: string;
  degree?: string;
  branch?: string;
  yearOfStudy?: number;
  courses: number;
  avgProgress: number;
  status: StudentStatus;
  lastActive: Date;
  isAmbassador: boolean;
}

export interface CohortStatus {
  subscribed: boolean;
  tier: PartnershipTier;
  limit: number | null;
  used: number;
  remaining: number | null;
  unlimited: boolean;
}

export interface CollegeMonthlyReport {
  month: string;
  enrollments: number;
  completionRate: string;
}

export const TIER_BENEFITS: Record<PartnershipTier, string[]> = {
  Silver: ['Up to 50 students per cohort', 'Mentor sessions (4/month)', 'Placement support'],
  Gold: [
    'Up to 150 students per cohort',
    'Mentor sessions (12/month)',
    'Co-branded portal',
    'Dedicated SPOC',
    'Placement support',
  ],
  Platinum: [
    'Unlimited students per cohort',
    'Unlimited mentor sessions',
    'Co-branded portal',
    'Dedicated SPOC',
    'Placement support',
    'Analytics dashboard',
  ],
};

export const TIER_COMPARISON = [
  { label: 'Students per cohort', values: ['Up to 50', 'Up to 150', 'Unlimited'] },
  { label: 'Mentor sessions / month', values: ['4', '12', 'Unlimited'] },
  { label: 'Branded portal', values: [false, true, true] },
  { label: 'Dedicated SPOC', values: [false, true, true] },
  { label: 'Placement support', values: [true, true, true] },
  { label: 'Analytics dashboard', values: [false, false, true] },
];

export const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export class CollegeCohortService {
  private static instance: CollegeCohortService;

  private constructor() {}

  public static getInstance(): CollegeCohortService {
    if (!CollegeCohortService.instance) {
      CollegeCohortService.instance = new CollegeCohortService();
    }
    return CollegeCohortService.instance;
  }

  /**
   * Compute cohort usage vs the tier cap. `used` is the authoritative count of
   * active student enrollments (courses + events) in the college.
   */
  public async computeCohortStatus(
    college: ICollegeProfile,
    session?: mongoose.ClientSession
  ): Promise<CohortStatus> {
    const limit = COHORT_LIMITS[college.partnershipTier];
    const userIds = await collegeProfileService.resolveStudentUserIds(college);

    let used = 0;
    if (userIds.length > 0) {
      const [courseEnrollmentsCount, eventEnrollmentsCount] = await Promise.all([
        CourseEnrollment.countDocuments({
          userId: { $in: userIds },
          status: { $in: ACTIVE_ENROLLMENT_STATUSES },
        })
          .session(session || (null as any))
          .exec(),
        EventEnrollment.countDocuments({
          userId: { $in: userIds },
          status: { $in: ['pending', 'confirmed'] },
        })
          .session(session || (null as any))
          .exec(),
      ]);
      used = courseEnrollmentsCount + eventEnrollmentsCount;
    }

    return {
      subscribed: college.partnershipActive,
      tier: college.partnershipTier,
      limit,
      used,
      remaining: limit === null ? null : Math.max(0, limit - used),
      unlimited: limit === null,
    };
  }

  /**
   * Public cohort status for the authenticated college.
   */
  public async getCohortStatus(userId: string): Promise<CohortStatus> {
    const college = await collegeProfileService.getProfileOrThrow(userId);
    return await this.computeCohortStatus(college);
  }

  /**
   * Build the per-student rows used by the students table and dashboard.
   */
  public async buildStudentRows(userIds: mongoose.Types.ObjectId[]): Promise<CollegeStudentRow[]> {
    if (userIds.length === 0) {
      return [];
    }

    const [users, profiles, courseEnrollmentCounts, eventEnrollmentCounts] = await Promise.all([
      User.find({ _id: { $in: userIds } })
        .select('fullName email phone updatedAt role')
        .lean()
        .exec(),
      StudentProfile.find({ userId: { $in: userIds } })
        .select('userId enrolledCourses completedCourses isAmbassador enrollmentNumber degree branch yearOfStudy')
        .lean()
        .exec(),
      CourseEnrollment.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        { $match: { userId: { $in: userIds }, status: { $in: ACTIVE_ENROLLMENT_STATUSES } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
      EventEnrollment.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        { $match: { userId: { $in: userIds }, status: { $in: ['pending', 'confirmed'] } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
    ]);

    const getUserIdStr = (val: any): string => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (val._id) return String(val._id);
      return String(val);
    };

    const profileByUser = new Map<string, any>();
    for (const p of profiles) {
      const uId = getUserIdStr((p as any).userId);
      if (uId) {
        profileByUser.set(uId, p);
      }
    }

    const courseCountByUser = new Map<string, number>(
      courseEnrollmentCounts.map((c) => [getUserIdStr(c._id), c.count])
    );
    const eventCountByUser = new Map<string, number>(
      eventEnrollmentCounts.map((c) => [getUserIdStr(c._id), c.count])
    );

    return users.map((user) => {
      const idStr = String(user._id);
      const profile = profileByUser.get(idStr);
      const enrolled = profile?.enrolledCourses?.length ?? 0;
      const completed = profile?.completedCourses?.length ?? 0;
      const courseCount = courseCountByUser.get(idStr) ?? enrolled;
      const eventCount = eventCountByUser.get(idStr) ?? 0;
      const totalEnrollmentCount = courseCount + eventCount;

      const avgProgress = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;

      const isAmbassador = (profile as any)?.isAmbassador ?? false;

      let status: StudentStatus;
      if (enrolled > 0 && completed >= enrolled) {
        status = 'completed';
      } else if (totalEnrollmentCount > 0 || enrolled > 0 || isAmbassador) {
        status = 'active';
      } else {
        status = 'pending';
      }

      return {
        userId: idStr,
        name: user.fullName,
        email: user.email,
        phone: (user as any).phone || '',
        enrollmentNumber: profile?.enrollmentNumber || '',
        degree: profile?.degree || '',
        branch: profile?.branch || '',
        yearOfStudy: profile?.yearOfStudy || null,
        courses: totalEnrollmentCount,
        avgProgress,
        status,
        lastActive: (user as unknown as IUser).updatedAt,
        isAmbassador,
      };
    });
  }

  /**
   * Paginated, filterable list of students enrolled from the college's campus.
   */
  public async getStudents(
    userId: string,
    options: { status?: StudentStatus; search?: string; page?: number; limit?: number } = {}
  ): Promise<{ students: CollegeStudentRow[]; total: number; page: number; limit: number }> {
    try {
      const college = await collegeProfileService.getProfileOrThrow(userId);
      const userIds = await collegeProfileService.resolveStudentUserIds(college);
      let rows = await this.buildStudentRows(userIds);

      if (options.status) {
        if (options.status === 'active') {
          rows = rows.filter((r) => r.status === 'active' || r.isAmbassador);
        } else if (options.status === 'pending') {
          rows = rows.filter((r) => r.status === 'pending' && !r.isAmbassador);
        } else {
          rows = rows.filter((r) => r.status === options.status);
        }
      }
      if (options.search) {
        const q = options.search.toLowerCase();
        rows = rows.filter(
          (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
        );
      }

      const total = rows.length;
      const page = options.page && options.page > 0 ? options.page : 1;
      const limit = options.limit && options.limit > 0 ? options.limit : 10;
      const start = (page - 1) * limit;
      const paged = rows.slice(start, start + limit);

      return { students: paged, total, page, limit };
    } catch (error: any) {
      logger.error('Get college students error:', error);
      throw error;
    }
  }

  /**
   * Partnership details: current tier, SPOC, benefits and tier comparison table.
   */
  public async getPartnership(userId: string): Promise<{
    active: boolean;
    currentTier: PartnershipTier;
    nextTier: PartnershipTier | null;
    startDate?: Date;
    spoc?: ICollegeProfile['spoc'];
    benefits: string[];
    tiers: PartnershipTier[];
    comparison: typeof TIER_COMPARISON;
  }> {
    const college = await collegeProfileService.getProfileOrThrow(userId);
    const currentIndex = PARTNERSHIP_TIERS.indexOf(college.partnershipTier);
    const nextTier =
      currentIndex >= 0 && currentIndex < PARTNERSHIP_TIERS.length - 1
        ? PARTNERSHIP_TIERS[currentIndex + 1]
        : null;

    return {
      active: college.partnershipActive,
      currentTier: college.partnershipTier,
      nextTier,
      startDate: college.partnershipStartDate,
      spoc: college.spoc,
      benefits: TIER_BENEFITS[college.partnershipTier],
      tiers: [...PARTNERSHIP_TIERS],
      comparison: TIER_COMPARISON,
    };
  }

  /**
   * Activate (or switch) the college's subscription to the given tier.
   */
  public async activateSubscription(userId: string, tier: PartnershipTier): Promise<CohortStatus> {
    try {
      const profile = await CollegeProfile.findOneAndUpdate(
        { userId },
        {
          $set: {
            partnershipTier: tier,
            partnershipActive: true,
            partnershipStartDate: new Date(),
          },
        },
        { new: true, runValidators: true }
      ).exec();

      if (!profile) {
        throw new NotFoundError('College profile not found');
      }
      logger.info(`College ${userId} subscription activated on ${tier}`);
      return await this.computeCohortStatus(profile);
    } catch (error: any) {
      logger.error('Activate college subscription error:', error);
      throw error;
    }
  }

  /**
   * Submit a request to upgrade to a higher partnership tier.
   */
  public async requestUpgrade(
    userId: string,
    data: { requestedTier: PartnershipTier; note?: string }
  ): Promise<ICollegePartnershipRequest> {
    try {
      const college = await collegeProfileService.getProfileOrThrow(userId);

      const currentIndex = PARTNERSHIP_TIERS.indexOf(college.partnershipTier);
      const requestedIndex = PARTNERSHIP_TIERS.indexOf(data.requestedTier);
      if (requestedIndex <= currentIndex) {
        throw new ValidationError(
          `Requested tier must be higher than the current tier (${college.partnershipTier})`
        );
      }

      const request = await CollegePartnershipRequest.create({
        userId,
        currentTier: college.partnershipTier,
        requestedTier: data.requestedTier,
        note: data.note,
        status: 'pending',
      });

      logger.info(
        `College ${userId} requested upgrade ${college.partnershipTier} -> ${data.requestedTier}`
      );
      return request;
    } catch (error: any) {
      logger.error('College upgrade request error:', error);
      throw error;
    }
  }

  /**
   * Monthly reports for the trailing 6 months.
   * Completion rate uses actual completed status rather than confirmed.
   */
  public async getReports(userId: string): Promise<CollegeMonthlyReport[]> {
    try {
      const college = await collegeProfileService.getProfileOrThrow(userId);
      const userIds = await collegeProfileService.resolveStudentUserIds(college);

      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const [groupedCourses, groupedEvents] = await Promise.all([
        userIds.length
          ? CourseEnrollment.aggregate<{
              _id: { y: number; m: number };
              total: number;
              completed: number;
            }>([
              { $match: { userId: { $in: userIds }, createdAt: { $gte: start } } },
              {
                $group: {
                  _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
                  total: { $sum: 1 },
                  completed: {
                    $sum: { $cond: [{ $in: ['$status', ['completed', 'Completed']] }, 1, 0] },
                  },
                },
              },
            ])
          : Promise.resolve([]),
        userIds.length
          ? EventEnrollment.aggregate<{
              _id: { y: number; m: number };
              total: number;
              completed: number;
            }>([
              { $match: { userId: { $in: userIds }, createdAt: { $gte: start } } },
              {
                $group: {
                  _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
                  total: { $sum: 1 },
                  completed: {
                    $sum: { $cond: [{ $in: ['$status', ['completed', 'Completed']] }, 1, 0] },
                  },
                },
              },
            ])
          : Promise.resolve([]),
      ]);

      const byKey = new Map<string, { total: number; completed: number }>();

      groupedCourses.forEach((g) => {
        const key = `${g._id.y}-${g._id.m}`;
        byKey.set(key, { total: g.total, completed: g.completed });
      });

      groupedEvents.forEach((g) => {
        const key = `${g._id.y}-${g._id.m}`;
        const existing = byKey.get(key) || { total: 0, completed: 0 };
        byKey.set(key, {
          total: existing.total + g.total,
          completed: existing.completed + g.completed,
        });
      });

      const reports: CollegeMonthlyReport[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const entry = byKey.get(key) || { total: 0, completed: 0 };
        const total = entry.total;
        const completionRate = total > 0 ? Math.round((entry.completed / total) * 100) : 0;
        reports.push({
          month: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
          enrollments: total,
          completionRate: `${completionRate}%`,
        });
      }
      return reports;
    } catch (error: any) {
      logger.error('Get college reports error:', error);
      throw error;
    }
  }
}

export const collegeCohortService = CollegeCohortService.getInstance();
