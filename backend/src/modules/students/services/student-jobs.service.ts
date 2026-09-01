import mongoose from 'mongoose';
import { JobPosting } from '@/database/models/JobPosting.model';
import { JobApplication, IJobApplication } from '@/database/models/JobApplication.model';
import { EmployerProfile } from '@/database/models/EmployerProfile.model';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';
import { ConflictError } from '@/common/errors/ConflictError';
import { logger } from '@/common/utils/logger.util';

export class StudentJobsService {
  private static instance: StudentJobsService | null = null;

  public constructor() {}

  public static getInstance(): StudentJobsService {
    if (!StudentJobsService.instance) {
      StudentJobsService.instance = new StudentJobsService();
    }
    return StudentJobsService.instance;
  }

  public static setInstance(instance: StudentJobsService | null): void {
    StudentJobsService.instance = instance;
  }

  public static resetInstance(): void {
    StudentJobsService.instance = null;
  }

  /**
   * Get all active job listings for a student, marked with their application status
   */
  public async getJobs(studentId: string) {
    try {
      const activeJobs = await JobPosting.find({ status: 'Active' })
        .sort({ createdAt: -1 })
        .exec();

      const resolvedJobs = await Promise.all(
        activeJobs.map(async job => {
          const profile = await EmployerProfile.findOne({ userId: job.hiringPartnerId })
            .select('companyName website')
            .exec();
          
          const application = await JobApplication.findOne({
            jobId: job._id,
            studentId,
          }).exec();

          return {
            id: job._id.toString(),
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            skillsRequired: job.skillsRequired,
            location: job.location,
            locationType: job.locationType,
            salaryRange: job.salaryRange,
            jobType: job.jobType,
            companyName: profile?.companyName || 'GrowthCraft Partner Company',
            companyWebsite: profile?.website,
            applicationDeadline: job.applicationDeadline,
            postedAt: job.createdAt,
            hasApplied: !!application,
            applicationStatus: application ? application.status : null,
          };
        })
      );

      return resolvedJobs;
    } catch (error: any) {
      logger.error('StudentJobsService getJobs error:', error);
      throw error;
    }
  }

  /**
   * Submit an application for a job listing
   */
  public async applyJob(
    studentId: string,
    jobId: string,
    applyData: { resumeUrl: string; coverLetter?: string }
  ): Promise<IJobApplication> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the job
      const job = await JobPosting.findOne({ _id: jobId, status: 'Active' }).session(session).exec();
      if (!job) {
        throw new NotFoundError('Active job posting not found');
      }

      // Check if already applied
      const existingApplication = await JobApplication.findOne({ jobId, studentId }).session(session).exec();
      if (existingApplication) {
        throw new ConflictError('You have already applied for this job');
      }

      // Create application
      const application = new JobApplication({
        jobId,
        studentId,
        resumeUrl: applyData.resumeUrl,
        coverLetter: applyData.coverLetter,
        status: 'Applied',
      });

      // Increment applicantsCount on JobPosting
      job.applicantsCount = (job.applicantsCount || 0) + 1;

      // Batch save both documents concurrently within the session
      const [savedApplication] = await Promise.all([
        application.save({ session }),
        job.save({ session }),
      ]);

      await session.commitTransaction();
      logger.info(`Student ${studentId} successfully applied to Job ${jobId}`);
      return savedApplication;
    } catch (error: any) {
      await session.abortTransaction();
      logger.error('StudentJobsService applyJob error:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get all applications submitted by the student
   */
  public async getApplications(studentId: string) {
    try {
      const applications = await JobApplication.find({ studentId })
        .sort({ appliedAt: -1 })
        .populate({
          path: 'jobId',
          select: 'title location locationType salaryRange jobType hiringPartnerId',
        })
        .exec();

      const resolvedApplications = await Promise.all(
        applications.map(async app => {
          const job = app.jobId as any;
          let companyName = 'GrowthCraft Partner Company';
          let companyWebsite = '';

          if (job?.hiringPartnerId) {
            const profile = await EmployerProfile.findOne({ userId: job.hiringPartnerId })
              .select('companyName website')
              .exec();
            if (profile) {
              companyName = profile.companyName;
              companyWebsite = profile.website || '';
            }
          }

          return {
            id: app._id.toString(),
            status: app.status,
            appliedAt: app.appliedAt,
            resumeUrl: app.resumeUrl,
            coverLetter: app.coverLetter,
            job: job ? {
              id: job._id.toString(),
              title: job.title,
              location: job.location,
              locationType: job.locationType,
              salaryRange: job.salaryRange,
              jobType: job.jobType,
              companyName,
              companyWebsite,
            } : null,
          };
        })
      );

      return resolvedApplications;
    } catch (error: any) {
      logger.error('StudentJobsService getApplications error:', error);
      throw error;
    }
  }
}

export const studentJobsService = StudentJobsService.getInstance();
