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

// ─── Mongoose error helpers ───────────────────────────────────────────────────

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

interface MongooseValidationError extends Error {
  errors: Record<string, { message: string; path: string; kind: string; value: unknown }>;
}

interface MongooseCastError extends Error {
  path: string;
  value: unknown;
  kind: string;
}

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Known operational error (thrown intentionally by the app)
  if (err instanceof AppError) {
    logger.warn(`[AppError] ${err.statusCode} – ${err.message}`);
    sendError(res, err.message, err.statusCode);
    return;
  }

  // MongoDB duplicate key (e.g. duplicate guestId)
  const mongoErr = err as MongoServerError;
  if (mongoErr.name === 'MongoServerError' && mongoErr.code === 11000) {
    const duplicatedField = mongoErr.keyValue ? Object.keys(mongoErr.keyValue).join(', ') : 'unknown field';
    const duplicatedValue = mongoErr.keyValue ? Object.values(mongoErr.keyValue).join(', ') : '';
    sendError(
      res,
      `A guest with this ${duplicatedField} already exists${duplicatedValue ? ` (value: "${duplicatedValue}")` : ''}`,
      409
    );
    return;
  }

  // Mongoose schema validation error (model-level)
  if (err.name === 'ValidationError') {
    const validationErr = err as MongooseValidationError;
    const fieldErrors = Object.values(validationErr.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    const fieldNames = fieldErrors.map((e) => `"${e.field}"`).join(', ');
    sendError(res, `Validation failed for field${fieldErrors.length > 1 ? 's' : ''}: ${fieldNames}`, 422, fieldErrors);
    return;
  }

  // Mongoose cast error (wrong type for a field)
  if (err.name === 'CastError') {
    const castErr = err as MongooseCastError;
    sendError(res, `Invalid value for field "${castErr.path}": expected ${castErr.kind}, got "${castErr.value}"`, 400);
    return;
  }

  // Fallback — unexpected error
  logger.error('[Unhandled Error]', err);
  sendError(res, 'An unexpected error occurred on the server. Please try again later.', 500);
}

// ─── 404 handler for unknown routes ──────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `The route "${req.method} ${req.originalUrl}" does not exist. Check the URL and try again.`, 404);
}
