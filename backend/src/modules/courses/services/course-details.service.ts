import { CourseDetails, ICourseDetails } from '@/database/models/CourseDetails.model';
import { Course } from '@/database/models/Course.model';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { logger } from '@/common/utils/logger.util';

class CourseDetailsService {
  /**
   * Get course details by slug
   */
  public async getCourseDetailsBySlug(slug: string): Promise<ICourseDetails> {
    try {
      const courseDetails = await CourseDetails.findOne({ slug }).exec();

      if (!courseDetails) {
        throw new NotFoundError('Course details not found', 'COURSE_DETAILS_NOT_FOUND');
      }

      return courseDetails;
    } catch (error) {
      logger.error('Get course details by slug error:', error);
      throw error;
    }
  }

  /**
   * Get course overview by slug
   */
  public async getCourseOverview(slug: string) {
    try {
      const courseDetails = await CourseDetails.findOne({ slug }).select('overview slug').exec();

      if (!courseDetails) {
        throw new NotFoundError('Course details not found', 'COURSE_DETAILS_NOT_FOUND');
      }

      return courseDetails.overview;
    } catch (error) {
      logger.error('Get course overview error:', error);
      throw error;
    }
  }

  /**
   * Get course curriculum by slug
   */
  public async getCourseCurriculum(slug: string) {
    try {
      const courseDetails = await CourseDetails.findOne({ slug }).select('curriculum slug').exec();

      if (!courseDetails) {
        throw new NotFoundError('Course details not found', 'COURSE_DETAILS_NOT_FOUND');
      }

      return courseDetails.curriculum;
    } catch (error) {
      logger.error('Get course curriculum error:', error);
      throw error;
    }
  }

  /**
   * Get course instructor details by slug
   */
  public async getCourseInstructor(slug: string) {
    try {
      const courseDetails = await CourseDetails.findOne({ slug })
        .select('instructorDetails slug')
        .exec();

      if (!courseDetails) {
        throw new NotFoundError('Course details not found', 'COURSE_DETAILS_NOT_FOUND');
      }

      return courseDetails.instructorDetails;
    } catch (error) {
      logger.error('Get course instructor error:', error);
      throw error;
    }
  }

  /**
   * Get course FAQs by slug
   */
  public async getCourseFAQs(slug: string) {
    try {
      const courseDetails = await CourseDetails.findOne({ slug }).select('faqs slug').exec();

      if (!courseDetails) {
        throw new NotFoundError('Course details not found', 'COURSE_DETAILS_NOT_FOUND');
      }

      return courseDetails.faqs;
    } catch (error) {
      logger.error('Get course FAQs error:', error);
      throw error;
    }
  }

  /**
   * Create or update course details
   */
  public async upsertCourseDetails(slug: string, detailsData: Partial<ICourseDetails>): Promise<ICourseDetails> {
    try {
      // Check if course exists
      const course = await Course.findOne({ slug }).exec();
      if (!course) {
        throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
      }

      // Upsert course details
      const courseDetails = await CourseDetails.findOneAndUpdate(
        { slug },
        {
          ...detailsData,
          courseId: course._id,
          slug,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      ).exec();

      return courseDetails;
    } catch (error) {
      logger.error('Upsert course details error:', error);
      throw error;
    }
  }
}

export const courseDetailsService = new CourseDetailsService();
