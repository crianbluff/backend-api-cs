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

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}
interface MongooseValidationError extends Error {
  errors: Record<string, { message: string; path: string }>;
}
interface MongooseCastError extends Error {
  path: string;
  value: unknown;
  kind: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }
  const mongoErr = err as MongoServerError;
  if (mongoErr.name === 'MongoServerError' && mongoErr.code === 11000) {
    const field = mongoErr.keyValue ? Object.keys(mongoErr.keyValue).join(', ') : 'unknown';
    const value = mongoErr.keyValue ? Object.values(mongoErr.keyValue).join(', ') : '';
    sendError(res, `A guest with this ${field} already exists${value ? ` (value: "${value}")` : ''}`, 409);
    return;
  }
  if (err.name === 'ValidationError') {
    const ve = err as MongooseValidationError;
    const fieldErrors = Object.values(ve.errors).map((e) => ({ field: e.path, message: e.message }));
    sendError(
      res,
      `Validation failed for field${fieldErrors.length > 1 ? 's' : ''}: ${fieldErrors.map((e) => `"${e.field}"`).join(', ')}`,
      422,
      fieldErrors
    );
    return;
  }
  if (err.name === 'CastError') {
    const ce = err as MongooseCastError;
    sendError(res, `Invalid value for field "${ce.path}": expected ${ce.kind}, got "${ce.value}"`, 400);
    return;
  }
  logger.error('[Unhandled Error]', err);
  sendError(res, 'An unexpected error occurred on the server. Please try again later.', 500);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `The route "${req.method} ${req.originalUrl}" does not exist.`, 404);
}
