import { Router } from 'express';
import authRoutes from '@/modules/auth/routes/auth.routes';
import userRoutes from '@/modules/auth/routes/user.routes';
import courseRoutes from '@/modules/courses/routes/course.routes';
import publicCatalogueRoutes from '@/modules/public/routes/catalogue.routes';
import publicBatchRoutes from '@/modules/public/routes/batch.routes';
import reservationRoutes from '@/modules/reservations/routes/reservation.routes';
import adminRoutes from '@/modules/admin/routes/admin.routes';
import eventEnrollmentRoutes from '@/modules/events/routes/event-enrollment.routes';
import eventDetailsRoutes from '@/modules/events/routes/event-details.routes';
import trainingProgramRoutes from '@/modules/training-programs/routes/training-program.routes';
import studentRoutes from '@/modules/students/routes/student.routes';
import collegeRoutes from '@/modules/colleges/routes/college.routes';
import leadRoutes from '@/modules/leads/routes/lead.routes';
import mentorRoutes from '@/modules/mentor/routes/mentor.routes';
import { employerRouter, talentRouter, publicJobsRouter } from '@/modules/employers/routes/employer.routes';
import notificationRoutes from '@/modules/notifications/routes/notification.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/events', eventEnrollmentRoutes);
router.use('/events', eventDetailsRoutes);
router.use('/training-programs', trainingProgramRoutes);
router.use('/reservations', reservationRoutes);
router.use('/students', studentRoutes);
router.use('/colleges', collegeRoutes);
router.use('/admin', adminRoutes);
router.use('/leads', leadRoutes);
router.use('/mentor', mentorRoutes);
router.use('/employers', employerRouter);
router.use('/talent', talentRouter);
router.use('/public/jobs', publicJobsRouter);
router.use('/notifications', notificationRoutes);



// Public routes (no auth required)
router.use('/', publicCatalogueRoutes);
router.use('/', publicBatchRoutes);

export default router;

