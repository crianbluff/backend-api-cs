import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { rateLimiter } from './middlewares/rateLimiter.middleware';
import { globalErrorHandler, notFoundHandler } from './middlewares/error.middleware';
import guestRoutes from './routes/guest.routes';

export function createApp(): Application {
  const app = express();

  // ─── Security & parsing ───────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(rateLimiter);

  // ─── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', env: env.NODE_ENV });
  });

  // ─── Swagger docs ─────────────────────────────────────────────────────────
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Guests API Docs' }));

  // Expose raw swagger.yaml / swagger.json
  app.get('/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // ─── API routes ───────────────────────────────────────────────────────────
  const BASE = `/api/${env.API_VERSION}`;
  app.use(`${BASE}/guests`, guestRoutes);

  // ─── 404 & error handlers ─────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
