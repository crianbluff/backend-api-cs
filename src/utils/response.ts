import { Response } from 'express';
import { ApiResponse, PaginatedApiResponse, PaginatedResponse } from '../types/guest.types';

export function sendSuccess<T>(res: Response, data: T, message = 'Success', statusCode = 200): void {
  const body: ApiResponse<T> = { success: true, message, data };
  res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Sends a paginated response with pagination fields at the top level.
 * Shape: { success, message, data: [], total, page, limit, totalPages, hasNextPage, hasPrevPage }
 */
export function sendPaginated<T>(res: Response, result: PaginatedResponse<T>, message = 'Success'): void {
  const body: PaginatedApiResponse<T> = {
    success: true,
    message,
    data: result.data,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  };
  res.status(200).json(body);
}

export function sendError(res: Response, message: string, statusCode: number, errors?: Record<string, string>[]): void {
  const body: ApiResponse = { success: false, message, ...(errors && { errors }) };
  res.status(statusCode).json(body);
}

export function sendNotFound(res: Response, message = 'Resource not found'): void {
  sendError(res, message, 404);
}

export function sendBadRequest(res: Response, message = 'Bad request', errors?: Record<string, string>[]): void {
  sendError(res, message, 400, errors);
}

export function sendInternalError(res: Response): void {
  sendError(res, 'An unexpected error occurred on the server. Please try again later.', 500);
}
