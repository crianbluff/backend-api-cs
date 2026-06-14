import { Request, Response, NextFunction } from 'express';
import { guestService } from '../services/guest.service';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendPaginated } from '../utils/response';
import { CreateGuestInput, UpdateGuestInput, GuestQueryInput } from '../utils/validation';
import { logger } from '../utils/logger';

export class GuestController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await guestService.findAll(req.query as unknown as GuestQueryInput);
      sendPaginated(res, result, 'Guests retrieved successfully');
    } catch (error) {
      logger.error('[GuestController.getAll]', error);
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const guest = await guestService.findById(id);
      if (!guest) {
        sendNotFound(res, `No guest found with ID "${id}"`);
        return;
      }
      sendSuccess(res, guest, 'Guest retrieved successfully');
    } catch (error) {
      logger.error('[GuestController.getById]', error);
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const guest = await guestService.create(req.body as CreateGuestInput);
      sendCreated(res, guest, 'Guest created successfully');
    } catch (error) {
      logger.error('[GuestController.create]', error);
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateGuestInput;
      if (!input || Object.keys(input).length === 0) {
        sendBadRequest(res, 'Request body is empty. Please provide at least one field to update.');
        return;
      }
      let updated;
      try {
        updated = await guestService.update(id, input);
      } catch (serviceError) {
        if (serviceError instanceof Error && serviceError.message.includes('wasACouple')) {
          sendBadRequest(
            res,
            'The "wasACouple" field cannot be changed after creation. Delete and recreate the guest instead.'
          );
          return;
        }
        throw serviceError;
      }
      if (!updated) {
        sendNotFound(res, `No guest found with ID "${id}"`);
        return;
      }
      sendSuccess(res, updated, 'Guest updated successfully');
    } catch (error) {
      logger.error('[GuestController.update]', error);
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await guestService.delete(id);
      if (!deleted) {
        sendNotFound(res, `No guest found with ID "${id}"`);
        return;
      }
      sendSuccess(res, null, `Guest "${id}" deleted successfully`);
    } catch (error) {
      logger.error('[GuestController.delete]', error);
      next(error);
    }
  }
}

export const guestController = new GuestController();
