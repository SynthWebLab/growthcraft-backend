import mongoose from 'mongoose';
import crypto from 'crypto';
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
import { Bootcamp } from '@/database/models/Bootcamp.model';
import { StudentProfile, IStudentProfile } from '@/database/models/StudentProfile.model';
import { SupportTicket, ISupportTicket } from '@/database/models/SupportTicket.model';
import { User, IUser } from '@/database/models/User.model';
import { UserRole } from '@/common/constants/user.constants';
import { AppError } from '@/common/errors/AppError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';
import { CohortLimitError } from '@/common/errors/CohortLimitError';
import { logger } from '@/common/utils/logger.util';

/**
 * Enrollment statuses that count as "active" for a student. The CourseEnrollment
 * model only tracks pending/confirmed/cancelled, so these two are the live ones.
 */
const ACTIVE_ENROLLMENT_STATUSES = ['pending', 'confirmed'];

export type StudentStatus = 'active' | 'completed' | 'pending';

export interface CollegeStudentRow {
  userId: string;
  name: string;
  email: string;
  courses: number;
  avgProgress: number;
  status: StudentStatus;
  lastActive: Date;
}

export interface CohortStatus {
  subscribed: boolean;
  tier: PartnershipTier;
  limit: number | null;
  used: number;
  remaining: number | null;
  unlimited: boolean;
}

export interface CollegeDashboardSummary {
  kpis: {
    totalStudentsEnrolled: number;
    activeCourses: number;
    partnershipTier: PartnershipTier;
    cohortLimit: number | null;
    cohortRemaining: number | null;
  };
  enrollmentTrend: { month: string; students: number }[];
  topPerformers: { name: string; course: string; progress: number }[];
  recentActivity: { text: string; date: Date }[];
}

export interface ImportStudentInput {
  fullName: string;
  email: string;
  phone: string;
  enrollmentNumber?: string;
  degree?: string;
  branch?: string;
  yearOfStudy?: number;
}

export interface ImportStudentsResult {
  created: number;
  linkedExisting: number;
  alreadyInCohort: number;
  eventsEnrolled: number;
  skipped: { email: string; reason: string }[];
  cohort: CohortStatus;
}

export interface CollegeMonthlyReport {
  month: string;
  enrollments: number;
  completionRate: string;
}

export interface UpdateCollegeProfileData {
  collegeName?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  contactPerson?: {
    name?: string;
    designation?: string;
    email?: string;
    phone?: string;
  };
}

/**
 * Static tier benefit/comparison config (mirrors the frontend partnership page).
 * Tiers are a business catalogue, not user data, so they live here rather than the DB.
 */
const TIER_BENEFITS: Record<PartnershipTier, string[]> = {
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

const TIER_COMPARISON = [
  { label: 'Students per cohort', values: ['Up to 50', 'Up to 150', 'Unlimited'] },
  { label: 'Mentor sessions / month', values: ['4', '12', 'Unlimited'] },
  { label: 'Branded portal', values: [false, true, true] },
  { label: 'Dedicated SPOC', values: [false, true, true] },
  { label: 'Placement support', values: [true, true, true] },
  { label: 'Analytics dashboard', values: [false, false, true] },
];

const MONTH_LABELS = [
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
   * Fetch the authenticated college's profile or throw if it does not exist.
   */
  public async getProfileOrThrow(userId: string): Promise<ICollegeProfile> {
    const profile = await CollegeProfile.findOne({ userId }).exec();
    if (!profile) {
      throw new NotFoundError('College profile not found');
    }
    return profile;
  }

  /**
   * Resolve the set of student user ids that belong to a college.
   * Primary source is the explicit `registeredStudents` list; if that is empty
   * we fall back to matching student profiles by college name.
   */
  private async resolveStudentUserIds(
    college: ICollegeProfile
  ): Promise<mongoose.Types.ObjectId[]> {
    if (college.registeredStudents && college.registeredStudents.length > 0) {
      return college.registeredStudents;
    }

    if (college.collegeName) {
      const profiles = await StudentProfile.find({ collegeName: college.collegeName })
        .select('userId')
        .lean()
        .exec();
      return profiles.map((p) => p.userId);
    }

    return [];
  }

  /**
   * Build the per-student rows used by the students table and dashboard.
   * Note: avgProgress is derived from completed/enrolled course counts on the
   * student profile, as the platform does not yet track per-course progress %.
   */
  private async buildStudentRows(userIds: mongoose.Types.ObjectId[]): Promise<CollegeStudentRow[]> {
    if (userIds.length === 0) {
      return [];
    }

    const [users, profiles, enrollmentCounts] = await Promise.all([
      User.find({ _id: { $in: userIds }, role: UserRole.STUDENT })
        .select('fullName email updatedAt')
        .lean()
        .exec(),
      StudentProfile.find({ userId: { $in: userIds } })
        .select('userId enrolledCourses completedCourses')
        .lean()
        .exec(),
      CourseEnrollment.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        { $match: { userId: { $in: userIds }, status: { $in: ACTIVE_ENROLLMENT_STATUSES } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
    ]);

    const profileByUser = new Map<string, IStudentProfile>(
      profiles.map((p) => [String(p.userId), p as unknown as IStudentProfile])
    );
    const countByUser = new Map<string, number>(
      enrollmentCounts.map((c) => [String(c._id), c.count])
    );

    return users.map((user) => {
      const idStr = String(user._id);
      const profile = profileByUser.get(idStr);
      const enrolled = profile?.enrolledCourses?.length ?? 0;
      const completed = profile?.completedCourses?.length ?? 0;
      const enrollmentCount = countByUser.get(idStr) ?? enrolled;

      const avgProgress = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;

      let status: StudentStatus;
      if (enrolled > 0 && completed >= enrolled) {
        status = 'completed';
      } else if (enrollmentCount > 0 || enrolled > 0) {
        status = 'active';
      } else {
        status = 'pending';
      }

      return {
        userId: idStr,
        name: user.fullName,
        email: user.email,
        courses: enrollmentCount,
        avgProgress,
        status,
        lastActive: (user as unknown as IUser).updatedAt,
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
      const college = await this.getProfileOrThrow(userId);
      const userIds = await this.resolveStudentUserIds(college);
      let rows = await this.buildStudentRows(userIds);

      if (options.status) {
        rows = rows.filter((r) => r.status === options.status);
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
   * Aggregated dashboard summary: KPIs, enrollment trend, top performers, activity.
   */
  public async getDashboard(userId: string): Promise<CollegeDashboardSummary> {
    try {
      const college = await this.getProfileOrThrow(userId);
      const userIds = await this.resolveStudentUserIds(college);
      const rows = await this.buildStudentRows(userIds);

      const [activeCourseIds, trend, recent] = await Promise.all([
        CourseEnrollment.distinct('courseId', {
          userId: { $in: userIds },
          status: { $in: ACTIVE_ENROLLMENT_STATUSES },
        }),
        this.getEnrollmentTrend(userIds),
        CourseEnrollment.find({ userId: { $in: userIds } })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('fullName title createdAt')
          .lean()
          .exec(),
      ]);

      const topPerformers = [...rows]
        .sort((a, b) => b.avgProgress - a.avgProgress)
        .slice(0, 5)
        .map((r) => ({ name: r.name, course: '', progress: r.avgProgress }));

      const recentActivity = recent.map((e) => ({
        text: `${e.fullName} enrolled in ${e.title}`,
        date: (e as { createdAt: Date }).createdAt,
      }));

      const cohort = this.computeCohortStatus(college);

      return {
        kpis: {
          totalStudentsEnrolled: cohort.used,
          activeCourses: activeCourseIds.length,
          partnershipTier: college.partnershipTier,
          cohortLimit: cohort.limit,
          cohortRemaining: cohort.remaining,
        },
        enrollmentTrend: trend,
        topPerformers,
        recentActivity,
      };
    } catch (error: any) {
      logger.error('Get college dashboard error:', error);
      throw error;
    }
  }

  /**
   * Compute cohort usage vs the tier cap. `used` is the authoritative count of
   * students explicitly registered to the college (registeredStudents).
   */
  private computeCohortStatus(college: ICollegeProfile): CohortStatus {
    const limit = COHORT_LIMITS[college.partnershipTier];
    const used = college.registeredStudents?.length ?? 0;
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
    const college = await this.getProfileOrThrow(userId);
    return this.computeCohortStatus(college);
  }

  /**
   * Monthly enrolment counts for the trailing 6 months (including the current one).
   */
  private async getEnrollmentTrend(
    userIds: mongoose.Types.ObjectId[]
  ): Promise<{ month: string; students: number }[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const grouped = userIds.length
      ? await CourseEnrollment.aggregate<{ _id: { y: number; m: number }; count: number }>([
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
      : [];

    const countByKey = new Map<string, number>(
      grouped.map((g) => [`${g._id.y}-${g._id.m}`, g.count])
    );

    const result: { month: string; students: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      result.push({ month: MONTH_LABELS[d.getMonth()], students: countByKey.get(key) ?? 0 });
    }
    return result;
  }

  /**
   * The college's profile (institution details + point of contact).
   */
  public async getProfile(userId: string): Promise<ICollegeProfile> {
    return this.getProfileOrThrow(userId);
  }

  /**
   * Update institution details and point-of-contact fields (partial update).
   */
  public async updateProfile(
    userId: string,
    data: UpdateCollegeProfileData
  ): Promise<ICollegeProfile> {
    try {
      const update: Record<string, unknown> = {};
      if (data.collegeName !== undefined) {
        update.collegeName = data.collegeName;
      }
      if (data.website !== undefined) {
        update.website = data.website;
      }

      // Nested fields use dot-notation so we don't clobber unspecified sub-fields.
      if (data.address) {
        for (const [k, v] of Object.entries(data.address)) {
          if (v !== undefined) {
            update[`address.${k}`] = v;
          }
        }
      }
      if (data.contactPerson) {
        for (const [k, v] of Object.entries(data.contactPerson)) {
          if (v !== undefined) {
            update[`contactPerson.${k}`] = v;
          }
        }
      }

      const profile = await CollegeProfile.findOneAndUpdate(
        { userId },
        { $set: update },
        { new: true, runValidators: true }
      ).exec();

      if (!profile) {
        throw new NotFoundError('College profile not found');
      }
      return profile;
    } catch (error: any) {
      logger.error('Update college profile error:', error);
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
    const college = await this.getProfileOrThrow(userId);
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
   * Activate (or switch) the college's subscription to the given tier. This is the
   * "choose a plan" action — it sets the tier active immediately and stamps the
   * start date. Used both for first-time subscription and tier changes.
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
      return this.computeCohortStatus(profile);
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
      const college = await this.getProfileOrThrow(userId);

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
   * Monthly reports for the trailing 6 months. Enrollment counts are real;
   * completionRate is approximated from confirmed-vs-total enrollments until
   * per-course progress tracking exists.
   */
  public async getReports(userId: string): Promise<CollegeMonthlyReport[]> {
    try {
      const college = await this.getProfileOrThrow(userId);
      const userIds = await this.resolveStudentUserIds(college);

      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const grouped = userIds.length
        ? await CourseEnrollment.aggregate<{
            _id: { y: number; m: number };
            total: number;
            confirmed: number;
          }>([
            { $match: { userId: { $in: userIds }, createdAt: { $gte: start } } },
            {
              $group: {
                _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
                total: { $sum: 1 },
                confirmed: {
                  $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
                },
              },
            },
          ])
        : [];

      const byKey = new Map(grouped.map((g) => [`${g._id.y}-${g._id.m}`, g]));

      const reports: CollegeMonthlyReport[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const entry = byKey.get(key);
        const total = entry?.total ?? 0;
        const completionRate = total > 0 ? Math.round(((entry?.confirmed ?? 0) / total) * 100) : 0;
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

  /**
   * Account settings view: institution name, email (read-only), phone, prefs.
   */
  public async getSettings(userId: string): Promise<{
    institutionName: string;
    email: string;
    phone: string;
    notificationPreferences: ICollegeProfile['notificationPreferences'];
  }> {
    const [college, user] = await Promise.all([
      this.getProfileOrThrow(userId),
      User.findById(userId).select('email phone').lean().exec(),
    ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      institutionName: college.collegeName,
      email: user.email,
      phone: user.phone,
      notificationPreferences: college.notificationPreferences,
    };
  }

  /**
   * Update editable account fields: institution name (profile) and phone (user).
   */
  public async updateAccount(
    userId: string,
    data: { institutionName?: string; phone?: string }
  ): Promise<{ institutionName: string; phone: string }> {
    try {
      if (data.institutionName !== undefined) {
        await CollegeProfile.updateOne(
          { userId },
          { $set: { collegeName: data.institutionName } },
          { runValidators: true }
        ).exec();
      }
      if (data.phone !== undefined) {
        await User.updateOne(
          { _id: userId },
          { $set: { phone: data.phone } },
          { runValidators: true }
        ).exec();
      }

      const [college, user] = await Promise.all([
        this.getProfileOrThrow(userId),
        User.findById(userId).select('phone').lean().exec(),
      ]);

      return { institutionName: college.collegeName, phone: user?.phone ?? '' };
    } catch (error: any) {
      logger.error('Update college account error:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences (partial update of the four toggles).
   */
  public async updateNotificationPreferences(
    userId: string,
    prefs: Partial<ICollegeProfile['notificationPreferences']>
  ): Promise<ICollegeProfile['notificationPreferences']> {
    try {
      const update: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(prefs)) {
        if (v !== undefined) {
          update[`notificationPreferences.${k}`] = v;
        }
      }

      const profile = await CollegeProfile.findOneAndUpdate(
        { userId },
        { $set: update },
        { new: true, runValidators: true }
      ).exec();

      if (!profile) {
        throw new NotFoundError('College profile not found');
      }
      return profile.notificationPreferences;
    } catch (error: any) {
      logger.error('Update college notification preferences error:', error);
      throw error;
    }
  }

  /**
   * Create a support ticket (reuses the shared SupportTicket model).
   */
  public async createSupportTicket(
    userId: string,
    data: { subject: string; message: string }
  ): Promise<ISupportTicket> {
    try {
      const ticket = await SupportTicket.create({
        userId,
        subject: data.subject,
        message: data.message,
        status: 'open',
      });
      logger.info(`College support ticket ${ticket._id} created by user ${userId}`);
      return ticket;
    } catch (error: any) {
      logger.error('Create college support ticket error:', error);
      throw error;
    }
  }

  /**
   * The college's support tickets (most recent first).
   */
  public async getSupportTickets(userId: string): Promise<ISupportTicket[]> {
    try {
      return await SupportTicket.find({ userId }).sort({ createdAt: -1 }).exec();
    } catch (error: any) {
      logger.error('Get college support tickets error:', error);
      throw error;
    }
  }

  /**
   * Parse a CSV string into student rows. Tolerates quoted values and maps a few
   * common header aliases. Returns one record per data row (header is required).
   */
  private parseCsv(csv: string): ImportStudentInput[] {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) {
      throw new ValidationError('CSV must contain a header row and at least one student row');
    }

    const splitRow = (row: string): string[] => {
      const out: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
          if (inQuotes && row[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          out.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      return out.map((c) => c.trim());
    };

    const aliasMap: Record<string, keyof ImportStudentInput> = {
      name: 'fullName',
      fullname: 'fullName',
      'full name': 'fullName',
      email: 'email',
      'email address': 'email',
      phone: 'phone',
      mobile: 'phone',
      'phone number': 'phone',
      enrollmentnumber: 'enrollmentNumber',
      enrollment: 'enrollmentNumber',
      roll: 'enrollmentNumber',
      'roll number': 'enrollmentNumber',
      degree: 'degree',
      branch: 'branch',
      yearofstudy: 'yearOfStudy',
      year: 'yearOfStudy',
    };

    const headers = splitRow(lines[0]).map((h) => h.toLowerCase());
    const fields = headers.map((h) => aliasMap[h]);

    return lines.slice(1).map((line) => {
      const cells = splitRow(line);
      const record: Record<string, unknown> = {};
      fields.forEach((field, idx) => {
        if (!field) {
          return;
        }
        const value = cells[idx];
        if (value === undefined || value === '') {
          return;
        }
        if (field === 'yearOfStudy') {
          const year = Number(value);
          if (!Number.isNaN(year)) {
            record[field] = year;
          }
        } else {
          record[field] = value;
        }
      });
      return record as unknown as ImportStudentInput;
    });
  }

  /**
   * Bulk-import students into the college's cohort from a parsed `students` array
   * and/or a raw `csv` string. Enforces the tier cohort cap *before* writing:
   * if the import would push the cohort past the limit it throws CohortLimitError
   * and nothing is created. Imported students become real student accounts (so
   * they can sign into the student dashboard) and can optionally be enrolled into
   * the supplied events.
   */
  public async importStudents(
    userId: string,
    input: {
      students?: ImportStudentInput[];
      csv?: string;
      eventIds?: string[];
      defaultPassword?: string;
    }
  ): Promise<ImportStudentsResult> {
    try {
      const college = await this.getProfileOrThrow(userId);

      // 0. A subscription is required before any cohort import/export.
      if (!college.partnershipActive) {
        throw new AppError(
          'No active subscription. Choose a partnership plan before importing students.',
          403,
          'SUBSCRIPTION_REQUIRED'
        );
      }

      // 1. Collect rows from JSON array and/or CSV.
      const rows: ImportStudentInput[] = [
        ...(input.students ?? []),
        ...(input.csv ? this.parseCsv(input.csv) : []),
      ];
      if (rows.length === 0) {
        throw new ValidationError('Provide at least one student via "students" or "csv"');
      }

      // 2. Validate + de-duplicate by email within the payload.
      const skipped: { email: string; reason: string }[] = [];
      const seen = new Set<string>();
      const valid: ImportStudentInput[] = [];
      for (const row of rows) {
        const email = (row.email ?? '').toLowerCase().trim();
        if (!row.fullName || !email || !row.phone) {
          skipped.push({
            email: email || '(missing)',
            reason: 'Missing fullName, email, or phone',
          });
          continue;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          skipped.push({ email, reason: 'Invalid email format' });
          continue;
        }
        if (seen.has(email)) {
          skipped.push({ email, reason: 'Duplicate row in import' });
          continue;
        }
        seen.add(email);
        valid.push({ ...row, email });
      }

      if (valid.length === 0) {
        throw new ValidationError('No valid student rows to import');
      }

      // 3. Map existing users; determine which rows are NEW to the cohort.
      const existingUsers = await User.find({ email: { $in: valid.map((v) => v.email) } })
        .select('email role')
        .lean()
        .exec();
      const userByEmail = new Map<string, { _id: mongoose.Types.ObjectId; role?: string }>(
        existingUsers.map((u) => [u.email, { _id: u._id, role: u.role }])
      );
      const cohortSet = new Set((college.registeredStudents ?? []).map((id) => String(id)));

      const importable = valid.filter((row) => {
        const existing = userByEmail.get(row.email);
        if (existing && existing.role !== UserRole.STUDENT) {
          skipped.push({ email: row.email, reason: 'Email belongs to a non-student account' });
          return false;
        }
        return true;
      });

      const newToCohort = importable.filter((row) => {
        const existing = userByEmail.get(row.email);
        return !existing || !cohortSet.has(String(existing._id));
      });

      // 4. Enforce the tier cohort cap BEFORE any writes.
      const limit = COHORT_LIMITS[college.partnershipTier];
      const used = cohortSet.size;
      if (limit !== null && used + newToCohort.length > limit) {
        const currentIndex = PARTNERSHIP_TIERS.indexOf(college.partnershipTier);
        const nextTier =
          currentIndex < PARTNERSHIP_TIERS.length - 1 ? PARTNERSHIP_TIERS[currentIndex + 1] : null;
        throw new CohortLimitError({
          tier: college.partnershipTier,
          limit,
          used,
          attempted: newToCohort.length,
          remaining: Math.max(0, limit - used),
          nextTier,
        });
      }

      // 5. Create / link students.
      let created = 0;
      let linkedExisting = 0;
      let alreadyInCohort = 0;
      const newCohortIds: mongoose.Types.ObjectId[] = [];

      for (const row of importable) {
        let user = userByEmail.get(row.email);

        if (!user) {
          const createdUser = await User.create({
            fullName: row.fullName,
            email: row.email,
            phone: row.phone,
            password: input.defaultPassword || crypto.randomBytes(12).toString('base64url'),
            role: UserRole.STUDENT,
            isEmailVerified: false,
          });
          await StudentProfile.create({
            userId: createdUser._id,
            collegeName: college.collegeName,
            enrollmentNumber: row.enrollmentNumber,
            degree: row.degree,
            branch: row.branch,
            yearOfStudy: row.yearOfStudy,
          });
          user = { _id: createdUser._id };
          userByEmail.set(row.email, { _id: user._id, role: UserRole.STUDENT });
          created++;
        } else {
          // Existing student: ensure a profile exists and is tagged to this college.
          await StudentProfile.updateOne(
            { userId: user._id },
            { $setOnInsert: { userId: user._id }, $set: { collegeName: college.collegeName } },
            { upsert: true, runValidators: true }
          ).exec();
          if (cohortSet.has(String(user._id))) {
            alreadyInCohort++;
          } else {
            linkedExisting++;
          }
        }

        if (!cohortSet.has(String(user._id))) {
          cohortSet.add(String(user._id));
          newCohortIds.push(user._id);
        }
      }

      // 6. Persist new cohort members.
      if (newCohortIds.length > 0) {
        await CollegeProfile.updateOne(
          { userId },
          {
            $addToSet: { registeredStudents: { $each: newCohortIds } },
            $set: { totalStudents: cohortSet.size },
          }
        ).exec();
      }

      // 7. Optionally enroll all imported students into the supplied events.
      let eventsEnrolled = 0;
      if (input.eventIds && input.eventIds.length > 0) {
        eventsEnrolled = await this.enrollCohortInEvents(importable, input.eventIds, userByEmail);
      }

      const refreshed = await this.getProfileOrThrow(userId);
      return {
        created,
        linkedExisting,
        alreadyInCohort,
        eventsEnrolled,
        skipped,
        cohort: this.computeCohortStatus(refreshed),
      };
    } catch (error: any) {
      logger.error('Import college students error:', error);
      throw error;
    }
  }

  /**
   * Enroll the given students into the given events (best-effort; duplicates and
   * unknown events are skipped). Returns the number of enrollments created.
   */
  private async enrollCohortInEvents(
    students: ImportStudentInput[],
    eventIds: string[],
    userByEmail: Map<string, { _id: mongoose.Types.ObjectId }>
  ): Promise<number> {
    const validEventIds = eventIds.filter((id) => mongoose.isValidObjectId(id));
    if (validEventIds.length === 0) {
      return 0;
    }

    const events = await Bootcamp.find({ _id: { $in: validEventIds } })
      .select('title type')
      .lean()
      .exec();

    let enrolled = 0;
    for (const event of events) {
      for (const row of students) {
        const user = userByEmail.get(row.email);
        try {
          await EventEnrollment.create({
            userId: user?._id,
            eventId: event._id,
            eventType: event.type,
            fullName: row.fullName,
            email: row.email,
            phone: row.phone,
            title: event.title,
            status: 'confirmed',
          });
          enrolled++;
        } catch {
          // Duplicate enrollment (unique index) or validation issue — skip silently.
        }
      }
    }
    return enrolled;
  }
}

export const collegeDashboardService = CollegeDashboardService.getInstance();
