import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { sendBadRequest } from '../utils/response';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const { summary, errors } = formatZodErrors(result.error, part);
      sendBadRequest(res, summary, errors);
      return;
    }
    req[part] = result.data;
    next();
  };
}

function humanMessage(issue: ZodIssue): string {
  const field = issue.path.join('.') || 'value';
  switch (issue.code) {
    case 'invalid_type':
      return issue.received === 'undefined'
        ? `"${field}" is required but was not provided`
        : `"${field}" must be of type ${issue.expected}, but received ${issue.received}`;
    case 'too_small':
      if (issue.type === 'string')
        return `"${field}" is too short (minimum ${issue.minimum} character${issue.minimum === 1 ? '' : 's'})`;
      if (issue.type === 'number') return `"${field}" must be at least ${issue.minimum}`;
      if (issue.type === 'array')
        return `"${field}" must have at least ${issue.minimum} item${issue.minimum === 1 ? '' : 's'}`;
      return issue.message;
    case 'too_big':
      if (issue.type === 'string') return `"${field}" is too long (maximum ${issue.maximum} characters)`;
      if (issue.type === 'number') return `"${field}" must be at most ${issue.maximum}`;
      if (issue.type === 'array') return `"${field}" must have at most ${issue.maximum} items`;
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
    default:
      return issue.message;
  }
}

function formatZodErrors(error: ZodError, part: RequestPart): { summary: string; errors: Record<string, string>[] } {
  const errors = error.errors.map((i) => ({ field: i.path.join('.') || part, message: humanMessage(i) }));
  const missingFields = error.errors
    .filter((i) => i.code === 'invalid_type' && (i as { received?: string }).received === 'undefined')
    .map((i) => `"${i.path.join('.')}"`)
    .join(', ');
  const summary = missingFields
    ? `Missing required field${missingFields.split(',').length > 1 ? 's' : ''}: ${missingFields}`
    : errors.length === 1
      ? errors[0].message
      : `${errors.length} validation errors found`;
  return { summary, errors };
}
