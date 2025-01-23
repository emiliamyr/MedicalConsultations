import { TimeSlot } from './timeslot.model';

export interface Availability {
  id?: string;
  date: string;
  slots: TimeSlot[];
  availableHours: string[];
  isAbsent?: boolean;
}
  