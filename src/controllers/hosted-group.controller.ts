import { GroupController } from './group.controller';
import { hostedGroupService } from '../services/hosted-group.service';

export class HostedGroupController extends GroupController {
  constructor() {
    super(hostedGroupService);
  }
}

export const hostedGroupController = new HostedGroupController();
