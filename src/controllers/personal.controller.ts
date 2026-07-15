import { GuestController } from './guest.controller';
import { personalService } from '../services/personal.service';

export class PersonalController extends GuestController {
  constructor() {
    super(personalService);
  }
}

export const personalController = new PersonalController();
