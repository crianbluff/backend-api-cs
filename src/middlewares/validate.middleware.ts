import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendBadRequest } from '../utils/response';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Returns an Express middleware that validates a specific part of the request
 * against a Zod schema. On failure, responds with 400 and structured errors.
 */
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      sendBadRequest(res, 'Validation failed', errors);
      return;
    }

    // Attach parsed & coerced data back to the request
    req[part] = result.data;
    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string>[] {
  return error.errors.map((e) => ({
    field: e.path.join('.') || 'root',
    message: e.message,
  }));
}
