import { Router, Request, Response, NextFunction } from 'express';
import { eventDetailsController } from '../controllers/event-details.controller';
import { optionalAuthenticate } from '@/common/middleware/authenticate.middleware';

const router = Router();

// ============================================
// EVENT DETAILS ROUTES
// ============================================

/**
 * @swagger
 * /events/{slug}/details:
 *   get:
 *     summary: Get complete event details
 *     tags: [Event Details]
 *     description: Get all details for an event including overview, agenda, venue, mentors, and FAQs
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Event slug (URL-friendly identifier)
 *         example: react-performance-optimization
 *     responses:
 *       200:
 *         description: Event details retrieved successfully
 *       404:
 *         description: Event details not found
 */
router.get('/:slug/details', optionalAuthenticate, (req: Request, res: Response, next: NextFunction) => {
  void eventDetailsController.getAllDetails(req, res, next);
});

/**
 * @swagger
 * /events/{slug}/overview:
 *   get:
 *     summary: Get event overview
 *     tags: [Event Details]
 *     description: |
 *       Get event overview including:
 *       - About the event
 *       - What you'll learn
 *       - Prerequisites
 *       - What's included
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Event slug
 *         example: react-performance-optimization
 *     responses:
 *       200:
 *         description: Event overview retrieved successfully
 *       404:
 *         description: Event details not found
 */
router.get('/:slug/overview', (req: Request, res: Response, next: NextFunction) => {
  void eventDetailsController.getOverview(req, res, next);
});

/**
 * @swagger
 * /events/{slug}/agenda:
 *   get:
 *     summary: Get event agenda/schedule
 *     tags: [Event Details]
 *     description: Get the timeline and schedule of the event with time slots and activities
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Event slug
 *         example: react-performance-optimization
 *     responses:
 *       200:
 *         description: Event agenda retrieved successfully
 *       404:
 *         description: Event details not found
 */
router.get('/:slug/agenda', (req: Request, res: Response, next: NextFunction) => {
  void eventDetailsController.getAgenda(req, res, next);
});

/**
 * @swagger
 * /events/{slug}/venue:
 *   get:
 *     summary: Get event venue details
 *     tags: [Event Details]
 *     description: |
 *       Get venue information including:
 *       - Type (Online/Offline/Hybrid)
 *       - Online meeting link and platform
 *       - Physical address and map link
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Event slug
 *         example: react-performance-optimization
 *     responses:
 *       200:
 *         description: Event venue retrieved successfully
 *       404:
 *         description: Event details not found
 */
router.get('/:slug/venue', (req: Request, res: Response, next: NextFunction) => {
  void eventDetailsController.getVenue(req, res, next);
});

/**
 * @swagger
 * /events/{slug}/mentors:
 *   get:
 *     summary: Get event mentors
 *     tags: [Event Details]
 *     description: |
 *       Get information about event mentors/instructors including:
 *       - Name, designation, company
 *       - Bio and expertise
 *       - Social links
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Event slug
 *         example: react-performance-optimization
 *     responses:
 *       200:
 *         description: Event mentors retrieved successfully
 *       404:
 *         description: Event details not found
 */
router.get('/:slug/mentors', (req: Request, res: Response, next: NextFunction) => {
  void eventDetailsController.getMentors(req, res, next);
});

/**
 * @swagger
 * /events/{slug}/faqs:
 *   get:
 *     summary: Get event FAQs
 *     tags: [Event Details]
 *     description: Get frequently asked questions and answers about the event
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Event slug
 *         example: react-performance-optimization
 *     responses:
 *       200:
 *         description: Event FAQs retrieved successfully
 *       404:
 *         description: Event details not found
 */
router.get('/:slug/faqs', (req: Request, res: Response, next: NextFunction) => {
  void eventDetailsController.getFAQs(req, res, next);
});

export default router;
