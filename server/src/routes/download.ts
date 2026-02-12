import { Router, Response, NextFunction } from 'express';
import axios from 'axios';
import { videoService } from '../services/videoService';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// GET /api/download/:videoId
router.get('/:videoId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { url, filename, contentType } = await videoService.getDownloadStream(
      req.params.videoId,
      req.user!.id
    );

    if (!url) {
      res.status(404).json({ error: 'Video file not found' });
      return;
    }

    // Fetch the video from Supabase signed URL and stream it
    const response = await axios.get(url, { responseType: 'stream' });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    response.data.pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
