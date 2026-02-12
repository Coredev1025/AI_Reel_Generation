import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

const app = express();

// ─── Security ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin: [
    config.frontendUrl,
    'http://localhost:3000',
    'http://localhost:4200',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ─── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Compression ──────────────────────────────────────────
app.use(compression());

// ─── Logging ──────────────────────────────────────────────
const morganFormat = config.env === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
}));

// ─── Rate Limiting ────────────────────────────────────────
if (config.env === 'production') {
  app.use('/api', apiLimiter);
}

// ─── Static Files ─────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// ─── API Routes ───────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ──────────────────────────────────────────
app.use(notFoundHandler);

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

export default app;
