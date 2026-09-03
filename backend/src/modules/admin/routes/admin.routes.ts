import path from 'path';
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '@/common/middleware/authenticate.middleware';
import { authorize } from '@/common/middleware/authorize.middleware';
import { UserRole } from '@/common/constants/user.constants';
import { ValidationError } from '@/common/errors/ValidationError';
import { batchController } from '../controllers/batch.controller';
import { enrollmentController } from '../controllers/enrollment.controller';
import { userController } from '../controllers/user.controller';
import { ambassadorController } from '../controllers/ambassador.controller';
import { mentorPayoutController } from '../controllers/mentor-payout.controller';
import { attendanceController } from '../controllers/attendance.controller';
import { courseAdminController } from '../controllers/course-admin.controller';
import { trainingProgramAdminController } from '../controllers/training-program-admin.controller';
import { eventAdminController } from '../controllers/event-admin.controller';
import { collegeAdminController } from '../controllers/college-admin.controller';
import { employerAdminController } from '../controllers/employer-admin.controller';
import { analyticsController } from '../controllers/analytics.controller';
import { auditLogController } from '../controllers/audit-log.controller';
import { uploadController } from '../controllers/upload.controller';
import { enquiryAdminController } from '../controllers/enquiry-admin.controller';
import { registrationAdminController } from '../controllers/registration-admin.controller';
import metricsJobRoutes from './metrics-job.routes';

const router = Router();

// Max file size for admin image uploads (5MB) to prevent OOM / memory exhaustion
export const ADMIN_UPLOAD_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: ADMIN_UPLOAD_MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(ext);

    if (mimeType && extName) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
    }
  },
});

// All admin routes require authentication and SuperAdmin or Ops role by default
router.use(authenticate);
router.use(authorize([UserRole.SUPER_ADMIN, UserRole.OPS]));

/**
 * Batches management
 */
router.post('/batches', (req: Request, res: Response, next: NextFunction) => {
  void batchController.createBatch(req, res, next);
});
router.get('/batches', (req: Request, res: Response, next: NextFunction) => {
  void batchController.listBatches(req, res, next);
});
router.get('/batches/:id', (req: Request, res: Response, next: NextFunction) => {
  void batchController.getBatchById(req, res, next);
});
router.patch('/batches/:id', (req: Request, res: Response, next: NextFunction) => {
  void batchController.updateBatch(req, res, next);
});
router.patch('/batches/:id/mentor', (req: Request, res: Response, next: NextFunction) => {
  void batchController.assignMentor(req, res, next);
});
router.patch('/batches/:id/mentors', (req: Request, res: Response, next: NextFunction) => {
  void batchController.assignMentors(req, res, next);
});

/**
 * Enrollments & Users
 */
router.post('/enrollments', (req: Request, res: Response, next: NextFunction) => {
  void enrollmentController.createEnrollment(req, res, next);
});
router.get('/users', (req: Request, res: Response, next: NextFunction) => {
  void userController.listUsers(req, res, next);
});
router.get('/users/:id', (req: Request, res: Response, next: NextFunction) => {
  void userController.getUserById(req, res, next);
});
router.patch('/users/:id/status', authorize([UserRole.SUPER_ADMIN]), (req: Request, res: Response, next: NextFunction) => {
  void userController.updateUserStatus(req, res, next);
});

/**
 * Job management
 */
router.use('/jobs', metricsJobRoutes);

/**
 * Ambassador management
 */
router.get('/ambassadors', (req: Request, res: Response, next: NextFunction) => {
  void ambassadorController.listAmbassadors(req, res, next);
});
router.patch('/ambassadors/:userId/payout', (req: Request, res: Response, next: NextFunction) => {
  void ambassadorController.confirmPayout(req, res, next);
});
router.patch('/ambassadors/:userId/activate', (req: Request, res: Response, next: NextFunction) => {
  void ambassadorController.toggleActivation(req, res, next);
});

/**
 * Mentor Payouts & Availability (Admin view)
 */
router.get('/mentors', (req: Request, res: Response, next: NextFunction) => {
  void mentorPayoutController.listMentors(req, res, next);
});
router.get('/mentors/available', (req: Request, res: Response, next: NextFunction) => {
  void mentorPayoutController.getAvailableMentors(req, res, next);
});
router.get('/mentors/:mentorId', (req: Request, res: Response, next: NextFunction) => {
  void mentorPayoutController.getMentorDetails(req, res, next);
});
router.get('/mentors/:mentorId/check-ins', (req: Request, res: Response, next: NextFunction) => {
  void mentorPayoutController.getMentorCheckIns(req, res, next);
});
router.patch('/mentors/:mentorId/check-ins/:checkInId/verify', (req: Request, res: Response, next: NextFunction) => {
  void mentorPayoutController.verifyCheckIn(req, res, next);
});
router.get('/mentors/:mentorId/payouts', (req: Request, res: Response, next: NextFunction) => {
  void mentorPayoutController.getMentorPayouts(req, res, next);
});
router.get('/mentor-payouts', (req: Request, res: Response, next: NextFunction) => {
  void mentorPayoutController.getGlobalPayoutOverview(req, res, next);
});
router.get('/mentors/:mentorId/availability', (req: Request, res: Response, next: NextFunction) => {
  void mentorPayoutController.getMentorAvailability(req, res, next);
});

// Payout processing requires SuperAdmin privilege
router.post('/mentors/:mentorId/payout', authorize([UserRole.SUPER_ADMIN]), (req: Request, res: Response, next: NextFunction) => {
  void mentorPayoutController.recordPayout(req, res, next);
});
router.patch('/mentor-payouts/:payoutId/approve', authorize([UserRole.SUPER_ADMIN]), (req: Request, res: Response, next: NextFunction) => {
  void mentorPayoutController.approvePayout(req, res, next);
});
router.patch('/mentor-payouts/:payoutId/confirm', authorize([UserRole.SUPER_ADMIN]), (req: Request, res: Response, next: NextFunction) => {
  void mentorPayoutController.confirmPayout(req, res, next);
});

/**
 * Student Attendance Management
 */
router.post('/attendance', (req: Request, res: Response, next: NextFunction) => {
  void attendanceController.markAttendance(req, res, next);
});
router.get('/attendance', (req: Request, res: Response, next: NextFunction) => {
  void attendanceController.listAttendance(req, res, next);
});
router.get('/attendance/batch/:batchId/summary', (req: Request, res: Response, next: NextFunction) => {
  void attendanceController.getBatchAttendanceSummary(req, res, next);
});

/**
 * Revenue Report (SuperAdmin only)
 */
router.get('/revenue', authorize([UserRole.SUPER_ADMIN]), (req: Request, res: Response, next: NextFunction) => {
  void analyticsController.getRevenueReport(req, res, next);
});

/**
 * General Analytics & Audit Logs
 */
router.get('/analytics', (req: Request, res: Response, next: NextFunction) => {
  void analyticsController.getAnalyticsOverview(req, res, next);
});
router.get('/audit-logs', authorize([UserRole.SUPER_ADMIN]), (req: Request, res: Response, next: NextFunction) => {
  void auditLogController.getAuditLogs(req, res, next);
});

/**
 * Course Admin CRUD
 */
router.get('/courses', (req: Request, res: Response, next: NextFunction) => {
  void courseAdminController.listCourses(req, res, next);
});
router.post('/courses', (req: Request, res: Response, next: NextFunction) => {
  void courseAdminController.createCourse(req, res, next);
});
router.put('/courses/:id', (req: Request, res: Response, next: NextFunction) => {
  void courseAdminController.updateCourse(req, res, next);
});
router.delete('/courses/:id', (req: Request, res: Response, next: NextFunction) => {
  void courseAdminController.deleteCourse(req, res, next);
});
router.patch('/courses/:id/publish', (req: Request, res: Response, next: NextFunction) => {
  void courseAdminController.publishCourse(req, res, next);
});

/**
 * Training Program Admin CRUD
 */
router.get('/training-programs', (req: Request, res: Response, next: NextFunction) => {
  void trainingProgramAdminController.listTrainingPrograms(req, res, next);
});
router.post('/training-programs', (req: Request, res: Response, next: NextFunction) => {
  void trainingProgramAdminController.createTrainingProgram(req, res, next);
});
router.put('/training-programs/:id', (req: Request, res: Response, next: NextFunction) => {
  void trainingProgramAdminController.updateTrainingProgram(req, res, next);
});
router.patch('/training-programs/:id/publish', (req: Request, res: Response, next: NextFunction) => {
  void trainingProgramAdminController.publishTrainingProgram(req, res, next);
});
router.delete('/training-programs/:id', (req: Request, res: Response, next: NextFunction) => {
  void trainingProgramAdminController.deleteTrainingProgram(req, res, next);
});

/**
 * Event Admin CRUD
 */
router.get('/events', (req: Request, res: Response, next: NextFunction) => {
  void eventAdminController.listEvents(req, res, next);
});
router.post('/events', (req: Request, res: Response, next: NextFunction) => {
  void eventAdminController.createEvent(req, res, next);
});
router.put('/events/:id', (req: Request, res: Response, next: NextFunction) => {
  void eventAdminController.updateEvent(req, res, next);
});
router.patch('/events/:id/publish', (req: Request, res: Response, next: NextFunction) => {
  void eventAdminController.publishEvent(req, res, next);
});
router.patch('/events/:id/status', (req: Request, res: Response, next: NextFunction) => {
  void eventAdminController.toggleEventStatus(req, res, next);
});
router.delete('/events/:id', (req: Request, res: Response, next: NextFunction) => {
  void eventAdminController.deleteEvent(req, res, next);
});

/**
 * College Admin CRUD
 */
router.get('/colleges', (req: Request, res: Response, next: NextFunction) => {
  void collegeAdminController.listColleges(req, res, next);
});
router.put('/colleges/:id', (req: Request, res: Response, next: NextFunction) => {
  void collegeAdminController.updateCollege(req, res, next);
});
router.delete('/colleges/:id', (req: Request, res: Response, next: NextFunction) => {
  void collegeAdminController.deleteCollege(req, res, next);
});

/**
 * Employer Admin CRUD
 */
router.get('/employers', (req: Request, res: Response, next: NextFunction) => {
  void employerAdminController.listEmployers(req, res, next);
});
router.put('/employers/:id', (req: Request, res: Response, next: NextFunction) => {
  void employerAdminController.updateEmployer(req, res, next);
});
router.delete('/employers/:id', (req: Request, res: Response, next: NextFunction) => {
  void employerAdminController.deleteEmployer(req, res, next);
});

/**
 * Enquiry / Lead management
 */
router.get('/enquiries', (req: Request, res: Response, next: NextFunction) => {
  void enquiryAdminController.listEnquiries(req, res, next);
});
router.patch('/enquiries/:id', (req: Request, res: Response, next: NextFunction) => {
  void enquiryAdminController.updateEnquiry(req, res, next);
});
router.delete('/enquiries/:id', (req: Request, res: Response, next: NextFunction) => {
  void enquiryAdminController.deleteEnquiry(req, res, next);
});

/**
 * Registrations management
 */
router.get('/registrations', (req: Request, res: Response, next: NextFunction) => {
  void registrationAdminController.listRegistrations(req, res, next);
});
router.patch('/registrations/:id', (req: Request, res: Response, next: NextFunction) => {
  void registrationAdminController.updateRegistration(req, res, next);
});
router.delete('/registrations/:id', (req: Request, res: Response, next: NextFunction) => {
  void registrationAdminController.deleteRegistration(req, res, next);
});

/**
 * Image upload with local fallback
 */
router.post('/upload', upload.single('file'), (req: Request, res: Response, next: NextFunction) => {
  void uploadController.uploadImage(req, res, next);
});

export default router;
