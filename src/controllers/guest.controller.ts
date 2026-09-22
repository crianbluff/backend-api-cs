import { Request, Response, NextFunction } from 'express';
import { GuestService, guestService } from '../services/guest.service';
import { sendSuccess, sendCreated, sendNotFound, sendPaginated } from '../utils/response';
import { GuestQueryInput, UpdateGuestInput } from '../utils/validation';
import { logger } from '../utils/logger';

export class GuestController {
  constructor(protected readonly service: GuestService) {}

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.service.findAll(req.query as unknown as GuestQueryInput);

      sendPaginated(res, result, 'Guests retrieved successfully');
    } catch (error) {
      logger.error('[getAll]', error);
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const guest = await this.service.findById(id);

      if (!guest) {
        sendNotFound(res, `No guest found with ID "${id}"`);
        return;
      }

      sendSuccess(res, guest, 'Guest retrieved successfully');
    } catch (error) {
      logger.error('[getById]', error);
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];

      const guest = await this.service.createSolo(req.body, files);

      sendCreated(res, guest, 'Guest created successfully');
    } catch (error) {
      logger.error('[create]', error);
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const files = (req.files as Express.Multer.File[]) ?? [];

      const { photoIds, ...input } = req.body as UpdateGuestInput;

      console.log('[GuestController] guestId:', id);
      console.log('[GuestController] photoIds:', photoIds);

      const guest = await this.service.update(id, input, files, photoIds);

      if (!guest) {
        sendNotFound(res, `No guest found with ID "${id}"`);
        return;
      }

      sendSuccess(res, guest, 'Guest updated successfully');
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
        sendNotFound(res, `No guest found with ID "${id}"`);
        return;
      }

      sendSuccess(res, null, `Guest "${id}" deleted successfully`);
    } catch (error) {
      logger.error('[delete]', error);
      next(error);
    }
  }
}

export const guestController = new GuestController(guestService);
