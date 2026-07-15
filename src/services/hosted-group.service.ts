import { HostedModel } from '../models/hosted.model';
import { GroupService } from './group.service';

export const hostedGroupService = new GroupService(HostedModel);
