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
router.use('/admin', adminRoutes);

// Public routes (no auth required)
router.use('/', publicCatalogueRoutes);
router.use('/', publicBatchRoutes);

export default router;
