import { GuestController } from './guest.controller';
import { hostedService } from '../services/hosted.service';

export class HostedController extends GuestController {
  constructor() {
    super(hostedService);
  }
}

export const hostedController = new HostedController();
