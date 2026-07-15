import { HostedModel } from '../models/hosted.model';
import { GuestService } from './guest.service';

export const hostedService = new GuestService(HostedModel);
