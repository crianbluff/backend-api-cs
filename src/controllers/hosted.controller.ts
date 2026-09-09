import { Request, Response, NextFunction } from 'express';
import { HostedService, hostedService } from '../services/hosted.service';
import { CreateHostedInput, HostedQueryInput, UpdateHostedInput } from '../utils/validation';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendPaginated } from '../utils/response';
import { logger } from '../utils/logger';

export class HostedController {
  constructor(protected readonly service: HostedService) {}

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.service.findAll(req.query as unknown as HostedQueryInput);
      sendPaginated(res, result, 'Hosted records retrieved successfully');
    } catch (error) {
      logger.error('[getAll]', error);
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const hosted = await this.service.findById(id);

      if (!hosted) {
        sendNotFound(res, `No hosted record found with ID "${id}"`);
        return;
      }

      sendSuccess(res, hosted, 'Hosted record retrieved successfully');
    } catch (error) {
      logger.error('[getById]', error);
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateHostedInput;
      const hosted = await this.service.create(input);
      sendCreated(res, hosted, 'Hosted record created successfully');
    } catch (error) {
      logger.error('[create]', error);
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateHostedInput;
      if (!input || Object.keys(input).length === 0) {
        sendBadRequest(res, 'Request body is empty. Please provide at least one field to update.');
        return;
      }

      const updated = await this.service.update(id, input);
      if (!updated) {
        sendNotFound(res, `No hosted record found with ID "${id}"`);
        return;
      }

      sendSuccess(res, updated, 'Hosted record updated successfully');
    } catch (error) {
      logger.error('[update]', error);
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.service.delete(id);

      if (!deleted) {
        sendNotFound(res, `No hosted record found with ID "${id}"`);
        return;
      }
      sendSuccess(res, null, `Hosted record "${id}" deleted successfully`);
    } catch (error) {
      logger.error('[delete]', error);
      next(error);
    }
  }
}

export const hostedController = new HostedController(hostedService);
