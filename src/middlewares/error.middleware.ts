import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn(`[AppError] ${err.statusCode} – ${err.message}`);
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Mongoose duplicate key
  const mongoErr = err as NodeJS.ErrnoException & { code?: number };
  if (mongoErr.name === 'MongoServerError' && mongoErr.code === 11000) {
    sendError(res, 'Duplicate key error — resource already exists', 409);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    sendError(res, err.message, 422);
    return;
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    sendError(res, 'Invalid data format', 400);
    return;
  }

  logger.error('[Unhandled Error]', err);
  sendError(res, 'Internal server error', 500);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}
