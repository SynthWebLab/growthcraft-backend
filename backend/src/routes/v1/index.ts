import { Router } from 'express';
import authRoutes from '@/modules/auth/routes/auth.routes';
import userRoutes from '@/modules/auth/routes/user.routes';
import courseRoutes from '@/modules/courses/routes/course.routes';
import publicCatalogueRoutes from '@/modules/public/routes/catalogue.routes';
import reservationRoutes from '@/modules/reservations/routes/reservation.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Public catalogue routes (no auth required) - MUST come before /courses to avoid route conflicts
router.use('/', publicCatalogueRoutes);

// Course routes (authenticated/admin routes)
router.use('/courses', courseRoutes);

router.use('/reservations', reservationRoutes);

export default router;
