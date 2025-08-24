import { Router } from 'express';
import { userRoutes } from './user.routes.js';
import { authRoutes } from './auth.routes.js';

const router = Router();

// Mount user routes
router.use('/users', userRoutes);
router.use('/auth', authRoutes);

export { router as userRoutes };
