import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import multer from 'multer';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Multer
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      sendError(res, 'A guest can have a maximum of 5 photos', 400);
      return;
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'Each photo cannot exceed 10 MB', 400);
      return;
    }

    sendError(res, 'Invalid photo upload', 400);
    return;
  }

  const mongoErr = err as MongoServerError;

  if (mongoErr.name === 'MongoServerError' && mongoErr.code === 11000) {
    const field = mongoErr.keyValue ? Object.keys(mongoErr.keyValue).join(', ') : 'unknown';

    const value = mongoErr.keyValue ? Object.values(mongoErr.keyValue).join(', ') : '';

    sendError(res, `A guest with this ${field} already exists${value ? ` (value: "${value}")` : ''}`, 409);
    return;
  }

  // ... resto de tu handler
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `The route "${req.method} ${req.originalUrl}" does not exist.`, 404);
}
