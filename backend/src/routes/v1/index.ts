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
router.use('/courses', courseRoutes);
router.use('/reservations', reservationRoutes);

// Public catalogue routes (no auth required)
router.use('/', publicCatalogueRoutes);

export default router;
