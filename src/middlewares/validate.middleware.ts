import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
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
      const { summary, errors } = formatZodErrors(result.error, part);
      sendBadRequest(res, summary, errors);
      return;
    }

    // Attach parsed & coerced data back to the request
    req[part] = result.data;
    next();
  };
}

function humanMessage(issue: ZodIssue): string {
  const field = issue.path.join('.') || 'value';

  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined') {
        return `"${field}" is required but was not provided`;
      }
      return `"${field}" must be of type ${issue.expected}, but received ${issue.received}`;

    case 'too_small':
      if (issue.type === 'string') {
        return `"${field}" is too short (minimum ${issue.minimum} character${issue.minimum === 1 ? '' : 's'})`;
      }
      if (issue.type === 'number') {
        return `"${field}" must be at least ${issue.minimum}`;
      }
      if (issue.type === 'array') {
        return `"${field}" must have at least ${issue.minimum} item${issue.minimum === 1 ? '' : 's'}`;
      }
      return issue.message;

    case 'too_big':
      if (issue.type === 'string') {
        return `"${field}" is too long (maximum ${issue.maximum} characters)`;
      }
      if (issue.type === 'number') {
        return `"${field}" must be at most ${issue.maximum}`;
      }
      if (issue.type === 'array') {
        return `"${field}" must have at most ${issue.maximum} items`;
      }
      return issue.message;

    case 'invalid_enum_value':
      return `"${field}" must be one of: ${issue.options.map((o) => `"${o}"`).join(', ')}. Received: "${issue.received}"`;

    case 'invalid_literal':
      return `"${field}" must be exactly ${JSON.stringify(issue.expected)}`;

    case 'invalid_union':
      return `"${field}" did not match any allowed format. Ensure "wasACouple" is set correctly and all required fields are present`;

    case 'invalid_union_discriminator':
      return `"${field}" must be one of: ${issue.options.map((o) => `"${String(o)}"`).join(', ')}`;

    case 'unrecognized_keys':
      return `Unexpected field${issue.keys.length > 1 ? 's' : ''}: ${issue.keys.map((k) => `"${k}"`).join(', ')}`;

    case 'custom':
      return issue.message;

    default:
      return issue.message;
  }
}

function formatZodErrors(error: ZodError, part: RequestPart): { summary: string; errors: Record<string, string>[] } {
  const errors = error.errors.map((issue) => ({
    field: issue.path.join('.') || part,
    message: humanMessage(issue),
  }));

  const missingFields = error.errors
    .filter((i) => i.code === 'invalid_type' && (i as { received?: string }).received === 'undefined')
    .map((i) => `"${i.path.join('.')}"`)
    .join(', ');

  let summary: string;
  if (missingFields) {
    const count = missingFields.split(',').length;
    summary = `Missing required field${count > 1 ? 's' : ''}: ${missingFields}`;
  } else if (errors.length === 1) {
    summary = errors[0].message;
  } else {
    summary = `${errors.length} validation error${errors.length > 1 ? 's' : ''} found`;
  }

  return { summary, errors };
}
