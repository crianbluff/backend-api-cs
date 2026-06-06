import { Response } from 'express';
import { ApiResponse } from '../types/guest.types';

export function sendSuccess<T>(res: Response, data: T, message = 'Success', statusCode = 200): void {
  const body: ApiResponse<T> = { success: true, message, data };
  res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): void {
  sendSuccess(res, data, message, 201);
}

export function sendError(res: Response, message: string, statusCode: number, errors?: Record<string, string>[]): void {
  const body: ApiResponse = { success: false, message, ...(errors && { errors }) };
  res.status(statusCode).json(body);
}

export function sendNotFound(res: Response, resource = 'Resource'): void {
  sendError(res, `${resource} not found`, 404);
}

export function sendBadRequest(res: Response, message = 'Bad request', errors?: Record<string, string>[]): void {
  sendError(res, message, 400, errors);
}

export function sendInternalError(res: Response): void {
  sendError(res, 'Internal server error', 500);
}
