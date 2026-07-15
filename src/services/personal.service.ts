import { PersonalModel } from '../models/personal.model';
import { GuestService } from './guest.service';

export const personalService = new GuestService(PersonalModel);
