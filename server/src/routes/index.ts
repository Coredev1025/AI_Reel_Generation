import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import projectRoutes from './projects';
import imageRoutes from './images';
import videoRoutes from './videos';
import uploadRoutes from './upload';
import uploadLogoRoutes from './uploadLogo';
import musicRoutes from './music';
import processingRoutes from './processing';
import downloadRoutes from './download';
import promptRoutes from './prompts';
import notificationRoutes from './notifications';
import analyticsRoutes from './analytics';
import adminRoutes from './admin';
import shareRoutes from './share';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/images', imageRoutes);
router.use('/videos', videoRoutes);
router.use('/upload', uploadRoutes);
router.use('/upload-logo', uploadLogoRoutes);
router.use('/music', musicRoutes);
router.use('/process', processingRoutes);
router.use('/processing', processingRoutes);
router.use('/download', downloadRoutes);
router.use('/prompts', promptRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/share', shareRoutes);

export default router;
