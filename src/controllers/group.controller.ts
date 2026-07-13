import { Request, Response, NextFunction } from 'express';
import { groupService } from '../services/group.service';
import { CreateGroupGuestInput } from '../utils/validation';
import { sendCreated, sendNotFound, sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';

export class GroupController {
  async getByGroupId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { groupId } = req.params;
      const members = await groupService.findByGroupId(groupId);
      if (!members.length) {
        sendNotFound(res, `No group found with groupId "${groupId}"`);
        return;
      }
      sendSuccess(res, members, 'Group retrieved successfully');
    } catch (error) {
      logger.error('[getByGroupId]', error);
      next(error);
    }
  }

  async createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupService.createGroup(req.body as CreateGroupGuestInput);

      sendCreated(res, group, `Group of ${group.length} guests created successfully`);
    } catch (error) {
      logger.error('[createGroup]', error);
      next(error);
    }
  }

  async updateGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { groupId } = req.params;

      const updated = await groupService.updateGroup(groupId, req.body);

      if (!updated.length) {
        sendNotFound(res, `No group found with groupId "${groupId}"`);
        return;
      }

      sendSuccess(res, updated, 'Group updated successfully');
    } catch (error) {
      logger.error('[updateGroup]', error);
      next(error);
    }
  }

  async deleteGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { groupId } = req.params;

      const count = await groupService.deleteGroup(groupId);

      if (!count) {
        sendNotFound(res, `No group found with groupId "${groupId}"`);
        return;
      }

      sendSuccess(res, null, `Group "${groupId}" deleted (${count} members removed)`);
    } catch (error) {
      logger.error('[deleteGroup]', error);
      next(error);
    }
  }
}

export const groupController = new GroupController();
