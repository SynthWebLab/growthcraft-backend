import mongoose from 'mongoose';
import crypto from 'crypto';
import { parse } from 'csv-parse/sync';
import {
  CollegeProfile,
  COHORT_LIMITS,
  PARTNERSHIP_TIERS,
} from '@/database/models/CollegeProfile.model';
import { CourseEnrollment } from '@/database/models/CourseEnrollment.model';
import { EventEnrollment } from '@/database/models/EventEnrollment.model';
import { Bootcamp } from '@/database/models/Bootcamp.model';
import { StudentProfile } from '@/database/models/StudentProfile.model';
import { User } from '@/database/models/User.model';
import { UserRole } from '@/common/constants/user.constants';
import { AppError } from '@/common/errors/AppError';
import { ValidationError } from '@/common/errors/ValidationError';
import { CohortLimitError } from '@/common/errors/CohortLimitError';
import { logger } from '@/common/utils/logger.util';
import { collegeProfileService } from './college-profile.service';
import {
  collegeCohortService,
  CohortStatus,
  ACTIVE_ENROLLMENT_STATUSES,
} from './college-cohort.service';

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

export class CollegeImportService {
  private static instance: CollegeImportService;

  private constructor() {}

  public static getInstance(): CollegeImportService {
    if (!CollegeImportService.instance) {
      CollegeImportService.instance = new CollegeImportService();
    }
    return CollegeImportService.instance;
  }

  /**
   * Parse a CSV string into student rows. Tolerates quoted values and maps common header aliases.
   */
  public parseCsv(csv: string): ImportStudentInput[] {
    const normalized = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
    let records: any[];
    try {
      records = parse(normalized, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err: any) {
      throw new ValidationError(`CSV parsing failed: ${err.message}`);
    }

    if (records.length === 0) {
      throw new ValidationError('CSV must contain a header row and at least one student row');
    }

    const aliasMap: Record<string, keyof ImportStudentInput> = {
      name: 'fullName',
      fullname: 'fullName',
      studentname: 'fullName',
      email: 'email',
      emailaddress: 'email',
      mail: 'email',
      phone: 'phone',
      mobile: 'phone',
      mobilenumber: 'phone',
      phonenumber: 'phone',
      phoneno: 'phone',
      contact: 'phone',
      contactnumber: 'phone',
      enrollmentnumber: 'enrollmentNumber',
      enrollment: 'enrollmentNumber',
      roll: 'enrollmentNumber',
      rollnumber: 'enrollmentNumber',
      rollno: 'enrollmentNumber',
      regno: 'enrollmentNumber',
      registrationnumber: 'enrollmentNumber',
      studentid: 'enrollmentNumber',
      degree: 'degree',
      branch: 'branch',
      stream: 'branch',
      department: 'branch',
      yearofstudy: 'yearOfStudy',
      year: 'yearOfStudy',
      classyear: 'yearOfStudy',
    };

    return records.map((record) => {
      const mappedRecord: Record<string, any> = {};
      Object.keys(record).forEach((key) => {
        const normalizedKey = key
          .toLowerCase()
          .replace(/^["']|["']$/g, '')
          .replace(/[\s_-]+/g, '')
          .trim();
        const field = aliasMap[normalizedKey];
        if (field) {
          const value = record[key];
          if (value !== undefined && value !== '') {
            if (field === 'yearOfStudy') {
              const year = Number(value);
              if (!Number.isNaN(year)) {
                mappedRecord[field] = year;
              }
            } else {
              mappedRecord[field] = value;
            }
          }
        }
      });
      return mappedRecord as unknown as ImportStudentInput;
    });
  }

  /**
   * Enroll the given students into the given events.
   */
  public async enrollCohortInEvents(
    students: ImportStudentInput[],
    eventIds: string[],
    userByEmail: Map<string, { _id: mongoose.Types.ObjectId }>,
    session?: mongoose.ClientSession
  ): Promise<number> {
    const validEventIds = eventIds.filter((id) => mongoose.isValidObjectId(id));
    if (validEventIds.length === 0) {
      return 0;
    }

    const events = await Bootcamp.find({ _id: { $in: validEventIds } })
      .select('title type')
      .session(session || null)
      .lean()
      .exec();

    let enrolled = 0;
    for (const event of events) {
      for (const row of students) {
        const user = userByEmail.get(row.email);
        try {
          await EventEnrollment.create(
            [
              {
                userId: user?._id,
                eventId: event._id,
                eventType: event.type,
                fullName: row.fullName,
                email: row.email,
                phone: row.phone,
                title: event.title,
                status: 'confirmed',
              },
            ],
            { session }
          );
          enrolled++;
        } catch {
          // Duplicate enrollment or validation issue — skip silently.
        }
      }
    }
    return enrolled;
  }

  /**
   * Bulk-import students into the college's cohort from a parsed `students` array
   * and/or a raw `csv` string. Fully transactional using Mongoose startTransaction().
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
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const college = await collegeProfileService.getProfileOrThrow(userId);

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
        if (!row.fullName || !email) {
          skipped.push({
            email: email || '(missing)',
            reason: 'Missing fullName or email',
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
        const reasons = skipped
          .map((s) => `${s.email}: ${s.reason}`)
          .slice(0, 5)
          .join('; ');
        throw new ValidationError(
          `No valid student rows to import. Every row was skipped${reasons ? ` — ${reasons}` : ''}. ` +
            `Each row needs a non-empty fullName and email.`
        );
      }

      // 3. Map existing users; determine which rows are NEW to the cohort.
      const emailRegexes = valid.map(
        (v) => new RegExp('^' + v.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i')
      );
      const existingUsers = await User.find({ email: { $in: emailRegexes } })
        .select('email role')
        .session(session)
        .lean()
        .exec();
      const userByEmail = new Map<string, { _id: mongoose.Types.ObjectId; role?: string }>(
        existingUsers.map((u) => [u.email.toLowerCase().trim(), { _id: u._id as any, role: u.role }])
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
      const userIds = await collegeProfileService.resolveStudentUserIds(college);
      let used = 0;
      if (userIds.length > 0) {
        const [courseEnrollmentsCount, eventEnrollmentsCount] = await Promise.all([
          CourseEnrollment.countDocuments({
            userId: { $in: userIds },
            status: { $in: ACTIVE_ENROLLMENT_STATUSES },
          })
            .session(session)
            .exec(),
          EventEnrollment.countDocuments({
            userId: { $in: userIds },
            status: { $in: ['pending', 'confirmed'] },
          })
            .session(session)
            .exec(),
        ]);
        used = courseEnrollmentsCount + eventEnrollmentsCount;
      }

      const newEnrollmentsCount =
        input.eventIds && input.eventIds.length > 0 ? newToCohort.length * input.eventIds.length : 0;
      if (limit !== null && used + newEnrollmentsCount > limit) {
        const currentIndex = PARTNERSHIP_TIERS.indexOf(college.partnershipTier);
        const nextTier =
          currentIndex < PARTNERSHIP_TIERS.length - 1 ? PARTNERSHIP_TIERS[currentIndex + 1] : null;
        throw new CohortLimitError({
          tier: college.partnershipTier,
          limit,
          used,
          attempted: newEnrollmentsCount,
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
          const createdUser = await User.create(
            [
              {
                fullName: row.fullName,
                email: row.email,
                phone: row.phone || '',
                password: input.defaultPassword || crypto.randomBytes(12).toString('base64url'),
                role: UserRole.STUDENT,
                isEmailVerified: false,
              },
            ],
            { session }
          );

          await StudentProfile.create(
            [
              {
                userId: createdUser[0]._id,
                collegeName: college.collegeName,
                enrollmentNumber: row.enrollmentNumber,
                degree: row.degree,
                branch: row.branch,
                yearOfStudy: row.yearOfStudy,
              },
            ],
            { session }
          );

          user = { _id: createdUser[0]._id };
          userByEmail.set(row.email, { _id: user._id, role: UserRole.STUDENT });
          created++;
        } else {
          // Existing student: ensure profile is updated with the latest CSV attributes
          const profileUpdate: Record<string, any> = { collegeName: college.collegeName };
          if (row.enrollmentNumber) profileUpdate.enrollmentNumber = row.enrollmentNumber;
          if (row.degree) profileUpdate.degree = row.degree;
          if (row.branch) profileUpdate.branch = row.branch;
          if (row.yearOfStudy) profileUpdate.yearOfStudy = row.yearOfStudy;

          await StudentProfile.updateOne(
            { userId: user._id },
            { $setOnInsert: { userId: user._id }, $set: profileUpdate },
            { upsert: true, runValidators: true, session }
          ).exec();

          const userUpdate: Record<string, any> = {};
          if (row.fullName) userUpdate.fullName = row.fullName;
          if (row.phone) userUpdate.phone = row.phone;

          if (Object.keys(userUpdate).length > 0) {
            await User.updateOne({ _id: user._id }, { $set: userUpdate }, { session }).exec();
          }

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
          },
          { session }
        ).exec();
      }

      // 7. Optionally enroll all imported students into the supplied events.
      let eventsEnrolled = 0;
      if (input.eventIds && input.eventIds.length > 0) {
        eventsEnrolled = await this.enrollCohortInEvents(
          importable,
          input.eventIds,
          userByEmail,
          session
        );
      }

      await session.commitTransaction();

      const refreshed = await collegeProfileService.getProfileOrThrow(userId);
      return {
        created,
        linkedExisting,
        alreadyInCohort,
        eventsEnrolled,
        skipped,
        cohort: await collegeCohortService.computeCohortStatus(refreshed, session),
      };
    } catch (error: any) {
      await session.abortTransaction();
      logger.error('Import college students error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const collegeImportService = CollegeImportService.getInstance();
