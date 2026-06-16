import { Router, Request, Response, NextFunction } from 'express';
import { leadController } from '../controllers/lead.controller';
import { leadValidator } from '../validators/lead.validator';

const router = Router();

/**
 * @swagger
 * /leads:
 *   post:
 *     summary: Create a new lead or enquiry (Public)
 *     tags: [Leads]
 *     description: Submit contact form or About page enquiry form to capture a lead.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               role:
 *                 type: string
 *                 example: Student
 *               subject:
 *                 type: string
 *                 example: Enquiry about bootcamp
 *               message:
 *                 type: string
 *                 example: I want to know more about the program options.
 *               organization:
 *                 type: string
 *                 example: GrowthCraft University
 *               source:
 *                 type: string
 *                 example: about_enquiry
 *     responses:
 *       201:
 *         description: Lead created successfully
 *       400:
 *         description: Validation failed
 */
router.post(
  '/',
  leadValidator.create,
  (req: Request, res: Response, next: NextFunction) => {
    void leadController.createLead(req, res, next);
  }
);

export default router;
