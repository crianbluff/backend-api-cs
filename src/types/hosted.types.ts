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
  | 'hometownCity'
  | 'hometownState'
  | 'livingInCity'
  | 'livingInState'
  | 'urlProfileCs'
  | 'instagram'
  | 'birthDate'
> & {
  ambassador: boolean;
  isFirstTime: boolean;
};
