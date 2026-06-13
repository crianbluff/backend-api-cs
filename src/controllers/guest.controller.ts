import { Request, Response, NextFunction } from 'express';
import { guestService } from '../services/guest.service';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../utils/response';
import { CreateGuestInput, UpdateGuestInput, GuestQueryInput } from '../utils/validation';
import { logger } from '../utils/logger';

export class GuestController {
  /**
   * GET /guests
   * Returns all guests with pagination, filtering and date range support.
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as GuestQueryInput;
      const result = await guestService.findAll(query);
      sendSuccess(res, result, 'Guests retrieved successfully');
    } catch (error) {
      logger.error('[GuestController.getAll]', error);
      next(error);
    }
  }

  /**
   * GET /guests/:id
   * Returns a single guest by guestId.
   */
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

  /**
   * POST /guests
   * Creates a new guest (solo or couple).
   */

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateGuestInput;
      const guest = await guestService.create(input);
      sendCreated(res, guest, 'Guest created successfully');
    } catch (error) {
      logger.error('[GuestController.create]', error);
      next(error);
    }
  }

  /**
   * PUT /guests/:id
   * Partially updates a guest by guestId.
   */
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
            'The "wasACouple" field cannot be changed after a guest is created. ' +
              'Delete this record and create a new one if the type needs to change.'
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

  /**
   * DELETE /guests/:id
   * Deletes a guest by guestId.
   */
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
