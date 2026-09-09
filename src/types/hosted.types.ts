import { GuestIndividual } from './guest.types';

export type CompanionshipMember = Pick<
  GuestIndividual,
  | 'hometownCode'
  | 'prefixCode'
  | 'continent'
  | 'region'
  | 'fullName'
  | 'gender'
  | 'whatsapp'
  | 'livingInCode'
  | 'hometown'
  | 'livingIn'
  | 'urlProfileCs'
  | 'instagram'
  | 'birthDate'
> & {
  ambassador: boolean;
  isFirstTime: boolean;
};
