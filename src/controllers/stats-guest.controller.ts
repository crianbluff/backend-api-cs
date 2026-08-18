import { Request, Response, NextFunction } from 'express';
import { statsGuestService } from '../services/stats-guest.service';
import { sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';

export class StatsGuestController {
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await statsGuestService.getStats();

      sendSuccess(res, stats, 'Guest statistics retrieved successfully');
    } catch (error) {
      logger.error('[StatsGuestController.getStats]', error);
      next(error);
    }
  }
}

export const statsGuestController = new StatsGuestController();
