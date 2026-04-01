import { Router } from 'express';
import authRoutes from '@/modules/auth/routes/auth.routes';
import userRoutes from '@/modules/auth/routes/user.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
