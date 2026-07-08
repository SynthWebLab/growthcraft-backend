import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { catalogueService } from '../services/catalogue.service';
import { bootcampService } from '@/modules/bootcamps/services/bootcamp.service';
import { CatalogueQueryParams, CatalogueItem } from '@/common/interfaces/catalogue.interface';
import { logger } from '@/common/utils/logger.util';
import { NotFoundError } from '@/common/errors/NotFoundError';

export class CatalogueController {
  private static instance: CatalogueController;

  private constructor() {}

  public static getInstance(): CatalogueController {
    if (!CatalogueController.instance) {
      CatalogueController.instance = new CatalogueController();
    }
    return CatalogueController.instance;
  }

  /**
   * Get courses (public endpoint)
   * GET /api/v1/courses
   */
  public async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: CatalogueQueryParams = {
        type: 'course', // Force type to course
        cursor: req.query.cursor as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        category: req.query.category ? (req.query.category as string).trim() : undefined,
        level: req.query.level ? (req.query.level as string).trim() : undefined,
        difficultyLevel: req.query.difficultyLevel ? (req.query.difficultyLevel as string).trim() : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).trim() : undefined,
        search: req.query.search ? (req.query.search as string).trim() : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await catalogueService.getCatalogueItems(queryParams);
      
      const processedItems = await this.processCatalogueCTAs(req, result.items);

      res.status(200).json({
        ...result,
        items: processedItems
      });
    } catch (error: any) {
      logger.error('Get courses controller error:', error);
      next(error);
    }
  }

  /**
   * Get bootcamps (public endpoint)
   * GET /api/v1/bootcamps
   */
  public async getBootcamps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: CatalogueQueryParams = {
        type: 'bootcamp', // Force type to bootcamp
        cursor: req.query.cursor as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        category: req.query.category ? (req.query.category as string).trim() : undefined,
        mode: req.query.mode ? (req.query.mode as string).trim() as any : undefined,
        status: req.query.status ? (req.query.status as string).trim() : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).trim() : undefined,
        search: req.query.search ? (req.query.search as string).trim() : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await catalogueService.getCatalogueItems(queryParams);

      const processedItems = await this.processCatalogueCTAs(req, result.items);

      res.status(200).json({
        ...result,
        items: processedItems
      });
    } catch (error: any) {
      logger.error('Get bootcamps controller error:', error);
      next(error);
    }
  }

  /**
   * Get bootcamp by slug (public endpoint)
   * GET /api/v1/bootcamps/:slug
   */
  public async getBootcampBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const bootcamp = await bootcampService.getBootcampBySlug(slug);

      if (!bootcamp) {
        throw new NotFoundError(`Bootcamp with slug '${slug}' not found`, 'BOOTCAMP_NOT_FOUND');
      }

      const processedBootcamp = await this.processSingleBootcamp(req, bootcamp);

      res.status(200).json({ bootcamp: processedBootcamp });
    } catch (error: any) {
      logger.error('Get bootcamp by slug controller error:', error);
      next(error);
    }
  }

  /**
   * Get bootcamp by ID (public endpoint)
   * GET /api/v1/bootcamps/id/:id
   */
  public async getBootcampById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const bootcamp = await bootcampService.getBootcampById(id);

      if (!bootcamp) {
        throw new NotFoundError(`Bootcamp with ID '${id}' not found`, 'BOOTCAMP_NOT_FOUND');
      }

      const processedBootcamp = await this.processSingleBootcamp(req, bootcamp);

      res.status(200).json({ bootcamp: processedBootcamp });
    } catch (error: any) {
      logger.error('Get bootcamp by ID controller error:', error);
      next(error);
    }
  }

  /**
   * Get workshops only (public endpoint)
   * GET /api/v1/workshops
   */
  public async getWorkshops(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: CatalogueQueryParams = {
        type: 'workshop', // Force type to workshop
        cursor: req.query.cursor as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        category: req.query.category ? (req.query.category as string).trim() : undefined,
        mode: req.query.mode ? (req.query.mode as string).trim() as any : undefined,
        status: req.query.status ? (req.query.status as string).trim() : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).trim() : undefined,
        search: req.query.search ? (req.query.search as string).trim() : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await catalogueService.getCatalogueItems(queryParams);

      const processedItems = await this.processCatalogueCTAs(req, result.items);

      res.status(200).json({
        ...result,
        items: processedItems
      });
    } catch (error: any) {
      logger.error('Get workshops controller error:', error);
      next(error);
    }
  }

  /**
   * Get hackathons only (public endpoint)
   * GET /api/v1/hackathons
   */
  public async getHackathons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: CatalogueQueryParams = {
        type: 'hackathon', // Force type to hackathon
        cursor: req.query.cursor as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        category: req.query.category ? (req.query.category as string).trim() : undefined,
        mode: req.query.mode ? (req.query.mode as string).trim() as any : undefined,
        status: req.query.status ? (req.query.status as string).trim() : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).trim() : undefined,
        search: req.query.search ? (req.query.search as string).trim() : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await catalogueService.getCatalogueItems(queryParams);

      const processedItems = await this.processCatalogueCTAs(req, result.items);

      res.status(200).json({
        ...result,
        items: processedItems
      });
    } catch (error: any) {
      logger.error('Get hackathons controller error:', error);
      next(error);
    }
  }

  /**
   * Get all events (bootcamps + workshops + hackathons) (public endpoint)
   * GET /api/v1/events
   */
  public async getAllEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: CatalogueQueryParams = {
        type: req.query.type ? (req.query.type as string).trim() as any : undefined,
        cursor: req.query.cursor as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        category: req.query.category ? (req.query.category as string).trim() : undefined,
        mode: req.query.mode ? (req.query.mode as string).trim() as any : undefined,
        status: req.query.status ? (req.query.status as string).trim() : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).trim() : undefined,
        search: req.query.search ? (req.query.search as string).trim() : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await catalogueService.getCatalogueItems(queryParams);

      const processedItems = await this.processCatalogueCTAs(req, result.items);

      res.status(200).json({
        ...result,
        items: processedItems
      });
    } catch (error: any) {
      logger.error('Get all events controller error:', error);
      next(error);
    }
  }

  private async processCatalogueCTAs(req: Request, items: CatalogueItem[]): Promise<CatalogueItem[]> {
    const userId = req.user?.userId;

    // By default, initialize all fields for all items
    const processedItems = items.map(item => {
      const obj = { ...item };
      obj.isEnrolled = false;
      obj.hasCallbackRequest = false;
      return obj;
    });

    if (!userId || processedItems.length === 0) {
      return processedItems;
    }

    if (req.user?.role === 'college') {
      try {
        const { collegeDashboardService } = await import('@/modules/colleges/services/college-dashboard.service');
        const { CollegeProfile } = await import('@/database/models/CollegeProfile.model');
        const { EventEnrollment } = await import('@/database/models/EventEnrollment.model');

        const college = await CollegeProfile.findOne({ userId }).exec();
        if (college) {
          const studentUserIds = await collegeDashboardService.resolveStudentUserIds(college);
          if (studentUserIds.length > 0) {
            const eventItems = processedItems.filter(item => item.type !== 'course');
            const eventIds = eventItems.map(item => item.id);
            if (eventIds.length > 0) {
              const counts = await EventEnrollment.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
                {
                  $match: {
                    eventId: { $in: eventIds.map(id => new mongoose.Types.ObjectId(id)) },
                    userId: { $in: studentUserIds },
                    status: { $in: ['pending', 'confirmed'] }
                  }
                },
                {
                  $group: {
                    _id: '$eventId',
                    count: { $sum: 1 }
                  }
                }
              ]);
              const countMap = new Map(counts.map(c => [String(c._id), c.count]));
              processedItems.forEach(item => {
                if (item.type !== 'course') {
                  item.enrolledCount = countMap.get(item.id) || 0;
                }
              });
            }
          } else {
            // No students in cohort, set all to 0
            processedItems.forEach(item => {
              if (item.type !== 'course') {
                item.enrolledCount = 0;
              }
            });
          }
        }
      } catch (err: any) {
        logger.error('Error processing college event enrollment counts:', err);
      }
    }

    // Separate course and event items
    const courseItems = processedItems.filter(item => item.type === 'course');
    const eventItems = processedItems.filter(item => item.type !== 'course');

    const courseIds = courseItems.map(item => item.id);
    const eventIds = eventItems.map(item => item.id);

    // Fetch in parallel
    const [
      enrolledCourseIds,
      callbackCourseIds,
      enrolledEventIds,
      callbackEventIds
    ] = await Promise.all([
      // Courses
      courseIds.length > 0 
        ? (async () => {
            const { enrollmentService } = await import('@/modules/courses/services/enrollment.service');
            return enrollmentService.getUserEnrolledCourseIds(userId, courseIds);
          })()
        : Promise.resolve(new Set<string>()),
      courseIds.length > 0 
        ? (async () => {
            const { enrollmentService } = await import('@/modules/courses/services/enrollment.service');
            return enrollmentService.getUserPendingCallbackCourseIds(userId, courseIds);
          })()
        : Promise.resolve(new Set<string>()),
      
      // Events
      eventIds.length > 0
        ? (async () => {
            const { eventEnrollmentService } = await import('@/modules/events/services/event-enrollment.service');
            return eventEnrollmentService.getUserEnrolledEventIds(userId, eventIds);
          })()
        : Promise.resolve(new Set<string>()),
      eventIds.length > 0
        ? (async () => {
            const { eventEnrollmentService } = await import('@/modules/events/services/event-enrollment.service');
            return eventEnrollmentService.getUserPendingCallbackEventIds(userId, eventIds);
          })()
        : Promise.resolve(new Set<string>())
    ]);

    return processedItems.map(item => {
      let isEnrolled = false;
      let hasCallback = false;

      if (item.type === 'course') {
        isEnrolled = enrolledCourseIds.has(item.id);
        hasCallback = callbackCourseIds.has(item.id);
      } else {
        isEnrolled = enrolledEventIds.has(item.id);
        hasCallback = callbackEventIds.has(item.id);
      }

      item.isEnrolled = isEnrolled;
      item.hasCallbackRequest = hasCallback;

      if (isEnrolled) {
        item.primaryCTA = 'Already Enrolled';
        item.secondaryCTA = null;
      } else if (hasCallback) {
        if (item.primaryCTA && item.primaryCTA.toLowerCase().includes('register')) {
          item.primaryCTA = 'Interest Registered';
          item.secondaryCTA = null;
        } else if (item.primaryCTA && item.primaryCTA.toLowerCase().includes('callback')) {
          item.primaryCTA = 'Callback Requested';
          item.secondaryCTA = null;
        } else {
          item.secondaryCTA = 'Callback Requested';
        }
      }

      return item;
    });
  }

  private async processSingleBootcamp(req: Request, bootcamp: any): Promise<any> {
    let bootcampData = typeof bootcamp.toJSON === 'function' ? bootcamp.toJSON() : { ...bootcamp };
    const userId = req.user?.userId;

    if (userId) {
      const bootcampIdStr = (bootcampData._id || bootcampData.id).toString();
      const { eventEnrollmentService } = await import('@/modules/events/services/event-enrollment.service');
      const isEnrolled = await eventEnrollmentService.isUserEnrolled(userId, bootcampIdStr);
      const { hasCallbackRequest } = await eventEnrollmentService.getEnrollmentStatus(userId, bootcampIdStr);

      bootcampData.isEnrolled = isEnrolled;
      bootcampData.hasCallbackRequest = hasCallbackRequest;

      if (isEnrolled) {
        bootcampData.primaryCTA = 'Already Enrolled';
        bootcampData.secondaryCTA = null;
      } else if (hasCallbackRequest) {
        if (bootcampData.primaryCTA && bootcampData.primaryCTA.toLowerCase().includes('register')) {
          bootcampData.primaryCTA = 'Interest Registered';
          bootcampData.secondaryCTA = null;
        } else if (bootcampData.primaryCTA && bootcampData.primaryCTA.toLowerCase().includes('callback')) {
          bootcampData.primaryCTA = 'Callback Requested';
          bootcampData.secondaryCTA = null;
        } else {
          bootcampData.secondaryCTA = 'Callback Requested';
        }
      }
    } else {
      bootcampData.isEnrolled = false;
      bootcampData.hasCallbackRequest = false;
    }

    return bootcampData;
  }
}

export const catalogueController = CatalogueController.getInstance();
