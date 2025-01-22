import { TimeSlot } from './timeslot.model';

export interface Availability {
  date: string;
  slots: TimeSlot[];
  availableHours: string[];
  isAbsent?: boolean;
}
  