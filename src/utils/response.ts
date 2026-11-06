import { Response } from 'express';
import { ApiResponse, PaginatedApiResponse, PaginatedResponse } from '../types/api-response.types';

export function sendSuccess<T>(res: Response, data: T, message = 'Success', statusCode = 200): void {
  res.status(statusCode).json({ success: true, message, data } as ApiResponse<T>);
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): void {
  sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(res: Response, result: PaginatedResponse<T>, message = 'Success'): void {
  const body: PaginatedApiResponse<T> = {
    success: true,
    message,
    data: result.data,
    monthlyStats: result.monthlyStats,
    pagination: {
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
      hasNextPage: result.pagination.hasNextPage,
      hasPrevPage: result.pagination.hasPrevPage,
    },
  };
  res.status(200).json(body);
}

export function sendError(res: Response, message: string, statusCode: number, errors?: Record<string, string>[]): void {
  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) } as ApiResponse);
}

export function sendNotFound(res: Response, message = 'Resource not found'): void {
  sendError(res, message, 404);
}

export function sendBadRequest(res: Response, message = 'Bad request', errors?: Record<string, string>[]): void {
  sendError(res, message, 400, errors);
}

export function sendInternalError(res: Response): void {
  sendError(res, 'An unexpected error occurred on the server.', 500);
}
